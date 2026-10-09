"use client";

import { memo, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "@/types";
import { linkCitations } from "@/lib/citations";
import Favicon from "./Favicon";

interface AnswerProps {
  markdown: string;
  sources: Source[];
  streaming: boolean;
  activeCite: number | null;
  onCiteHover: (n: number | null) => void;
}

function Citation({
  n,
  source,
  active,
  onHover,
}: {
  n: number;
  source: Source;
  active: boolean;
  onHover: (n: number | null) => void;
}) {
  const snippet = source.content.length > 180 ? `${source.content.slice(0, 180)}…` : source.content;
  return (
    <span className="cite" onMouseEnter={() => onHover(n)} onMouseLeave={() => onHover(null)}>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="cite-chip"
        data-active={active}
        aria-label={`Source ${n}: ${source.title}`}
        onFocus={() => onHover(n)}
        onBlur={() => onHover(null)}
      >
        {n}
      </a>
      <span className="cite-card" role="tooltip">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Favicon domain={source.domain} />
          <span className="truncate">{source.domain}</span>
        </span>
        <span className="text-sm font-semibold text-ink">{source.title}</span>
        <span className="text-xs leading-relaxed text-muted">{snippet}</span>
      </span>
    </span>
  );
}

function Answer({ markdown, sources, streaming, activeCite, onCiteHover }: AnswerProps) {
  const linked = useMemo(() => linkCitations(markdown, sources.length), [markdown, sources.length]);

  const components = useMemo<Components>(
    () => ({
      a: ({ href, children }) => {
        if (href?.startsWith("#cite-")) {
          const n = Number(href.slice("#cite-".length));
          const source = sources[n - 1];
          if (!source) return <>{children}</>;
          return <Citation n={n} source={source} active={activeCite === n} onHover={onCiteHover} />;
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        );
      },
      table: ({ children }) => (
        <div className="table-wrap">
          <table>{children}</table>
        </div>
      ),
    }),
    [sources, activeCite, onCiteHover]
  );

  return (
    <div className="answer" aria-live={streaming ? "polite" : undefined} aria-busy={streaming}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {linked}
      </ReactMarkdown>
      {streaming && <span className="caret" aria-hidden="true" />}
    </div>
  );
}

export default memo(Answer);
