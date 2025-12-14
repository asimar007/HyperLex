import { SearchResult, TavilyResponse } from "@/types";

interface SearchResultsSectionProps {
  searchResults: SearchResult[];
  setSelectedMessageData: (data: {
    tavily?: TavilyResponse;
    reasoning?: string;
  }) => void;
  setShowTavilyModal: (show: boolean) => void;
  fullTavilyData?: TavilyResponse;
}

export default function SearchResultsSection({
  searchResults,
  setSelectedMessageData,
  setShowTavilyModal,
  fullTavilyData,
}: SearchResultsSectionProps) {
  if (!searchResults.length) return null;

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
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14"
            />
          </svg>
          <h3 className="text-sm font-semibold text-gray-600">Sources</h3>
        </div>
        <button
          onClick={() => {
            setSelectedMessageData({
              tavily: fullTavilyData,
            });
            setShowTavilyModal(true);
          }}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          {/* <span>View Full Data</span> */}
          {/* <svg
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
          </svg> */}
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
        {searchResults.map((result, idx) => (
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
                    alt={result.image.description || result.title}
                    className="w-full h-full object-cover relative z-10"
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
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
  );
}
