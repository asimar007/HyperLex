"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, RefreshCw } from "lucide-react";
import { useChat } from "@/context/ChatProvider";
import {
  discussionUrl,
  feeds,
  getStories,
  researchPrompt,
  type Feed,
  type Story,
} from "@/lib/hackerNews";
import { classNames, domainOf, timeAgo } from "@/lib/utils";

function StorySkeleton() {
  return (
    <ol aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="grid grid-cols-[2rem_1fr] gap-x-3 border-b border-rule py-4">
          <div className="h-4 w-5 animate-pulse rounded bg-rule" />
          <div className="space-y-2">
            <div className="h-4 w-4/5 animate-pulse rounded bg-rule" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-rule/70" />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HackerNewsFeed() {
  const router = useRouter();
  const { ask } = useChat();
  const [feed, setFeed] = useState<Feed>("top");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);

  const load = useCallback(async (which: Feed, force = false) => {
    // Ignore responses from a feed the user has already switched away from
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await getStories(which, 30, force);
      if (id === requestId.current) setStories(result);
    } catch (err) {
      if (id === requestId.current) {
        setError(err instanceof Error ? err.message : "Couldn't load Hacker News.");
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(feed);
  }, [feed, load]);

  const research = (story: Story) => {
    const { query, searchHint } = researchPrompt(story);
    ask(query, { newConversation: true, searchHint });
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-[52rem] px-5 pb-20 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">Hacker News</h1>
          <p className="mt-2 max-w-[32rem] font-serif text-base leading-relaxed text-muted">
            Live stories from news.ycombinator.com. Use Research on any story to get a sourced summary.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(feed, true)}
          disabled={loading}
          className="btn-quiet"
          aria-label="Refresh stories"
        >
          <RefreshCw className={classNames("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div role="tablist" aria-label="Feeds" className="mt-6 flex gap-1 overflow-x-auto border-b border-rule">
        {feeds.map((f) => {
          const selected = f.id === feed;
          return (
            <button
              key={f.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setFeed(f.id)}
              className={classNames(
                "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                selected ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-2">
        {error ? (
          <div role="alert" className="py-12 text-center">
            <p className="text-ink">{error}</p>
            <button type="button" onClick={() => load(feed, true)} className="btn-primary mt-4">
              Try again
            </button>
          </div>
        ) : loading && stories.length === 0 ? (
          <StorySkeleton />
        ) : stories.length === 0 ? (
          <p className="py-12 text-center text-muted">No stories in this feed right now.</p>
        ) : (
          <ol className={classNames("transition-opacity", loading && "opacity-60")}>
            {stories.map((story, i) => {
              const href = story.url ?? discussionUrl(story.id);
              const domain = story.url ? domainOf(story.url) : null;
              const comments = story.descendants ?? 0;
              return (
                <li
                  key={story.id}
                  className="grid grid-cols-[2rem_1fr] gap-x-3 border-b border-rule py-4 sm:grid-cols-[2rem_1fr_auto]"
                >
                  <span className="pt-0.5 text-right text-sm tabular-nums text-muted">{i + 1}</span>
                  <div className="min-w-0">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[16px] font-medium leading-snug text-ink transition-colors hover:text-accent"
                    >
                      {story.title}
                    </a>
                    {domain && <span className="ml-2 text-sm text-muted">{domain}</span>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                      <span>{story.score} points</span>
                      <a
                        href={discussionUrl(story.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-accent"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {comments} {comments === 1 ? "comment" : "comments"}
                      </a>
                      <span>by {story.by}</span>
                      <time dateTime={new Date(story.time * 1000).toISOString()}>{timeAgo(story.time * 1000)}</time>
                    </div>
                  </div>
                  <div className="col-start-2 mt-2 sm:col-start-3 sm:mt-0 sm:self-center">
                    <button
                      type="button"
                      onClick={() => research(story)}
                      className="rounded-lg border border-rule bg-surface px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:border-accent/50"
                    >
                      Research
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
