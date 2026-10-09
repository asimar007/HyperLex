import type { Conversation } from "@/types";

const KEY = "hyperlex_conversations_v2";
const ACTIVE_KEY = "hyperlex_active_conversation";
const MAX_CONVERSATIONS = 50;

/** Anything saved mid-stream (page closed or reloaded) is marked as stopped. */
function normalize(conversations: Conversation[]): Conversation[] {
  return conversations.map((c) => ({
    ...c,
    turns: c.turns.map((t) =>
      t.status === "searching" || t.status === "writing" ? { ...t, status: "stopped" } : t
    ),
  }));
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as Conversation[]) : [];
    return normalize(Array.isArray(saved) ? saved : []);
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  const trimmed = [...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full: keep the most recent half and try once more
    try {
      localStorage.setItem(KEY, JSON.stringify(trimmed.slice(0, Math.ceil(trimmed.length / 2))));
    } catch {
      /* give up silently; the app still works in memory */
    }
  }
}

export function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}
