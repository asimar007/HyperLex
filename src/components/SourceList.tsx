"use client";

import { useState } from "react";
import type { Source } from "@/types";
import { classNames } from "@/lib/utils";
import Favicon from "./Favicon";

const COLLAPSED = 4;

export function SourceSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-hidden="true">
      {Array.from({ length: COLLAPSED }).map((_, i) => (
        <div key={i} className="h-[4.5rem] animate-pulse rounded-lg border border-rule bg-surface" />
      ))}
    </div>
  );
}

export default function SourceList({
  sources,
  activeCite,
  onHover,
}: {
  sources: Source[];
  activeCite: number | null;
  onHover: (n: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (sources.length === 0) return null;

  // Reveal a hidden source when its citation is hovered in the answer
  const showAll = expanded || (activeCite !== null && activeCite > COLLAPSED);
  const visible = showAll ? sources : sources.slice(0, COLLAPSED);

  return (
    <section className="mt-6" aria-label={`${sources.length} sources`}>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {visible.map((s) => {
          const active = activeCite === s.id;
          return (
            <li key={s.id}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => onHover(s.id)}
                onMouseLeave={() => onHover(null)}
                className={classNames(
                  "flex h-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 transition-colors",
                  active
                    ? "border-marker bg-marker/40"
                    : "border-rule bg-surface hover:border-accent/40"
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
                  <span
                    className={classNames(
                      "inline-flex h-4 min-w-[1rem] items-center justify-center rounded px-1 text-[10px] font-semibold",
                      active ? "bg-marker text-marker-ink" : "bg-accent/10 text-accent"
                    )}
                  >
                    {s.id}
                  </span>
                  <Favicon domain={s.domain} />
                  <span className="truncate">{s.domain}</span>
                </span>
                <span className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">{s.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
      {sources.length > COLLAPSED && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="btn-quiet mt-2 -ml-2">
          {expanded ? "Show fewer sources" : `Show all ${sources.length} sources`}
        </button>
      )}
    </section>
  );
}
