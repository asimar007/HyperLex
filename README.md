# HyperLex AI

_Your curious companion for smarter web exploration_

Ask a question and HyperLex searches the web, reads what it finds, and writes an answer with numbered citations you can check. Hover a citation to preview its source; the matching source card lights up like a highlighter mark. It shares DNA with Perplexity, plus a live Hacker News feed where any story is one click away from a sourced summary.

It runs on free API tiers: Google Gemini (or Groq) for writing and Tavily for search. Any OpenAI-compatible provider works.

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
                             1. Rewrite follow-ups into a search query (LLM)
                             2. Search the web (Tavily)
                             3. Stream a cited answer (LLM)
        ◀── NDJSON events: status, sources, meta, delta, done | error
```

- `src/app/api/chat/route.ts` runs the pipeline and streams events.
- `src/server/llm.ts` talks to any OpenAI-compatible API, with presets for Gemini, Groq and Mistral. `src/server/` also holds the Tavily client and prompts. API keys never reach the browser.
- `src/context/ChatProvider.tsx` holds conversations, streaming and persistence, so an answer keeps streaming even if you switch to the Hacker News page.

## Setup

You'll need Node.js 18.17 or newer, plus two free API keys:

- **Google Gemini** for writing answers: create a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). No card needed.
- **Tavily** for web search: create a key at [app.tavily.com](https://app.tavily.com).

```bash
git clone https://github.com/asimar007/HyperLex
cd HyperLex
cp .env.example .env.local   # then paste in GEMINI_API_KEY and TAVILY_API_KEY
bun install
bun dev
```

Open http://localhost:3000.

### Choosing an AI provider

Set one key and HyperLex picks the provider automatically. If several keys are set, Gemini wins, then Groq, then Mistral.

| Provider | Key | Free? | Default model | Notes |
|---|---|---|---|---|
| Google Gemini | `GEMINI_API_KEY` | Yes | `gemini-3.8-flash` | Recommended. On the free tier, Google may use prompts to improve its products. |
| Groq | `GROQ_API_KEY` | Yes | `openai/gpt-oss-120b` | Very fast, but the free plan allows about 8K tokens a minute, so roughly one answer a minute. |
| Mistral | `MISTRAL_API_KEY` | No | `mistral-small-latest` | Keys only work on a paid plan or with pay-as-you-go turned on. |
| Anything OpenAI-compatible | `LLM_API_KEY` | Varies | set `LLM_MODEL` | Set `LLM_PROVIDER=custom` and `LLM_BASE_URL`. Works with OpenRouter, Cerebras or a local server. |

Other settings:

| Variable | Default | Notes |
|---|---|---|
| `LLM_PROVIDER` | auto | Force `gemini`, `groq`, `mistral` or `custom` |
| `LLM_MODEL` | per provider | Use another model, such as `gemini-3.5-flash-lite` if you hit Gemini's free rate limits |
| `TAVILY_SEARCH_DEPTH` | `advanced` | `basic` uses fewer Tavily credits |

Free-tier limits change often. Check your current limits in Google AI Studio or the Groq console.

### When something goes wrong

HyperLex shows a plain message in the answer area:

- **No key, or key rejected**: check `.env.local`, then restart `bun dev`. A Mistral key on the Free plan is rejected until you upgrade.
- **Rate limit reached**: wait a minute. Free tiers also have daily caps.
- **Model not available**: set `LLM_MODEL` to another model from your provider.
- **Empty answer**: try again, or switch to another model with `LLM_MODEL`.

## Tech

Next.js 16 (App Router), TypeScript, Tailwind CSS, react-markdown. Fonts (Literata for answers, Schibsted Grotesk for the interface) are self-hosted with `next/font`, so nothing loads from Google Fonts at runtime.

## Disclaimer

This is a weekend project, not the next billion-dollar startup. Use it, break it, learn from it. Answers can be wrong, so check the sources before relying on anything important.
