"use client";

import { SuggestionType } from "@/types";

// Suggestions data
export const suggestions: SuggestionType[] = [
  {
    label: "Tech News & Updates",
    prefix: "Summarize the latest developments in India Tech. ",
  },
  {
    label: "Indian Politics",
    prefix: "Analyze recent political events in India regarding. ",
  },
  {
    label: "Financial Markets",
    prefix:
      "Provide insights on Indian financial markets, focusing on: current economic conditions, industry trends, and geopolitical events in India. ",
  },
  {
    label: "Startup News",
    prefix:
      "Research and summarize recent developments about Indian startups in: AI fintech, blockchain, or digital transformation.  ",
  },
  {
    label: "Global Tech Trends",
    prefix: "Analyze global technology trends and their impact on India.",
  },
  {
    label: "Market Analysis",
    prefix: "Create a detailed market analysis for the Indian.",
  },
];

// Suggestions component
interface SuggestionsProps {
  selectedSuggestion: string | null;
  onSuggestionClick: (suggestion: SuggestionType) => void;
}

const Suggestions = ({ selectedSuggestion, onSuggestionClick }: SuggestionsProps) => {
  return (
    <div className="mt-6 flex flex-wrap gap-2 md:gap-3 justify-center">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.label}
          onClick={() => onSuggestionClick(suggestion)}
          className={`px-3 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all duration-200 border
            ${
              selectedSuggestion === suggestion.label
                ? "bg-gray-900 text-white border-transparent shadow-lg"
                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
};

export default Suggestions;