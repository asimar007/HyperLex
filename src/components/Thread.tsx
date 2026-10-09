"use client";

import { useEffect, useRef } from "react";
import type { Conversation } from "@/types";
import { useChat } from "@/context/ChatProvider";
import TurnView from "./TurnView";

export default function Thread({ conversation }: { conversation: Conversation }) {
  const { busyTurnId, isBusy, ask, retry } = useChat();
  const turnCount = conversation.turns.length;
  const previous = useRef({ id: conversation.id, count: turnCount });

  useEffect(() => {
    const prev = previous.current;
    previous.current = { id: conversation.id, count: turnCount };

    if (prev.id !== conversation.id) {
      // Opened a different conversation: start at the top
      window.scrollTo({ top: 0 });
      return;
    }
    if (turnCount > prev.count) {
      // A new question was asked: bring it to the top of the view
      const last = conversation.turns[turnCount - 1];
      document.getElementById(`turn-${last.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [conversation.id, conversation.turns, turnCount]);

  return (
    <div>
      {conversation.turns.map((turn, i) => (
        <TurnView
          key={turn.id}
          turn={turn}
          streaming={turn.id === busyTurnId}
          isLast={i === turnCount - 1}
          busy={isBusy}
          onRetry={retry}
          onAsk={(q) => ask(q)}
        />
      ))}
    </div>
  );
}
