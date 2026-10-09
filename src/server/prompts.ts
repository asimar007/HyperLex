import type { HistoryItem, Source } from "@/types";
import type { ChatMessage } from "./llm";

import { FOLLOWUP_MARKER } from "@/lib/citations";

const HISTORY_TURNS = 3;
const HISTORY_ANSWER_CHARS = 1200;

function today(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Remove citation numbers and the follow-up block so old answers don't confuse new citations. */
function cleanAnswer(answer: string): string {
  const main = answer.split(FOLLOWUP_MARKER)[0];
  return main
    .replace(/\s*\[(?:Sources?\s*)?\d+(?:\s*[,–-]\s*\d+)*\]/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
    .slice(0, HISTORY_ANSWER_CHARS);
}

export function recentHistory(history: HistoryItem[] = []): HistoryItem[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((h) => h && typeof h.query === "string" && typeof h.answer === "string" && h.answer.trim())
    .slice(-HISTORY_TURNS)
    .map((h) => ({ query: h.query.slice(0, 500), answer: h.answer.slice(0, 4000) }));
}

/** Messages asking the model to turn a follow-up into a standalone search query. */
export function rewriteMessages(query: string, history: HistoryItem[]): ChatMessage[] {
  const transcript = history
    .map((h) => `User: ${h.query}\nAssistant: ${cleanAnswer(h.answer).slice(0, 300)}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content:
        "You rewrite the user's latest message into one standalone web search query. " +
        "Use the conversation to resolve references such as \"it\", \"they\" or \"that company\". " +
        "If the latest message is already standalone, return it unchanged. " +
        "Reply with the query only: no quotes, no explanation, at most 20 words.",
    },
    {
      role: "user",
      content: `Conversation so far:\n${transcript}\n\nLatest message: ${query}`,
    },
  ];
}

const SYSTEM_PROMPT = `You are HyperLex, a research assistant that answers questions using fresh web search results.

Today is {{DATE}}.

How to answer:
- Open with the direct answer in one or two sentences. No preamble such as "Great question" or "Based on the sources".
- Take facts, figures, dates and quotes only from the numbered sources. If the sources don't cover something, say so plainly instead of guessing. Widely known background is fine, but never invent numbers, quotes or citations.
- Cite each factual claim with its source number in square brackets right after the claim, like [1] or [2][4]. Use only numbers that exist in the sources.
- Do not write a sources, references or bibliography list. The app shows the sources separately.
- When sources disagree or look outdated, say so and note which is more recent or more reliable.
- Fit the length to the question. A simple factual question gets one short paragraph. A broad research, comparison or analysis question gets a structured answer with ## headings, short paragraphs, bullet lists, and a markdown table when comparing several items.
- For longer, structured answers only, finish with a "## Key takeaways" section of 2 to 4 bullets.
- For programming questions, explain the idea first, then give code in fenced blocks with a language tag.
- Reply in the language of the user's question.

After the answer, write ${FOLLOWUP_MARKER} on its own line, then three short follow-up questions the user might ask next, one per line, without numbering or bullets.`;

function formatSources(sources: Source[], sourceChars: number): string {
  return sources
    .map((s) => {
      const lines = [`[${s.id}] ${s.title}`, `URL: ${s.url}`];
      if (s.publishedDate) lines.push(`Published: ${s.publishedDate}`);
      lines.push(s.content.slice(0, sourceChars));
      return lines.join("\n");
    })
    .join("\n\n");
}

export function answerMessages({
  query,
  searchQuery,
  sources,
  history,
  sourceChars,
}: {
  query: string;
  searchQuery: string;
  sources: Source[];
  history: HistoryItem[];
  sourceChars: number;
}): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT.replace("{{DATE}}", today()) },
  ];

  for (const h of history) {
    messages.push({ role: "user", content: h.query });
    messages.push({ role: "assistant", content: cleanAnswer(h.answer) });
  }

  const searchNote =
    searchQuery.trim() !== query.trim() ? ` (searched for: "${searchQuery}")` : "";

  messages.push({
    role: "user",
    content:
      `Question: ${query}\n\n` +
      `Web search results${searchNote}:\n\n${formatSources(sources, sourceChars)}\n\n` +
      `Answer the question using these sources and cite them by number.`,
  });

  return messages;
}
