"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import Composer from "./Composer";
import { useChat } from "@/context/ChatProvider";
import { getStories, researchPrompt, type Story } from "@/lib/hackerNews";
import { domainOf } from "@/lib/utils";

const suggestions: string[] = [
  "What are the biggest developments in India's tech industry this month?",
  "How are Indian stock markets doing right now, and what is driving them?",
  "Which Indian AI startups raised funding recently, and what do they build?",
  "Explain retrieval-augmented generation with a small Python example",
  "Compare Next.js and Astro for a content-heavy website",
];

interface LandingProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
}

function HackerNewsPreview() {
  const { ask } = useChat();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getStories("top", 5)
      .then((s) => !cancelled && setStories(s.slice(0, 4)))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <p className="text-sm text-muted">Hacker News didn’t load. Open the full feed to retry.</p>;

  if (!stories) {
    return (
      <ul className="space-y-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="space-y-2">
            <div className="h-4 w-5/6 animate-pulse rounded bg-rule" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-rule/70" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="divide-y divide-rule">
      {stories.map((story) => {
        const domain = story.url ? domainOf(story.url) : "news.ycombinator.com";
        return (
          <li key={story.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-[15px] font-medium leading-snug text-ink">{story.title}</p>
              <p className="mt-1 text-xs text-muted">
                {domain}, {story.score} points
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const { query, searchHint } = researchPrompt(story);
                ask(query, { newConversation: true, searchHint });
              }}
              className="btn-quiet shrink-0 text-accent hover:text-accent"
            >
              Research
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function Landing({ input, setInput, onSubmit }: LandingProps) {
  const { ask, busyTurnId, stop } = useChat();

  return (
    <div className="mx-auto max-w-[46rem] px-5 pb-20 pt-[9vh] md:pt-[14vh]">
      <h1 className="text-balance text-[2.4rem] font-bold leading-[1.05] tracking-[-0.025em] text-ink md:text-[3.4rem]">
        What do you want to find out?
      </h1>
      <p className="mt-4 max-w-[34rem] font-serif text-lg leading-relaxed text-muted">
        HyperLex searches the web, reads what it finds, and writes an answer with numbered sources you can
        check.
      </p>

      <div className="mt-8">
        <Composer
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          onStop={stop}
          busy={busyTurnId !== null}
          autoFocus
          large
          placeholder="Ask anything, like “How does UPI make money?”"
        />
      </div>

      <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-10">
        <section aria-labelledby="try-heading">
          <div className="flex h-6 items-center">
            <h2 id="try-heading" className="text-sm font-semibold text-ink">
              Try asking
            </h2>
          </div>
          <ul className="mt-3 divide-y divide-rule">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => ask(s, { newConversation: true })}
                  className="w-full py-3 text-left text-[15px] leading-snug text-ink transition-colors hover:text-accent"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="hn-heading">
          <div className="flex h-6 items-center justify-between gap-4">
            <h2 id="hn-heading" className="text-sm font-semibold text-ink">
              On Hacker News now
            </h2>
            <Link href="/hackernews" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
              <MessageSquareText className="h-3.5 w-3.5" />
              Full feed
            </Link>
          </div>
          <div className="mt-3">
            <HackerNewsPreview />
          </div>
        </section>
      </div>
    </div>
  );
}
