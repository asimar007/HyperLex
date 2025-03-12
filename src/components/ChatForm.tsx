import React from "react";
import { SuggestionType } from "@/types";
import Suggestions from "@/components/Suggestions";

interface ChatFormProps {
  input: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  selectedSuggestion: string | null;
  onSuggestionClick: (suggestion: SuggestionType) => void;
}

const ChatForm: React.FC<ChatFormProps> = ({
  input,
  isLoading,
  onSubmit,
  onChange,
  selectedSuggestion,
  onSuggestionClick,
}) => {
  return (
    <form onSubmit={onSubmit} className="w-full max-w-3xl mx-auto px-4 md:px-8">
      <div className="relative rounded-xl shadow-xl border border-gray-700/50 backdrop-blur-sm">
        <textarea
          value={input}
          onChange={onChange}
          placeholder="Message HyperLex..."
          className="w-full px-4 py-3 bg-transparent text-black placeholder-gray-400 border-0 focus:ring-0 focus:outline-none resize-none min-h-[60px] max-h-[200px] text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
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

      <Suggestions
        selectedSuggestion={selectedSuggestion}
        onSuggestionClick={onSuggestionClick}
      />
    </form>
  );
};

export default ChatForm;
