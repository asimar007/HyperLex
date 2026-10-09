"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Newspaper, Plus, Search, Trash2 } from "lucide-react";
import { useChat } from "@/context/ChatProvider";
import { classNames } from "@/lib/utils";

export default function Sidebar({ onNavigate }: { onNavigate: (href: string) => void }) {
  const pathname = usePathname();
  const { hydrated, conversations, activeId, busyTurnId, newChat, openConversation, deleteConversation } =
    useChat();

  const recent = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations]
  );

  const navItem = (active: boolean) =>
    classNames(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active ? "bg-rule/70 text-ink" : "text-muted hover:bg-rule/50 hover:text-ink"
    );

  return (
    <nav className="flex h-full flex-col gap-5 p-3" aria-label="Main">
      <button
        type="button"
        className="btn-primary w-full justify-start"
        onClick={() => {
          newChat();
          onNavigate("/");
        }}
      >
        <Plus className="h-4 w-4" />
        New research
      </button>

      <ul className="space-y-0.5">
        <li>
          <button type="button" className={navItem(pathname === "/")} onClick={() => onNavigate("/")}>
            <Search className="h-4 w-4" />
            Research
          </button>
        </li>
        <li>
          <button
            type="button"
            className={navItem(pathname === "/hackernews")}
            onClick={() => onNavigate("/hackernews")}
          >
            <Newspaper className="h-4 w-4" />
            Hacker News
          </button>
        </li>
      </ul>

      <section className="flex min-h-0 flex-1 flex-col" aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="px-3 pb-2 text-xs font-semibold text-muted">
          Recent
        </h2>
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {hydrated && recent.length === 0 && (
            <p className="px-3 text-sm leading-relaxed text-muted">Questions you ask are saved here, in this browser.</p>
          )}
          <ul className="space-y-0.5">
            {recent.map((c) => {
              const isActive = pathname === "/" && c.id === activeId;
              const isWorking = c.turns.some((t) => t.id === busyTurnId);
              return (
                <li key={c.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      openConversation(c.id);
                      onNavigate("/");
                    }}
                    className={classNames(
                      "flex w-full items-center gap-2 rounded-lg py-2 pl-3 pr-9 text-left text-sm transition-colors",
                      isActive ? "bg-rule/70 text-ink" : "text-muted hover:bg-rule/50 hover:text-ink"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isWorking && <span className="pulse-dot shrink-0" aria-label="Working" />}
                    <span className="truncate">{c.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete "${c.title}"?`)) deleteConversation(c.id);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted opacity-0 transition-opacity hover:bg-rule hover:text-danger focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                    aria-label={`Delete ${c.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </nav>
  );
}
