const API = "https://hacker-news.firebaseio.com/v0";
const CACHE_MS = 2 * 60 * 1000;

export const feeds = [
  { id: "top", label: "Top" },
  { id: "new", label: "New" },
  { id: "best", label: "Best" },
  { id: "ask", label: "Ask HN" },
  { id: "show", label: "Show HN" },
] as const;

export type Feed = (typeof feeds)[number]["id"];

export interface Story {
  id: number;
  title: string;
  /** Missing for Ask HN and text posts */
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
}

type RawItem = Story & { deleted?: boolean; dead?: boolean };

const cache = new Map<string, { at: number; stories: Story[] }>();

export function discussionUrl(id: number): string {
  return `https://news.ycombinator.com/item?id=${id}`;
}

export async function getStories(feed: Feed = "top", limit = 30, force = false): Promise<Story[]> {
  const cacheKey = `${feed}:${limit}`;
  const hit = cache.get(cacheKey);
  if (!force && hit && Date.now() - hit.at < CACHE_MS) return hit.stories;

  const res = await fetch(`${API}/${feed}stories.json`);
  if (!res.ok) throw new Error("Couldn't load Hacker News. Check your connection and try again.");
  const ids = ((await res.json()) as number[]).slice(0, limit);

  const settled = await Promise.allSettled(
    ids.map(async (id) => {
      const r = await fetch(`${API}/item/${id}.json`);
      return r.ok ? ((await r.json()) as RawItem | null) : null;
    })
  );

  const stories = settled
    .map((s) => (s.status === "fulfilled" ? s.value : null))
    .filter((s): s is RawItem => !!s && !s.deleted && !s.dead && !!s.title);

  cache.set(cacheKey, { at: Date.now(), stories });
  return stories;
}

/** The prompt used when someone clicks "Research" on a story. */
export function researchPrompt(story: Story): { query: string; searchHint: string } {
  const link = story.url ? ` (${story.url})` : "";
  return {
    query: `What is "${story.title}"${link} about, and why is it getting attention?`,
    searchHint: story.title,
  };
}
