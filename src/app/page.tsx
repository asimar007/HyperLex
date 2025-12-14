"use client";

import { motion, AnimatePresence } from "framer-motion";
import TopBar from "@/components/TopBar";
import HeroSection from "@/components/HeroSection";
import BackgroundGrid from "@/components/BackgroundGrid";
import ReasoningModal from "@/components/ReasoningModal";
import ChatForm from "@/components/ChatForm";
import ChatInput from "@/components/ChatInput";
import ChatSectionItem from "@/components/ChatSectionItem";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useChatController } from "@/hooks/useChatController";
import type { SuggestionType } from "@/types";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState();
  const {
    messages,
    input,
    setInput,
    isLoading,
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
    handleSuggestionClick,
    handleSubmit,
    toggleReasoning,
  } = useChatController();

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

                <ChatForm
                  input={input}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                  onChange={(e) => setInput(e.target.value)}
                  selectedSuggestion={selectedSuggestion}
                  onSuggestionClick={handleSuggestionClick}
                />
              </motion.div>
            ) : (
              <motion.div
                className="space-y-6 pb-32"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {chatSections.map((section, index) => (
                  <ChatSectionItem
                    key={index}
                    section={section}
                    index={index}
                    isLoading={isLoading}
                    messages={messages}
                    toggleReasoning={toggleReasoning}
                    setSelectedMessageData={setSelectedMessageData}
                    setShowReasoningModal={setShowReasoningModal}
                    setShowTavilyModal={setShowTavilyModal}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Updated floating input box styling - show immediately after first submission */}
      {hasSubmitted && (
        <ChatInput
          input={input}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onChange={(e) => setInput(e.target.value)}
          className={`fixed bottom-6 left-0 right-0 flex justify-center transition-all duration-300 ${
            isSidebarOpen ? "pl-64" : "pl-0"
          }`}
        />
      )}

      {/* Modal for Reasoning Input */}
      {showReasoningModal && (
        <ReasoningModal
          isOpen={showReasoningModal}
          onClose={() => setShowReasoningModal(false)}
          reasoningData={selectedMessageData.reasoning}
        />
      )}
    </div>
  );
}
