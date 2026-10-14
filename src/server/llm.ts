// Gemini AI client using the official Google Gen AI SDK (@google/genai).
import { ApiError, GoogleGenAI, type Content } from "@google/genai";

/** A system instruction plus the conversation, in Gemini's request shape. */
export interface Prompt {
  systemInstruction: string;
  contents: Content[];
}

export interface LLMConfig {
  ai: GoogleGenAI;
  model: string;
}

/** Output cap for answers. */
const MAX_TOKENS = 8192;
/** Output cap for the short search-query rewrite */
const REWRITE_MAX_TOKENS = 1024;

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
 * Configure Gemini AI. Uses GEMINI_API_KEY and defaults
 * to the free tier model `gemini-3-flash-preview`.
 */
export function resolveLLM(): LLMConfig {
  const apiKey = env("GEMINI_API_KEY");
  if (!apiKey) {
    throw new LLMError(
      500,
      "No Gemini API key found. Add a free GEMINI_API_KEY (from https://aistudio.google.com/apikey) to .env.local and restart the dev server."
    );
  }

  return {
    ai: new GoogleGenAI({ apiKey }),
    model: env("GEMINI_MODEL") || "gemini-3-flash-preview",
  };
}

function toLLMError(err: unknown): LLMError {
  if (!(err instanceof ApiError)) {
    return new LLMError(500, err instanceof Error ? err.message : "An error occurred with Gemini AI.");
  }
  // The SDK puts the JSON error body in the message
  let message = err.message;
  try {
    const parsed = JSON.parse(message);
    message = parsed?.error?.message || parsed?.message || message;
  } catch {
    /* plain text */
  }
  return new LLMError(err.status, message);
}

/**
 * Generate a short complete response (used for the search-query rewrite).
 */
export async function complete(
  config: LLMConfig,
  { systemInstruction, contents }: Prompt,
  { signal }: { signal?: AbortSignal } = {}
): Promise<string> {
  try {
    const response = await config.ai.models.generateContent({
      model: config.model,
      contents,
      config: { systemInstruction, temperature: 0, maxOutputTokens: REWRITE_MAX_TOKENS, abortSignal: signal },
    });
    return (response.text || "").trim();
  } catch (err: unknown) {
    throw toLLMError(err);
  }
}

/**
 * Stream responses using @google/genai SDK generateContentStream.
 */
export async function* stream(
  config: LLMConfig,
  { systemInstruction, contents }: Prompt,
  { signal }: { signal?: AbortSignal } = {}
): AsyncGenerator<string> {
  try {
    const responseStream = await config.ai.models.generateContentStream({
      model: config.model,
      contents,
      config: { systemInstruction, temperature: 0.3, maxOutputTokens: MAX_TOKENS, abortSignal: signal },
    });
    for await (const chunk of responseStream) {
      if (chunk.text) yield chunk.text;
    }
  } catch (err: unknown) {
    throw toLLMError(err);
  }
}

/** Turn Gemini API failures into messages a user can act on. */
export function friendlyLLMError(err: LLMError, config: LLMConfig): string {
  switch (err.status) {
    case 401:
    case 403:
      return "Gemini rejected the API key. Check GEMINI_API_KEY in .env.local, or create a new key at https://aistudio.google.com/apikey.";
    case 429:
      return "Gemini's free-tier rate limit was reached. Wait a minute and try again.";
    case 503:
      return "Gemini is currently experiencing high demand. Try again in a moment, or set GEMINI_MODEL=gemini-3.5-flash-lite in .env.local.";
    case 400:
    case 404:
      if (/model/i.test(err.message)) {
        return `The model "${config.model}" isn't available for this key. Set GEMINI_MODEL in .env.local to another free model (such as gemini-3-flash-preview or gemini-3.5-flash-lite).`;
      }
      return `Gemini couldn't process the request: ${err.message}`;
    default:
      return err.status >= 500 ? "Gemini is having trouble right now. Try again in a moment." : err.message;
  }
}
