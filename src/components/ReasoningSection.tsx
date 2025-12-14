import { motion } from "framer-motion";

interface ReasoningSectionProps {
  reasoning: string;
  isReasoningCollapsed?: boolean;
  toggleReasoning: () => void;
  setSelectedMessageData: (data: { tavily?: any; reasoning?: string }) => void;
  setShowReasoningModal: (show: boolean) => void;
  reasoningInput?: string;
}

export default function ReasoningSection({
  reasoning,
  isReasoningCollapsed,
  toggleReasoning,
  setSelectedMessageData,
  setShowReasoningModal,
  reasoningInput,
}: ReasoningSectionProps) {
  if (!reasoning) return null;

  return (
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
                reasoning: reasoningInput,
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
            onClick={toggleReasoning}
            className="text-gray-600 hover:text-gray-700"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${
                isReasoningCollapsed ? "-rotate-90" : "rotate-0"
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
          height: isReasoningCollapsed ? 0 : "auto",
          opacity: isReasoningCollapsed ? 0 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-sm text-gray-600 leading-relaxed overflow-hidden">
          {reasoning}
        </div>
      </motion.div>
    </div>
  );
}
