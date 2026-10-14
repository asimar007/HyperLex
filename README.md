# HyperLex AI

_Your curious companion for smarter web exploration_

Ask a question and HyperLex searches the web, reads what it finds, and writes an answer with numbered citations you can check. Hover a citation to preview its source; the matching source card lights up like a highlighter mark. It shares DNA with Perplexity, plus a live Hacker News feed where any story is one click away from a sourced summary.

It runs on free API tiers: Google Gemini (using the official `@google/genai` SDK) for reasoning and Tavily for search.

## Features

- **Cited answers.** Every claim is tied to a numbered source. Answers stream in as they're written, and you can stop, retry or regenerate them.
- **Real follow-ups.** Ask "who pays for it?" and HyperLex rewrites it into a standalone search using the conversation so far.
- **History.** Conversations are saved in your browser and listed in the sidebar.
- **Hacker News.** Top, New, Best, Ask HN and Show HN feeds, with a Research button on every story.
- **Suggested follow-up questions** after each answer.
- Light and dark mode, mobile layout, keyboard friendly.

## How it works

```
Browser ──POST /api/chat──▶ API route
                             1. Rewrite follow-ups into a search query (Gemini)
                             2. Search the web (Tavily)
                             3. Stream a cited answer (Gemini)
        ◀── NDJSON events: status, sources, meta, delta, done | error
```

- `src/app/api/chat/route.ts` runs the pipeline and streams events.
- `src/server/llm.ts` integrates with Google Gemini AI via `@google/genai`. `src/server/` also holds the Tavily client and prompts. API keys never reach the browser.
- `src/context/ChatProvider.tsx` holds conversations, streaming and persistence, so an answer keeps streaming even if you switch to the Hacker News page.

## Setup

You'll need Node.js 20 or newer (or Bun), plus two free API keys:

- **Google Gemini** for writing answers: create a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). No credit card needed.
- **Tavily** for web search: create a free key at [app.tavily.com](https://app.tavily.com).

```bash
git clone https://github.com/asimar007/HyperLex
cd HyperLex
cp .env.example .env.local   # then paste in GEMINI_API_KEY and TAVILY_API_KEY
bun install
bun dev
```

Open http://localhost:3000.

### AI Configuration

HyperLex uses Google Gemini AI powered by the `@google/genai` SDK.

| Variable | Default | Free? | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | required | Yes | From [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | `gemini-3-flash-preview` | Yes | Free-tier model. Can be set to `gemini-3.5-flash-lite` or others |
| `TAVILY_API_KEY` | required | Yes | From [app.tavily.com](https://app.tavily.com) |
| `TAVILY_SEARCH_DEPTH` | `advanced` | - | `basic` uses fewer Tavily credits |

### When something goes wrong

HyperLex shows a plain message in the answer area:

- **No key, or key rejected**: check `.env.local`, then restart `bun dev`.
- **Rate limit reached**: wait a minute. Free tiers also have daily caps.
- **High demand**: if experiencing temporary spikes in demand, set `GEMINI_MODEL=gemini-3.5-flash-lite` in `.env.local`.
- **Empty answer**: try again, or switch to another model with `GEMINI_MODEL`.

## Tech

Next.js 16 (App Router), TypeScript, Tailwind CSS, Google Gen AI SDK (`@google/genai`), react-markdown. Fonts (Literata for answers, Schibsted Grotesk for the interface) are self-hosted with `next/font`, so nothing loads from Google Fonts at runtime.

## Disclaimer

This is a weekend project, not the next billion-dollar startup. Use it, break it, learn from it. Answers can be wrong, so check the sources before relying on anything important.
