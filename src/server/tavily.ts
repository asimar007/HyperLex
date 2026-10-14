import "server-only";
import type { SearchImage, Source } from "@/types";
import { domainOf } from "@/lib/utils";

const TAVILY_URL = "https://api.tavily.com/search";

export class SearchError extends Error {}

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string;
}

type TavilyImage = string | { url?: string; description?: string };

export async function searchWeb(
  query: string,
  { signal, maxResults }: { signal?: AbortSignal; maxResults: number }
): Promise<{ sources: Source[]; images: SearchImage[] }> {
  const key = process.env.TAVILY_API_KEY?.trim();
  if (!key) {
    throw new SearchError("TAVILY_API_KEY is missing. Add it to .env.local and restart the dev server.");
  }

  const depth = process.env.TAVILY_SEARCH_DEPTH === "basic" ? "basic" : "advanced";

  const res = await fetch(TAVILY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      // Tavily rejects very long queries
      query: query.slice(0, 380),
      search_depth: depth,
      max_results: maxResults,
      include_answer: false,
      include_images: true,
      include_image_descriptions: true,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      const json = JSON.parse(text);
      detail = json.detail?.error || json.error || json.message || text;
    } catch {
      /* plain text */
    }
    if (res.status === 401 || res.status === 403) {
      throw new SearchError("Tavily rejected the API key. Check TAVILY_API_KEY in .env.local.");
    }
    if (res.status === 429 || res.status === 432 || res.status === 433) {
      throw new SearchError("Tavily's rate limit or plan limit was reached. Try again later.");
    }
    throw new SearchError(`Web search failed: ${detail || res.statusText}`);
  }

  const data = (await res.json()) as { results?: TavilyResult[]; images?: TavilyImage[] };

  const seen = new Set<string>();
  const sources: Source[] = [];
  for (const r of data.results ?? []) {
    if (!r.url || !r.content || seen.has(r.url)) continue;
    seen.add(r.url);
    const domain = domainOf(r.url) || r.url;
    sources.push({
      id: sources.length + 1,
      title: (r.title || domain).trim(),
      url: r.url,
      domain,
      content: r.content.trim(),
      publishedDate: r.published_date,
    });
  }

  const images: SearchImage[] = (data.images ?? [])
    .map((img) => (typeof img === "string" ? { url: img } : { url: img.url ?? "", description: img.description }))
    .filter((img) => img.url.startsWith("https://"))
    .slice(0, 4);

  return { sources, images };
}
