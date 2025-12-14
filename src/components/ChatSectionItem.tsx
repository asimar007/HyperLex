import { ChatSection, Message } from "@/types";
import {
  LoadingIndicators,
  SourcesLoadingSkeleton,
} from "@/components/LoadingStates";
import SearchResultsSection from "@/components/SearchResultsSection";
import ReasoningSection from "@/components/ReasoningSection";
import ResponseRenderer from "@/components/ResponseRenderer";

interface ChatSectionItemProps {
  section: ChatSection;
  index: number;
  isLoading: boolean;
  messages: Message[];
  toggleReasoning: (index: number) => void;
  setSelectedMessageData: (data: { tavily?: any; reasoning?: string }) => void;
  setShowReasoningModal: (show: boolean) => void;
  setShowTavilyModal: (show: boolean) => void;
}

export default function ChatSectionItem({
  section,
  index,
  isLoading,
  messages,
  toggleReasoning,
  setSelectedMessageData,
  setShowReasoningModal,
  setShowTavilyModal,
}: ChatSectionItemProps) {
  return (
    <div key={index} className="pt-8 border-b border-gray-200 last:border-0">
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
        <SearchResultsSection
          searchResults={section.searchResults}
          setSelectedMessageData={setSelectedMessageData}
          setShowTavilyModal={setShowTavilyModal}
          fullTavilyData={messages[messages.length - 1]?.fullTavilyData}
        />
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
        <ReasoningSection
          reasoning={section.reasoning}
          isReasoningCollapsed={section.isReasoningCollapsed}
          toggleReasoning={() => toggleReasoning(index)}
          setSelectedMessageData={setSelectedMessageData}
          setShowReasoningModal={setShowReasoningModal}
          reasoningInput={messages[messages.length - 1]?.reasoningInput}
        />
      )}

      {/* Final Report */}
      {section.response && (
        <ResponseRenderer
          response={section.response}
          searchResults={section.searchResults}
        />
      )}

      {section.error && (
        <div className="text-center text-red-600 mb-8">{section.error}</div>
      )}
    </div>
  );
}
