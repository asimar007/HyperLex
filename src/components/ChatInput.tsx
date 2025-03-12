import React from "react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isSidebarOpen?: boolean;
  className?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isLoading,
  onSubmit,
  onChange,
  isSidebarOpen,
  className,
}) => {
  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="w-full max-w-[704px] mx-4">
        <div className="relative bg-white rounded-xl shadow-lg border border-gray-200">
          <textarea
            value={input}
            onChange={onChange}
            placeholder="Message HyperLex..."
            className="w-full p-4 pr-24 rounded-xl border-0 focus:ring-0 focus:outline-none resize-none h-[56px] bg-white text-gray-900 placeholder-gray-500 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
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
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 group"
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
  );
};

export default ChatInput;
