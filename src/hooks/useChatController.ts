import { useState, useRef, useEffect } from "react";
import { chatStorage } from "@/lib/chatStorage";
import type {
  Message,
  SearchResult,
  TavilyResponse,
  ChatSection,
  SuggestionType,
} from "@/types";

export function useChatController() {
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

  // Load chat history
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

  return {
    messages,
    input,
    setInput,
    isLoading,
    currentReasoning,
    currentSearchResults,
    showTavilyModal,
    setShowTavilyModal,
    showReasoningModal,
    setShowReasoningModal,
    selectedMessageData,
    setSelectedMessageData,
    hasSubmitted,
    chatSections,
    selectedSuggestion,
    isInitializing,
    error,
    handleSuggestionClick,
    handleSubmit,
    toggleReasoning,
  };
}
