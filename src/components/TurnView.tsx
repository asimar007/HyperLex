"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Copy, CornerDownRight, RotateCcw } from "lucide-react";
import type { Turn } from "@/types";
import { splitAnswer } from "@/lib/citations";
import { classNames } from "@/lib/utils";
import Answer from "./Answer";
import ImageStrip from "./ImageStrip";
import SourceList, { SourceSkeleton } from "./SourceList";

interface TurnViewProps {
  turn: Turn;
  streaming: boolean;
  isLast: boolean;
  busy: boolean;
  onRetry: (turnId: string) => void;
  onAsk: (query: string) => void;
}

function Working({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="mt-5 flex items-center gap-2.5 text-sm text-muted">
      <span className="pulse-dot" aria-hidden="true" />
      {children}
    </p>
  );
}

export default function TurnView({ turn, streaming, isLast, busy, onRetry, onAsk }: TurnViewProps) {
  const [activeCite, setActiveCite] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const { answer, followUps } = useMemo(() => splitAnswer(turn.answer), [turn.answer]);
  const onCiteHover = useCallback((n: number | null) => setActiveCite(n), []);

  const rewrote = turn.searchQuery && turn.searchQuery.trim() !== turn.query.trim();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <article
      id={`turn-${turn.id}`}
      className={classNames(
        "scroll-mt-20 border-b border-rule py-10 last:border-b-0",
        // Leave room so a new question can scroll to the top while its answer streams in
        isLast && "min-h-[calc(100vh-15rem)]"
      )}
    >
      <h2 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink md:text-[1.9rem]">
        {turn.query}
      </h2>

      {turn.status === "searching" && (
        <>
          <Working>
            Searching the web{rewrote ? <> for “{turn.searchQuery}”</> : null}
          </Working>
          <SourceSkeleton />
        </>
      )}

      {turn.sources.length > 0 && (
        <SourceList sources={turn.sources} activeCite={activeCite} onHover={onCiteHover} />
      )}

      {turn.status === "writing" && !answer && (
        <Working>
          Reading {turn.sources.length} {turn.sources.length === 1 ? "source" : "sources"}
        </Working>
      )}

      {answer && (
        <div className="mt-8">
          <Answer
            markdown={answer}
            sources={turn.sources}
            streaming={streaming && turn.status === "writing"}
            activeCite={activeCite}
            onCiteHover={onCiteHover}
          />
        </div>
      )}

      {turn.status === "error" && (
        <div role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
          <p className="text-sm font-semibold text-danger">This answer couldn’t be finished</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{turn.error}</p>
          <button type="button" onClick={() => onRetry(turn.id)} disabled={busy} className="btn-quiet mt-2 -ml-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {turn.status === "stopped" && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          Stopped before the answer was finished.
          <button type="button" onClick={() => onRetry(turn.id)} disabled={busy} className="btn-quiet">
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </button>
        </p>
      )}

      {turn.status === "done" && (
        <>
          <ImageStrip images={turn.images} />

          <div className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-2">
            <button type="button" onClick={copy} className="btn-quiet -ml-2">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button type="button" onClick={() => onRetry(turn.id)} disabled={busy} className="btn-quiet">
              <RotateCcw className="h-3.5 w-3.5" />
              Regenerate
            </button>
            {turn.model && (
              <span className="ml-auto text-xs text-muted">
                Written by {turn.model} from {turn.sources.length} sources
              </span>
            )}
          </div>

          {isLast && followUps.length > 0 && (
            <section className="mt-8" aria-labelledby={`followups-${turn.id}`}>
              <h3 id={`followups-${turn.id}`} className="text-sm font-semibold text-ink">
                Follow-up questions
              </h3>
              <ul className="mt-2 divide-y divide-rule border-y border-rule">
                {followUps.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onAsk(q)}
                      className="group flex w-full items-start gap-3 py-3 text-left text-[15px] text-ink transition-colors hover:text-accent disabled:opacity-50"
                    >
                      <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-muted group-hover:text-accent" />
                      <span>{q}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </article>
  );
}
