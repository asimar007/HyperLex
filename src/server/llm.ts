// Gemini AI client using the official Google Gen AI SDK (@google/genai).
import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMConfig {
  provider: "gemini";
  label: string;
  apiKey: string;
  model: string;
  keySource: string;
  /** Output cap for answers. */
  maxTokens: number;
  /** Output cap for the short search-query rewrite */
  rewriteMaxTokens: number;
  /** Prompt budget: how many search results, and how much of each, the model reads */
  maxSources: number;
  sourceChars: number;
}

export class LLMError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "LLMError";
  }
}

const env = (name: string) => process.env[name]?.trim() || "";

/**
 * Configure Gemini AI. Uses GEMINI_API_KEY (or GOOGLE_API_KEY) and defaults
 * to the free tier model `gemini-3-flash-preview`.
 */
export function resolveLLM(): LLMConfig {
  const apiKey = env("GEMINI_API_KEY") || env("GOOGLE_API_KEY");
  if (!apiKey) {
    throw new LLMError(
      500,
      "No Gemini API key found. Add a free GEMINI_API_KEY (from https://aistudio.google.com/apikey) to .env.local and restart the dev server."
    );
  }

  // Free model: gemini-3-flash-preview (recommended by Google Gen AI SDK)
  const model = env("GEMINI_MODEL") || env("LLM_MODEL") || "gemini-3-flash-preview";
  const keySource = env("GEMINI_API_KEY") ? "GEMINI_API_KEY" : "GOOGLE_API_KEY";

  return {
    provider: "gemini",
    label: "Gemini",
    apiKey,
    model,
    keySource,
    maxTokens: 8192,
    rewriteMaxTokens: 1024,
    maxSources: 6,
    sourceChars: 1500,
  };
}

/**
 * Convert ChatMessage array into Gemini format:
 * - System messages -> systemInstruction
 * - User/Assistant messages -> contents with role "user" / "model"
 */
function toGeminiContentsAndSystem(messages: ChatMessage[]) {
  const systemParts: string[] = [];
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      if (msg.content) systemParts.push(msg.content);
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "" }] });
  }

  const systemInstruction = systemParts.join("\n\n") || undefined;
  return { contents, systemInstruction };
}

function extractErrorMessage(err: unknown): { status: number; message: string } {
  let status = 500;
  let message = "An error occurred with Gemini AI.";

  if (err && typeof err === "object") {
    if ("status" in err && typeof (err as { status?: unknown }).status === "number") {
      status = (err as { status: number }).status;
    }
    if ("message" in err && typeof (err as { message?: unknown }).message === "string") {
      const raw = (err as { message: string }).message;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.error?.message) {
          message = parsed.error.message;
        } else if (parsed?.message) {
          message = parsed.message;
        } else {
          message = raw;
        }
      } catch {
        message = raw;
      }
    }
  }

  return { status, message };
}

/**
 * Filters out <think>...</think> blocks from stream or text if present.
 */
export function createThinkFilter() {
  const OPEN = "<think>";
  const CLOSE = "</think>";
  let inThink = false;
  let pending = "";

  const holdBack = (text: string, tag: string): [string, string] => {
    const lt = text.lastIndexOf("<");
    if (lt !== -1 && tag.startsWith(text.slice(lt))) return [text.slice(0, lt), text.slice(lt)];
    return [text, ""];
  };

  return {
    push(chunk: string): string {
      let text = pending + chunk;
      pending = "";
      let out = "";
      while (text) {
        if (inThink) {
          const end = text.indexOf(CLOSE);
          if (end === -1) {
            pending = holdBack(text, CLOSE)[1];
            return out;
          }
          text = text.slice(end + CLOSE.length).replace(/^\s+/, "");
          inThink = false;
        } else {
          const start = text.indexOf(OPEN);
          if (start === -1) {
            const [emit, keep] = holdBack(text, OPEN);
            pending = keep;
            return out + emit;
          }
          out += text.slice(0, start);
          text = text.slice(start + OPEN.length);
          inThink = true;
        }
      }
      return out;
    },
    flush(): string {
      const rest = inThink ? "" : pending;
      pending = "";
      return rest;
    },
  };
}

/**
 * Generate a complete response using @google/genai SDK.
 */
export async function complete(
  config: LLMConfig,
  messages: ChatMessage[],
  { signal, maxTokens }: { signal?: AbortSignal; maxTokens?: number } = {}
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  const { contents, systemInstruction } = toGeminiContentsAndSystem(messages);

  try {
    const response = await ai.models.generateContent({
      model: config.model,
      contents,
      config: {
        systemInstruction,
        temperature: 0,
        maxOutputTokens: maxTokens ?? config.rewriteMaxTokens,
        abortSignal: signal,
      },
    });

    const text = response.text || "";
    return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  } catch (err: unknown) {
    if (err instanceof LLMError) throw err;
    const { status, message } = extractErrorMessage(err);
    throw new LLMError(status, message);
  }
}

/**
 * Stream responses using @google/genai SDK generateContentStream.
 */
export async function* stream(
  config: LLMConfig,
  messages: ChatMessage[],
  { signal }: { signal?: AbortSignal } = {}
): AsyncGenerator<string> {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  const { contents, systemInstruction } = toGeminiContentsAndSystem(messages);
  const think = createThinkFilter();

  try {
    const responseStream = await ai.models.generateContentStream({
      model: config.model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: config.maxTokens,
        abortSignal: signal,
      },
    });

    for await (const chunk of responseStream) {
      if (signal?.aborted) break;
      const textChunk = chunk.text;
      if (textChunk) {
        const filtered = think.push(textChunk);
        if (filtered) yield filtered;
      }
    }

    const rest = think.flush();
    if (rest) yield rest;
  } catch (err: unknown) {
    if (err instanceof LLMError) throw err;
    const { status, message } = extractErrorMessage(err);
    throw new LLMError(status, message);
  }
}

/** Turn Gemini API failures into messages a user can act on. */
export function friendlyLLMError(err: LLMError, config: LLMConfig): string {
  const name = config.label || "Gemini";
  switch (err.status) {
    case 401:
    case 403:
      return `${name} rejected the API key. Check ${config.keySource} in .env.local, or create a new key at https://aistudio.google.com/apikey.`;
    case 429:
      return `${name}'s free-tier rate limit was reached. Wait a minute and try again.`;
    case 503:
      return `${name} is currently experiencing high demand. Try again in a moment, or set GEMINI_MODEL=gemini-3.5-flash-lite in .env.local.`;
    case 400:
    case 404:
      if (/model/i.test(err.message)) {
        return `The model "${config.model}" isn't available for this key. Set GEMINI_MODEL or LLM_MODEL in .env.local to another free model (such as gemini-3-flash-preview or gemini-3.5-flash-lite).`;
      }
      return `${name} couldn't process the request: ${err.message}`;
    default:
      return err.status >= 500 ? `${name} is having trouble right now. Try again in a moment.` : err.message;
  }
}
