"use client";
import React from "react";
//import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getTopStories } from "@/lib/hackerNews";
import TopBar from "@/components/TopBar";
import { useState, useEffect } from "react";
import type { Story } from "@/lib/hackerNews";
import BackgroundGrid from "@/components/BackgroundGrid";

export default function HackerNews() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stories on component mount
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setIsLoading(true);
        const data = await getTopStories();
        setStories(data);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStories();
  }, []);

  return (
    <div className="min-h-screen">
      <BackgroundGrid />
      <TopBar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "pl-64" : "pl-0"
        } pt-16`}
      >
        {/* Header Section */}
        <header>
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Hacker News Feed
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Stay updated with the latest tech news and discussions
            </p>
          </div>
        </header>

        {/* Navigation */}
        <nav className=" sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <ScrollArea className="w-full whitespace-nowrap">
              {/* <div className="flex h-14 items-center space-x-4">
                <button className="px-4 py-2 text-sm font-medium text-gray-900 rounded-md bg-gray-100/80 hover:bg-gray-200/80 transition-colors">
                  Top Stories
                </button>
              </div> */}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <div className="rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs uppercase text-gray-700">
                  <tr>
                    <th className="px-6 py-3">Story</th>
                    <th className="px-6 py-3 w-32">Points</th>
                    <th className="px-6 py-3 w-40">Author</th>
                    <th className="px-6 py-3 w-40">Date</th>
                    <th className="px-6 py-3 w-32">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {isLoading
                    ? // Skeleton Loader
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="animate-pulse">
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                          </td>
                        </tr>
                      ))
                    : // Render Stories
                      stories.map((story) => (
                        <tr
                          key={story.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <a
                              href={story.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium line-clamp-2"
                            >
                              {story.title}
                            </a>
                          </td>
                          <td className="px-6 py-4 flex items-center text-gray-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-4 h-4 mr-1.5 text-yellow-500"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                              />
                            </svg>
                            <span className="font-medium">{story.score}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {story.by}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">
                            {new Date(story.time * 1000).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <a
                              href={`https://news.ycombinator.com/item?id=${story.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4 mr-1.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.227V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                                />
                              </svg>
                              {story.descendants || 0}
                            </a>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
