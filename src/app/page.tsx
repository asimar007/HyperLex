"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import Composer from "@/components/Composer";
import Landing from "@/components/Landing";
import Thread from "@/components/Thread";
import { useChat } from "@/context/ChatProvider";

function LoadingShell() {
  return (
    <div className="mx-auto max-w-[46rem] px-5 pt-[14vh]" aria-hidden="true">
      <div className="h-12 w-3/4 animate-pulse rounded-lg bg-rule/70" />
      <div className="mt-5 h-5 w-1/2 animate-pulse rounded bg-rule/60" />
      <div className="mt-8 h-20 animate-pulse rounded-2xl bg-rule/50" />
    </div>
  );
}

export default function Home() {
  const { hydrated, active, busyTurnId, ask, stop, deleteConversation } = useChat();
  const [input, setInput] = useState("");

  const submit = () => {
    ask(input);
    setInput("");
  };

  if (!hydrated) return <LoadingShell />;

  if (!active || active.turns.length === 0) {
    return <Landing input={input} setInput={setInput} onSubmit={submit} />;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[46rem] flex-col px-5">
      {/* In-page chat header with direct delete option */}
      <div className="flex items-center justify-between border-b border-rule/60 py-3">
        <span className="truncate max-w-[20rem] text-xs font-medium text-muted">
          {active.title}
        </span>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete this chat?")) deleteConversation(active.id);
          }}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          title="Delete this chat"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete chat</span>
        </button>
      </div>

      <Thread conversation={active} />
      <div className="sticky bottom-0 z-10 mt-auto bg-gradient-to-t from-paper from-70% to-paper/0 pb-4 pt-8">
        <Composer value={input} onChange={setInput} onSubmit={submit} onStop={stop} busy={busyTurnId !== null} />
        <p className="mt-2 text-center text-xs text-muted">
          Answers can be wrong. Check the sources before relying on anything important.
        </p>
      </div>
    </div>
  );
}
