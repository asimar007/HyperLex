"use client";

import { useState } from "react";
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
  const { hydrated, active, isBusy, ask, stop } = useChat();
  const [input, setInput] = useState("");

  const submit = () => {
    if (!input.trim() || isBusy) return;
    ask(input);
    setInput("");
  };

  if (!hydrated) return <LoadingShell />;

  if (!active || active.turns.length === 0) {
    return <Landing input={input} setInput={setInput} onSubmit={submit} />;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[46rem] flex-col px-5">
      <Thread conversation={active} />
      <div className="sticky bottom-0 z-10 mt-auto bg-gradient-to-t from-paper from-70% to-paper/0 pb-4 pt-8">
        <Composer value={input} onChange={setInput} onSubmit={submit} onStop={stop} busy={isBusy} />
        <p className="mt-2 text-center text-xs text-muted">
          Answers can be wrong. Check the sources before relying on anything important.
        </p>
      </div>
    </div>
  );
}
