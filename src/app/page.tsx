"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import remarkGfm from "remark-gfm";
import TopBar from "@/components/TopBar";
import HeroSection from "@/components/HeroSection";
import BackgroundGrid from "@/components/BackgroundGrid";
import { chatStorage } from "@/lib/chatStorage";
import {
  LoadingIndicators,
  SourcesLoadingSkeleton,
} from "@/components/LoadingStates";
import { useSidebarState } from "@/hooks/useSidebarState";
import type {
  Message,
  SearchResult,
  TavilyResponse,
  ChatSection,
  SuggestionType,
} from "@/types";
import Suggestions, { suggestions } from "@/components/Suggestions";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentReasoning, setCurrentReasoning] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentSearchResults, setCurrentSearchResults] = useState<
    SearchResult[]
  >([]);
  const [showTavilyModal, setShowTavilyModal] = useState(false);
  const [showReasoningModal, setShowReasoningModal] = useState(false);
  const [selectedMessageData, setSelectedMessageData] = useState<{
    tavily?: TavilyResponse;
    reasoning?: string;
  }>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [chatSections, setChatSections] = useState<ChatSection[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null
  );
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState();
  // Update the loadHistory function
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = chatStorage.loadChatHistory();
        if (savedHistory.length > 0) {
          setChatSections(savedHistory);
          setHasSubmitted(true);
        } else {
          // Reset all states when there's no history
          setHasSubmitted(false);
          setInput("");
          setMessages([]);
          setCurrentSearchResults([]);
          setError(null);
          setCurrentReasoning("");
          setSelectedSuggestion(null);
        }
      } finally {
        setIsInitializing(false);
      }
    };
    loadHistory();
  }, []);

  // Save chat history whenever it changes
  useEffect(() => {
    if (chatSections.length > 0) {
      chatStorage.saveChatHistory(chatSections);
    }
  }, [chatSections]);

  const handleSuggestionClick = (suggestion: SuggestionType) => {
    setSelectedSuggestion(suggestion.label);
    setInput(suggestion.prefix);
    if (input) {
      setInput(suggestion.prefix + input);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setTimeout(() => {
      const chatContainer = document.querySelector(".space-y-6");
      if (chatContainer) {
        chatContainer.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }, 100);
    // Add context from previous messages
    const contextualInput = lastQuery
      ? `Previous query was about: "${lastQuery}"\nNew query: ${input}`
      : input;
    setHasSubmitted(true);
    setLastQuery(input);
    setError(null);
    setCurrentSearchResults([]);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setCurrentReasoning("");

    // Create a new chat section with loading states
    const newSection: ChatSection = {
      query: input,
      searchResults: [],
      reasoning: "",
      response: "",
      error: null,
      isLoadingSources: true,
      isLoadingThinking: false,
    };
    setChatSections((prev) => [...prev, newSection]);
    const sectionIndex = chatSections.length;

    try {
      // Step 1: Search with Tavily
      const searchResponse = await fetch("/api/tavily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: contextualInput,
          includeImages: true,
          includeImageDescriptions: true,
          search_depth: "advanced",
        }),
        signal: abortControllerRef.current.signal,
      });

      const searchData = await searchResponse.json();

      if (!searchResponse.ok) {
        throw new Error(searchData.error || "Failed to fetch search results");
      }

      if (!searchData.results || searchData.results.length === 0) {
        throw new Error(
          "No relevant search results found. Please try a different query."
        );
      }

      // Combine images with results
      const resultsWithImages = searchData.results.map(
        (result: SearchResult, index: number) => ({
          ...result,
          image: searchData.images?.[index],
        })
      );

      // Update section with search results and start thinking
      setChatSections((prev) => {
        const updated = [...prev];
        updated[sectionIndex] = {
          ...updated[sectionIndex],
          searchResults: resultsWithImages,
          isLoadingSources: false,
          isLoadingThinking: true,
        };
        return updated;
      });

      // Step 2: Format search results for DeepSeek
      const searchContext = resultsWithImages
        .map(
          (result: SearchResult, index: number) =>
            `[Source ${index + 1}]: ${result.title}\n${result.content}\nURL: ${
              result.url
            }\n`
        )
        .join("\n\n");

      const tavilyAnswer = searchData.answer
        ? `\nTavily's Direct Answer: ${searchData.answer}\n\n`
        : "";

      // Add sources table at the end
      const sourcesTable =
        `\n\n## Sources\n| Number | Source | Description |\n|---------|---------|-------------|\n` +
        resultsWithImages
          .map(
            (result: SearchResult, index: number) =>
              `| ${index + 1} | [${result.title}](${result.url}) | ${
                result.snippet || result.content.slice(0, 150)
              }${result.content.length > 150 ? "..." : ""} |`
          )
          .join("\n");

      const reasoningInput = `
      Previous Context: ${
        lastQuery
          ? `The previous query was about "${lastQuery}".`
          : "This is a new conversation."
      }
      Here is the research data:${tavilyAnswer}\n${searchContext}\n\n
# Analysis Request: "${input}"

## Analysis Guidelines:
1. Start with a brief <h2>**Executive Summary**</h2> (2-3 sentences)
2. Provide <h2>**Detailed Analysis**</h2> with clear section headings
3. Include relevant statistics and data points from sources
4. Highlight key trends and developments
5. Address potential impacts and implications
6. Consider multiple perspectives and stakeholder views
7. Note any limitations or biases in the source material

## Requirements:
- Use [Source X] citations when referencing specific information
- Maintain a neutral, analytical tone
- Organize information in a clear, logical structure with <h2> headings for each major section
- Highlight any conflicting information between sources
- Include direct quotes when particularly relevant

## Response Format Requirements:
- Provide clear explanations before code examples
- Format code using markdown code blocks with language specification
- Include comments in code examples
- Explain key concepts before showing implementation
Example response structure:

'Java prime number check works by... 
      java
      public class PrimeChecker {
      public static boolean isPrime(int num) {
      if  (num <= 1) return false;
      for (int i =  2; i <= Math.sqrt(num); i++) {
      if  (num  % i ==  0) return false;
      }
      return true;
      }
## IMPORTANT: 
1. End your response with a <h2>**Key Takeaways**</h2> section
2. Follow with a sources table listing all references used, formatted exactly as shown below:
${sourcesTable}`;
      let assistantMessage: Message = {
        role: "assistant",
        content: "",
        reasoning: "",
        searchResults: resultsWithImages,
        fullTavilyData: searchData,
        reasoningInput,
      };

      // Step 3: Get analysis from DeepSeek
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            userMessage,
            {
              role: "assistant" as const,
              content:
                "I found some relevant information. Let me analyze it and create a comprehensive report.",
            },
            {
              role: "user" as const,
              content: reasoningInput,
            },
          ],
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to generate report. Please try again.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.choices?.[0]?.delta?.reasoning_content) {
              const newReasoning =
                (assistantMessage.reasoning || "") +
                parsed.choices[0].delta.reasoning_content;
              assistantMessage.reasoning = newReasoning;
              setCurrentReasoning(newReasoning);
              setChatSections((prev) => {
                const updated = [...prev];
                updated[sectionIndex] = {
                  ...updated[sectionIndex],
                  reasoning: newReasoning,
                  isLoadingThinking: false,
                };
                return updated;
              });
            } else if (parsed.choices?.[0]?.delta?.content) {
              const newContent =
                (assistantMessage.content || "") +
                parsed.choices[0].delta.content;
              assistantMessage.content = newContent;
              setChatSections((prev) => {
                const updated = [...prev];
                updated[sectionIndex] = {
                  ...updated[sectionIndex],
                  response: newContent,
                };
                return updated;
              });
            }
          } catch (e) {
            console.error("Error parsing chunk:", e);
          }
        }
      }

      // Update the section with search results
      setChatSections((prev) => {
        const updated = [...prev];
        updated[sectionIndex] = {
          ...updated[sectionIndex],
          searchResults: resultsWithImages,
        };
        return updated;
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        console.error("Error:", error);
        setError(errorMessage);
        setChatSections((prev) => {
          const updated = [...prev];
          updated[sectionIndex] = {
            ...updated[sectionIndex],
            error: errorMessage,
            isLoadingSources: false,
            isLoadingThinking: false,
          };
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      setSearchStatus("");
      abortControllerRef.current = null;
    }
  };

  const toggleReasoning = (index: number) => {
    setChatSections((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isReasoningCollapsed: !updated[index].isReasoningCollapsed,
      };
      return updated;
    });
  };
  if (isInitializing) {
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
          <div className="max-w-3xl mx-auto p-8">
            {/* Hero Section Skeleton */}
            <div className="animate-pulse space-y-8 mb-16">
              <div className="h-8 w-48 bg-gray-200 rounded-full mx-auto" />
              <div className="h-16 w-3/4 bg-gray-200 rounded-lg mx-auto" />
              <div className="space-y-3 max-w-2xl mx-auto">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
            </div>

            {/* Input Box Skeleton */}
            <div className="max-w-[704px] mx-auto">
              <div className="h-[60px] bg-gray-100 rounded-xl border border-gray-200" />
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-32 bg-gray-200 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <BackgroundGrid />
      <TopBar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "md:pl-64" : "pl-0"
        } pt-20 pb-24`}
      >
        <main className="max-w-3xl mx-auto p-4 md:p-8">
          <AnimatePresence>
            {!hasSubmitted ? (
              <motion.div
                className="min-h-screen flex flex-col items-center justify-center"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
              >
                <HeroSection />
                <form
                  onSubmit={handleSubmit}
                  className="w-full max-w-3xl mx-auto px-4 md:px-8"
                >
                  <div className="relative rounded-xl shadow-xl border border-gray-700/50 backdrop-blur-sm">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Message HyperLex..."
                      className="w-full px-4 py-3 bg-transparent text-black placeholder-gray-400 border-0 focus:ring-0 focus:outline-none resize-none min-h-[60px] max-h-[200px] text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      style={{
                        height: "60px",
                        overflowY: "auto",
                      }}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 group"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <svg
                            className="w-5 h-5 transform group-hover:scale-110 transition-transform"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <Suggestions
                    selectedSuggestion={selectedSuggestion}
                    onSuggestionClick={handleSuggestionClick}
                  />
                </form>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-6 pb-32"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {chatSections.map((section, index) => (
                  <div
                    key={index}
                    className="pt-8 border-b border-gray-200 last:border-0"
                  >
                    {/* Query */}
                    <div className="mb-8 flex justify-end">
                      <div className="max-w-[80%] bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-2 py-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-gray-700/20">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-lg font-medium leading-relaxed text-gray-100">
                              {section.query}
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0 transform group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Loading States */}
                    {isLoading && <LoadingIndicators />}

                    {/* Sources Loading State */}
                    {section.isLoadingSources && <SourcesLoadingSkeleton />}
                    {/* Search Results */}
                    {section.searchResults.length > 0 && (
                      <div className="mb-12">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-gray-600"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14"
                              />
                            </svg>
                            <h3 className="text-sm font-semibold text-gray-600">
                              Sources
                            </h3>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedMessageData({
                                tavily:
                                  messages[messages.length - 1]?.fullTavilyData,
                              });
                              setShowTavilyModal(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <span>View Full Data</span>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
                          {section.searchResults.map((result, idx) => (
                            <div
                              key={idx}
                              className="flex-shrink-0 w-[300px] bg-gray-50 border border-gray-200 rounded-xl overflow-hidden"
                            >
                              <div className="h-40 bg-gray-200 overflow-hidden relative">
                                {result.image ? (
                                  <>
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                    <img
                                      src={result.image.url}
                                      alt={
                                        result.image.description || result.title
                                      }
                                      className="w-full h-full object-cover relative z-10"
                                      onLoad={(e) => {
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.style.opacity = "1";
                                      }}
                                      style={{
                                        opacity: 0,
                                        transition: "opacity 0.3s",
                                      }}
                                    />
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg
                                      className="w-8 h-8 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline block mb-2 font-medium line-clamp-2"
                                >
                                  {result.title}
                                </a>
                                <p className="text-sm text-gray-600 line-clamp-3">
                                  {result.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Thinking Process Loading State */}
                    {section.isLoadingThinking && (
                      <div className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-5 h-5 bg-gray-200 rounded" />
                          <div className="h-4 w-32 bg-gray-200 rounded" />
                        </div>
                        <div className="pl-4 border-l-2 border-gray-300">
                          <div className="animate-pulse space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-5/6" />
                            <div className="h-4 bg-gray-200 rounded w-4/5" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Thinking Process */}
                    {section.reasoning && (
                      <div className="mb-12">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-gray-600"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                            <h3 className="text-sm font-semibold text-gray-600">
                              Thinking Process:
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedMessageData({
                                  reasoning:
                                    messages[messages.length - 1]
                                      ?.reasoningInput,
                                });
                                setShowReasoningModal(true);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <span>View Full Input</span>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => toggleReasoning(index)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <svg
                                className={`w-5 h-5 transform transition-transform ${
                                  section.isReasoningCollapsed
                                    ? "-rotate-90"
                                    : "rotate-0"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <motion.div
                          className="pl-4 border-l-2 border-gray-300"
                          initial={false}
                          animate={{
                            height: section.isReasoningCollapsed ? 0 : "auto",
                            opacity: section.isReasoningCollapsed ? 0 : 1,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="text-sm text-gray-600 leading-relaxed overflow-hidden">
                            {section.reasoning}
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* Final Report */}
                    {section.response && (
                      <div className="max-w-3xl mx-auto rounded-2xl shadow-sm p-6">
                        <div className="prose prose-blue max-w-none space-y-4 text-gray-800">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({ node, ...props }) => (
                                <div className="my-8 overflow-x-auto rounded-lg border border-gray-200">
                                  <table
                                    className="w-full text-left border-collapse"
                                    {...props}
                                  />
                                </div>
                              ),
                              h2: ({ node, ...props }) => (
                                <h2
                                  className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2"
                                  {...props}
                                />
                              ),
                              thead: ({ node, ...props }) => (
                                <thead className="bg-gray-50" {...props} />
                              ),
                              tbody: ({ node, ...props }) => (
                                <tbody
                                  className="bg-white divide-y divide-gray-200"
                                  {...props}
                                />
                              ),
                              tr: ({ node, ...props }) => (
                                <tr
                                  className="hover:bg-gray-50 transition-colors"
                                  {...props}
                                />
                              ),
                              th: ({ node, ...props }) => (
                                <th
                                  className="py-3 px-4 font-medium text-sm text-gray-900 border-b border-gray-200"
                                  {...props}
                                />
                              ),
                              td: ({ node, ...props }) => {
                                // Check if the content includes a markdown link
                                const content =
                                  props.children?.toString() || "";
                                if (content.match(/\[.*?\]\(.*?\)/)) {
                                  return (
                                    <td className="py-3 px-4 text-sm text-gray-500">
                                      <ReactMarkdown
                                        components={{
                                          a: ({ node, ...linkProps }) => (
                                            <a
                                              {...linkProps}
                                              className="text-blue-600 hover:text-blue-800 hover:underline"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            />
                                          ),
                                        }}
                                      >
                                        {content}
                                      </ReactMarkdown>
                                    </td>
                                  );
                                }
                                return (
                                  <td
                                    className="py-3 px-4 text-sm text-gray-500"
                                    {...props}
                                  />
                                );
                              },
                              pre: ({ node, children, ...props }) => {
                                const content = String(children);
                                if (
                                  content.includes("|") &&
                                  content.includes("\n")
                                ) {
                                  const rows = content.trim().split("\n");
                                  const headers = rows[0]
                                    .split("|")
                                    .filter(Boolean)
                                    .map((h) => h.trim());
                                  const data = rows.slice(2).map((row) =>
                                    row
                                      .split("|")
                                      .filter(Boolean)
                                      .map((cell) => cell.trim())
                                  );

                                  return (
                                    <div className="my-8 overflow-x-auto">
                                      <table className="w-full text-left border-collapse border border-gray-200">
                                        <thead className="bg-gray-50">
                                          <tr>
                                            {headers.map((header, i) => (
                                              <th
                                                key={i}
                                                className="py-3 px-4 font-medium text-sm text-gray-900 border-b border-gray-200"
                                              >
                                                {header}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                          {data.map((row, i) => (
                                            <tr
                                              key={i}
                                              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                            >
                                              {row.map((cell, j) => (
                                                <td
                                                  key={j}
                                                  className="py-3 px-4 text-sm text-gray-500"
                                                >
                                                  {cell}
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                }
                                return <pre {...props}>{children}</pre>;
                              },
                              a: ({ node, ...props }) => {
                                const href = props.href || "";
                                const sourceMatch =
                                  href.match(/\[Source (\d+)\]/);
                                if (sourceMatch) {
                                  const sourceIndex =
                                    parseInt(sourceMatch[1]) - 1;
                                  const source =
                                    section.searchResults[sourceIndex];
                                  return (
                                    <span className="inline-flex items-center group relative">
                                      <a
                                        {...props}
                                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                      >
                                        <svg
                                          className="w-4 h-4 mr-1"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                          />
                                        </svg>
                                        {props.children}
                                      </a>
                                      {source && (
                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                                          <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-80">
                                            <h4 className="font-medium text-gray-900 mb-2">
                                              {source.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 mb-2">
                                              {source.content}
                                            </p>
                                            <a
                                              href={source.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-600 hover:underline"
                                            >
                                              Visit source →
                                            </a>
                                          </div>
                                        </div>
                                      )}
                                    </span>
                                  );
                                }
                                return (
                                  <a
                                    {...props}
                                    className="text-blue-600 hover:text-blue-800"
                                  />
                                );
                              },
                            }}
                          >
                            {section.response}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {section.error && (
                      <div className="text-center text-red-600 mb-8">
                        {section.error}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Updated floating input box styling - show immediately after first submission */}
      {hasSubmitted && (
        <div
          className={`fixed bottom-6 left-0 right-0 flex justify-center transition-all duration-300 ${
            isSidebarOpen ? "pl-64" : "pl-0"
          }`}
        >
          <form onSubmit={handleSubmit} className="w-full max-w-[704px] mx-4">
            <div className="relative bg-white rounded-xl shadow-lg border border-gray-200">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message HyperLex..."
                className="w-full p-4 pr-24 rounded-xl border-0 focus:ring-0 focus:outline-none resize-none h-[56px] bg-white text-gray-900 placeholder-gray-500 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows={1}
                style={{
                  minHeight: "56px",
                  maxHeight: "200px",
                }}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Send message"
                >
                  <svg
                    className="w-5 h-5 rotate-90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Modal for Tavily Data */}
      {showTavilyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white/95 backdrop-blur-md rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200/50"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Full Tavily Response
                </h3>
              </div>
              <button
                onClick={() => setShowTavilyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-8rem)] pr-2 custom-scrollbar">
              <pre className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 font-mono shadow-inner">
                {JSON.stringify(selectedMessageData?.tavily, null, 2)}
              </pre>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal for Reasoning Input */}
      {showReasoningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Full Reasoning Input
              </h3>
              <button
                onClick={() => setShowReasoningModal(false)}
                className="text-gray-600 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">
              {selectedMessageData?.reasoning}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
