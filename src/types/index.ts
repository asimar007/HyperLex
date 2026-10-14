export interface Source {
  /** 1-based number the model uses for citations, e.g. [3] */
  id: number;
  title: string;
  url: string;
  domain: string;
  content: string;
  publishedDate?: string;
}

export interface SearchImage {
  url: string;
  description?: string;
}

export type TurnStatus = "searching" | "writing" | "done" | "error" | "stopped";

export interface Turn {
  id: string;
  query: string;
  /** Optional override for the web search (e.g. a story title) */
  searchHint?: string;
  /** The query actually sent to the search engine */
  searchQuery?: string;
  sources: Source[];
  images: SearchImage[];
  answer: string;
  status: TurnStatus;
  error?: string;
  model?: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  turns: Turn[];
  createdAt: number;
  updatedAt: number;
}

/** One previous question/answer pair, sent to the API for follow-ups */
export interface HistoryItem {
  query: string;
  answer: string;
}

export interface ChatRequestBody {
  query: string;
  searchHint?: string;
  history?: HistoryItem[];
}

/** Newline-delimited JSON events streamed by /api/chat */
export type StreamEvent =
  | { type: "status"; searchQuery: string }
  | { type: "sources"; sources: Source[]; images: SearchImage[]; model: string }
  | { type: "delta"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };
