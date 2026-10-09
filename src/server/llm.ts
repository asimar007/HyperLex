// One client for any OpenAI-compatible chat API (Gemini, Groq, Mistral,
// OpenRouter, a local server...). Built on fetch, so no SDK is needed.

import { lines } from "@/lib/stream";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type ProviderId = "gemini" | "groq" | "mistral" | "custom";

interface Preset {
  label: string;
  baseUrl: string;
  defaultModel: string;
  /** Env var that may hold this provider's key, besides LLM_API_KEY */
  keyEnv: string;
  /** Where people create a key, for error messages */
  keyUrl: string;
  /** Output cap for answers. Includes thinking tokens on reasoning models. */
  maxTokens: number;
  /** Output cap for the short search-query rewrite */
  rewriteMaxTokens: number;
  /** Prompt budget: how many search results, and how much of each, the model reads */
  maxSources: number;
  sourceChars: number;
  /** Provider-specific request fields */
  extraBody?: Record<string, unknown>;
}

const PRESETS: Record<ProviderId, Preset> = {
  // Free tier with no card. Thinking can't be turned off on Gemini 3, so keep it
  // low for speed. Output caps include thinking tokens, hence the larger limits.
  gemini: {
    label: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-3.8-flash",
    keyEnv: "GEMINI_API_KEY",
    keyUrl: "https://aistudio.google.com/apikey",
    maxTokens: 8192,
    rewriteMaxTokens: 1024,
    maxSources: 6,
    sourceChars: 1500,
    extraBody: { reasoning_effort: "low" },
  },
  // Free plan is capped at about 8K tokens per minute, so the prompt is kept lean
  groq: {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "openai/gpt-oss-120b",
    keyEnv: "GROQ_API_KEY",
    keyUrl: "https://console.groq.com/keys",
    maxTokens: 1800,
    rewriteMaxTokens: 400,
    maxSources: 5,
    sourceChars: 900,
  },
  mistral: {
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    keyEnv: "MISTRAL_API_KEY",
    keyUrl: "https://console.mistral.ai/api-keys",
    maxTokens: 2048,
    rewriteMaxTokens: 256,
    maxSources: 6,
    sourceChars: 1500,
  },
  // Any other OpenAI-compatible endpoint: set LLM_BASE_URL and LLM_MODEL
  custom: {
    label: "Your AI provider",
    baseUrl: "",
    defaultModel: "",
    keyEnv: "LLM_API_KEY",
    keyUrl: "your provider's dashboard",
    maxTokens: 2048,
    rewriteMaxTokens: 512,
    maxSources: 6,
    sourceChars: 1200,
  },
};

export interface LLMConfig extends Preset {
  provider: ProviderId;
  apiKey: string;
  model: string;
  /** The env var the key was read from, so errors point at the right line */
  keySource: string;
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
 * Work out which provider to use. LLM_PROVIDER wins; otherwise use whichever
 * provider key is set, preferring the free ones.
 */
export function resolveLLM(): LLMConfig {
  const requested = env("LLM_PROVIDER").toLowerCase();
  let provider: ProviderId;

  if (requested) {
    if (!(requested in PRESETS)) {
      throw new LLMError(
        500,
        `LLM_PROVIDER "${requested}" isn't supported. Use gemini, groq, mistral or custom.`
      );
    }
    provider = requested as ProviderId;
  } else if (env("GEMINI_API_KEY")) provider = "gemini";
  else if (env("GROQ_API_KEY")) provider = "groq";
  else if (env("MISTRAL_API_KEY")) provider = "mistral";
  else if (env("LLM_BASE_URL")) provider = "custom";
  else {
    throw new LLMError(
      500,
      "No AI key found. Add a free GEMINI_API_KEY (from aistudio.google.com/apikey) to .env.local and restart the dev server."
    );
  }

  const preset = PRESETS[provider];
  const keySource = env("LLM_API_KEY") ? "LLM_API_KEY" : preset.keyEnv;
  const apiKey = env(keySource);
  const baseUrl = (provider === "custom" ? env("LLM_BASE_URL") : env("LLM_BASE_URL") || preset.baseUrl).replace(/\/+$/, "");
  const model = env("LLM_MODEL") || preset.defaultModel;

  if (!apiKey && provider !== "custom") {
    throw new LLMError(
      500,
      `${preset.keyEnv} is missing. Create a key at ${preset.keyUrl}, add it to .env.local and restart the dev server.`
    );
  }
  if (provider === "custom" && (!baseUrl || !model)) {
    throw new LLMError(500, "For a custom provider, set LLM_BASE_URL and LLM_MODEL in .env.local.");
  }

  return { ...preset, provider, apiKey, model, baseUrl, keySource };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    // Gemini sometimes wraps errors in an array
    const json = JSON.parse(text);
    const body = Array.isArray(json) ? json[0] : json;
    return (
      body?.error?.message ||
      body?.message ||
      (typeof body?.error === "string" ? body.error : "") ||
      body?.detail ||
      text
    );
  } catch {
    return text || res.statusText;
  }
}

