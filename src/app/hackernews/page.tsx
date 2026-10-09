import type { Metadata } from "next";
import HackerNewsFeed from "@/components/HackerNewsFeed";

export const metadata: Metadata = {
  title: "Hacker News",
  description: "Live stories from Hacker News, with one-click research.",
};

export default function HackerNewsPage() {
  return <HackerNewsFeed />;
}
