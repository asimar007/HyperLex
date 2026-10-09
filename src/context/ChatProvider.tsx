"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Conversation, HistoryItem, Turn } from "@/types";
import { readEvents } from "@/lib/stream";
import { splitAnswer } from "@/lib/citations";
import { loadActiveId, loadConversations, saveActiveId, saveConversations } from "@/lib/storage";
import { uid } from "@/lib/utils";

interface AskOptions {
  /** Start a fresh conversation instead of following up in the open one */
  newConversation?: boolean;
  /** Search for this instead of the question itself (used for Hacker News stories) */
  searchHint?: string;
}

interface ChatContextValue {
  hydrated: boolean;
  conversations: Conversation[];
  active: Conversation | null;
  activeId: string | null;
  busyTurnId: string | null;
  isBusy: boolean;
  ask: (query: string, options?: AskOptions) => void;
  retry: (turnId: string) => void;
  stop: () => void;
  newChat: () => void;
  openConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const HISTORY_TURNS = 3;

function historyFrom(turns: Turn[]): HistoryItem[] {
  return turns
    .filter((t) => t.status === "done" && t.answer.trim())
    .slice(-HISTORY_TURNS)
    .map((t) => ({ query: t.query, answer: splitAnswer(t.answer).answer }));
}

function errorMessage(err: unknown): string {
  if (err instanceof TypeError) return "Couldn't reach the server. Check your connection and try again.";
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Try again.";
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busyTurnId, setBusyTurnId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const conversationsRef = useRef(conversations);
  const activeIdRef = useRef(activeId);
  conversationsRef.current = conversations;
  activeIdRef.current = activeId;

  // Load saved conversations once, in the browser
  useEffect(() => {
    const saved = loadConversations();
    const savedActive = loadActiveId();
    setConversations(saved);
    setActiveId(saved.some((c) => c.id === savedActive) ? savedActive : null);
    setHydrated(true);
  }, []);

  // Save after changes settle, not on every streamed token
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => saveConversations(conversations), 400);
    return () => window.clearTimeout(timer);
  }, [conversations, hydrated]);

  useEffect(() => {
    if (hydrated) saveActiveId(activeId);
  }, [activeId, hydrated]);

  // Abort any request if the whole app unmounts
  useEffect(() => () => abortRef.current?.abort(), []);

  const patchTurn = useCallback(
    (conversationId: string, turnId: string, patch: Partial<Turn>) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id !== conversationId
            ? c
            : {
                ...c,
                updatedAt: Date.now(),
                turns: c.turns.map((t) => (t.id === turnId ? { ...t, ...patch } : t)),
              }
        )
      );
    },
    []
  );

  const runTurn = useCallback(
    async (conversationId: string, turn: Turn, history: HistoryItem[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setBusyTurnId(turn.id);

      let answer = "";
      let finished = false;
      let failed = false;
      let flushTimer: number | null = null;

      // Batch token updates so long answers don't re-render on every token
      const flush = () => {
        if (flushTimer !== null) {
          window.clearTimeout(flushTimer);
          flushTimer = null;
        }
        patchTurn(conversationId, turn.id, { answer });
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: turn.query, searchHint: turn.searchHint, history }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || `The request failed with status ${res.status}.`);
        }

        for await (const event of readEvents(res)) {
          switch (event.type) {
            case "status":
              patchTurn(conversationId, turn.id, { searchQuery: event.searchQuery });
              break;
            case "sources":
              patchTurn(conversationId, turn.id, {
                sources: event.sources,
                images: event.images,
                status: "writing",
              });
              break;
            case "meta":
              patchTurn(conversationId, turn.id, { model: event.model });
              break;
            case "delta":
              answer += event.content;
              if (flushTimer === null) flushTimer = window.setTimeout(flush, 50);
              break;
            case "error":
              failed = true;
              flush();
              patchTurn(conversationId, turn.id, { status: "error", error: event.message });
              break;
            case "done":
              finished = true;
              break;
          }
        }

        flush();
        if (!failed) {
          if (finished || answer.trim()) {
            patchTurn(conversationId, turn.id, { status: "done" });
          } else {
            patchTurn(conversationId, turn.id, {
              status: "error",
              error: "The connection closed before an answer arrived. Try again.",
            });
          }
        }
      } catch (err) {
        if (flushTimer !== null) window.clearTimeout(flushTimer);
        if (controller.signal.aborted) {
          patchTurn(conversationId, turn.id, { answer, status: "stopped" });
        } else {
          patchTurn(conversationId, turn.id, { answer, status: "error", error: errorMessage(err) });
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setBusyTurnId(null);
        }
      }
    },
    [patchTurn]
  );

  const ask = useCallback(
    (query: string, options: AskOptions = {}) => {
      const text = query.trim();
      if (!text) return;

      const now = Date.now();
      const turn: Turn = {
        id: uid(),
        query: text,
        searchHint: options.searchHint,
        sources: [],
        images: [],
        answer: "",
        status: "searching",
        createdAt: now,
      };

      const existing = options.newConversation
        ? undefined
        : conversationsRef.current.find((c) => c.id === activeIdRef.current);

      if (existing) {
        const history = historyFrom(existing.turns);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === existing.id ? { ...c, updatedAt: now, turns: [...c.turns, turn] } : c
          )
        );
        void runTurn(existing.id, turn, history);
      } else {
        const conversation: Conversation = {
          id: uid(),
          title: text.length > 80 ? `${text.slice(0, 77)}…` : text,
          turns: [turn],
          createdAt: now,
          updatedAt: now,
        };
        setConversations((prev) => [conversation, ...prev]);
        setActiveId(conversation.id);
        void runTurn(conversation.id, turn, []);
      }
    },
    [runTurn]
  );

  const retry = useCallback(
    (turnId: string) => {
      const conversation = conversationsRef.current.find((c) => c.turns.some((t) => t.id === turnId));
      if (!conversation) return;
      const index = conversation.turns.findIndex((t) => t.id === turnId);
      const original = conversation.turns[index];
      const fresh: Turn = {
        ...original,
        searchQuery: undefined,
        sources: [],
        images: [],
        answer: "",
        error: undefined,
        model: undefined,
        status: "searching",
      };
      patchTurn(conversation.id, turnId, fresh);
      void runTurn(conversation.id, fresh, historyFrom(conversation.turns.slice(0, index)));
    },
    [patchTurn, runTurn]
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const newChat = useCallback(() => setActiveId(null), []);

  const openConversation = useCallback((id: string) => setActiveId(id), []);

  const deleteConversation = useCallback(
    (id: string) => {
      const conversation = conversationsRef.current.find((c) => c.id === id);
      if (conversation?.turns.some((t) => t.id === busyTurnId)) abortRef.current?.abort();
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeIdRef.current === id) setActiveId(null);
    },
    [busyTurnId]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      hydrated,
      conversations,
      active: conversations.find((c) => c.id === activeId) ?? null,
      activeId,
      busyTurnId,
      isBusy: busyTurnId !== null,
      ask,
      retry,
      stop,
      newChat,
      openConversation,
      deleteConversation,
    }),
    [hydrated, conversations, activeId, busyTurnId, ask, retry, stop, newChat, openConversation, deleteConversation]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside <ChatProvider>");
  return context;
}