/** POST with one retry on rate limits and transient server errors. */
async function post(config: LLMConfig, body: object, signal?: AbortSignal): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...config.extraBody, ...body }),
      signal,
    });
    if (res.ok) return res;

    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt === 0) {
      const wait = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(wait) && wait > 0 && wait <= 5 ? wait * 1000 : 1500);
      continue;
    }
    throw new LLMError(res.status, await readError(res));
  }
}

/** Content can be a string or typed chunks (e.g. thinking + text). Keep only text. */
function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && part.type === "text" && typeof part.text === "string" ? part.text : ""
      )
      .join("");
  }
  return "";
}

/**
 * Some open models write their reasoning inline as <think>...</think>.
 * This removes it from a stream, even when a tag is split across chunks.
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

export async function complete(
  config: LLMConfig,
  messages: ChatMessage[],
  { signal, maxTokens }: { signal?: AbortSignal; maxTokens?: number } = {}
): Promise<string> {
  const res = await post(
    config,
    { model: config.model, messages, max_tokens: maxTokens ?? config.rewriteMaxTokens, temperature: 0 },
    signal
  );
  const json = await res.json();
  const text = extractText(json.choices?.[0]?.message?.content);
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export async function* stream(
  config: LLMConfig,
  messages: ChatMessage[],
  { signal }: { signal?: AbortSignal } = {}
): AsyncGenerator<string> {
  const res = await post(
    config,
    { model: config.model, messages, max_tokens: config.maxTokens, temperature: 0.3, stream: true },
    signal
  );
  if (!res.body) throw new LLMError(502, `${config.label} returned an empty response.`);

  const think = createThinkFilter();

  // Server-sent events: `data: {...}` lines, ending with `data: [DONE]`.
  for await (const line of lines(res.body)) {
    if (!line.startsWith("data:")) continue;

    const data = line.slice(5).trim();
    if (data === "[DONE]") break;
    try {
      const json = JSON.parse(data);
      if (json.error) throw new LLMError(502, json.error.message || "The model stopped with an error.");
      const text = think.push(extractText(json.choices?.[0]?.delta?.content));
      if (text) yield text;
    } catch (err) {
      if (err instanceof LLMError) throw err;
      // Ignore keep-alive or malformed lines
    }
  }
  const rest = think.flush();
  if (rest) yield rest;
}

/** Turn API failures into messages a user can act on. */
export function friendlyLLMError(err: LLMError, config: LLMConfig): string {
  const name = config.label;
  switch (err.status) {
    case 401:
    case 403:
      if (config.provider === "mistral") {
        return (
          "Mistral rejected the API key. On Mistral's Free plan, keys stay inactive until you upgrade or turn on " +
          "pay-as-you-go. For a free alternative, add GEMINI_API_KEY from aistudio.google.com/apikey to .env.local."
        );
      }
      return `${name} rejected the API key. Check ${config.keySource} in .env.local, or create a new key at ${config.keyUrl}.`;
    case 429:
      return `${name}'s free-tier rate limit was reached. Wait a minute and try again.`;
    case 400:
    case 404:
      if (/model/i.test(err.message)) {
        return `The model "${config.model}" isn't available for this key. Set LLM_MODEL in .env.local to another model.`;
      }
      return `${name} couldn't process the request: ${err.message}`;
    default:
      return err.status >= 500 ? `${name} is having trouble right now. Try again in a moment.` : err.message;
  }
}
