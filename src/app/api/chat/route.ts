import type { ChatRequestBody, StreamEvent } from "@/types";
import { LLMError, complete, friendlyLLMError, resolveLLM, stream, type LLMConfig } from "@/server/llm";
import { SearchError, searchWeb } from "@/server/tavily";
import { answerMessages, recentHistory, rewriteMessages } from "@/server/prompts";

const MAX_QUERY_CHARS = 2000;
/** How many search results the model reads */
const MAX_SOURCES = 6;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Ask the model for a standalone search query; fall back to the raw question. */
async function buildSearchQuery(
  config: LLMConfig,
  query: string,
  history: ReturnType<typeof recentHistory>,
  signal: AbortSignal
): Promise<string> {
  if (history.length === 0) return query;
  try {
    const rewritten = await complete(config, rewriteMessages(query, history), { signal });
    const cleaned = rewritten.split("\n")[0].replace(/^["'“”]+|["'“”]+$/g, "").trim();
    return cleaned.length > 2 ? cleaned : query;
  } catch (err) {
    if (signal.aborted) throw err;
    return query; // a failed rewrite should never block the answer
  }
}

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return jsonError("Ask a question first.", 400);
  if (query.length > MAX_QUERY_CHARS) {
    return jsonError(`Questions can be up to ${MAX_QUERY_CHARS} characters.`, 400);
  }

  // Fail fast with a clear setup message instead of crashing the build at import time
  let config: LLMConfig;
  try {
    config = resolveLLM();
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "The AI provider isn't configured.", 500);
  }

  const history = recentHistory(body.history);
  const searchHint = typeof body.searchHint === "string" ? body.searchHint.trim() : "";

  // Stop upstream work when the browser disconnects or presses Stop
  const upstream = new AbortController();
  req.signal?.addEventListener("abort", () => upstream.abort());

  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          /* stream already closed */
        }
      };

      try {
        // 1. Work out what to search for
        const searchQuery = searchHint || (await buildSearchQuery(config, query, history, upstream.signal));
        send({ type: "status", searchQuery });

        // 2. Search the web
        const { sources, images } = await searchWeb(searchQuery, {
          signal: upstream.signal,
          maxResults: MAX_SOURCES,
        });
        if (sources.length === 0) {
          send({
            type: "error",
            message: "The web search came back empty. Try rephrasing the question or making it more specific.",
          });
          return;
        }
        // The browser only needs a short snippet per source; the model gets the full text
        send({
          type: "sources",
          sources: sources.map((s) => ({ ...s, content: s.content.slice(0, 400) })),
          images,
          model: config.model,
        });

        // 3. Stream the cited answer
        const prompt = answerMessages({ query, searchQuery, sources, history });
        let wrote = false;
        for await (const content of stream(config, prompt, { signal: upstream.signal })) {
          wrote = true;
          send({ type: "delta", content });
        }
        if (!wrote) {
          send({
            type: "error",
            message: "Gemini returned an empty answer. Try again, or set GEMINI_MODEL to a different model.",
          });
          return;
        }
        send({ type: "done" });
      } catch (err) {
        if (upstream.signal.aborted) return;
        console.error("[api/chat]", err);
        let message = "Something went wrong while researching. Try again.";
        if (err instanceof LLMError) message = friendlyLLMError(err, config);
        else if (err instanceof SearchError) message = err.message;
        send({ type: "error", message });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      upstream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
