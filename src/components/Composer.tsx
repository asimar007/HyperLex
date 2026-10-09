"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { classNames } from "@/lib/utils";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  busy: boolean;
  autoFocus?: boolean;
  large?: boolean;
  placeholder?: string;
}

const MAX_HEIGHT = 220;

const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer(
  { value, onChange, onSubmit, onStop, busy, autoFocus, large, placeholder = "Ask a follow-up" },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  // Grow with the text, up to a limit
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !busy;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
      className={classNames(
        "relative rounded-2xl border border-rule bg-surface shadow-[0_1px_2px_rgb(var(--ink)/0.06),0_8px_24px_-12px_rgb(var(--ink)/0.18)] transition-colors focus-within:border-accent/60",
        large ? "p-3" : "p-2"
      )}
    >
      <label htmlFor="composer" className="sr-only">
        Your question
      </label>
      <textarea
        id="composer"
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSubmit();
          }
        }}
        rows={1}
        autoFocus={autoFocus}
        placeholder={placeholder}
        maxLength={2000}
        className={classNames(
          "block w-full resize-none bg-transparent pr-12 text-ink placeholder:text-muted/80 focus:outline-none",
          large ? "min-h-[3.5rem] px-2 py-1.5 text-lg" : "min-h-[2.5rem] px-2 py-2 text-base"
        )}
      />
      <div className="absolute bottom-2.5 right-2.5">
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper transition-opacity hover:opacity-85"
            aria-label="Stop answering"
            title="Stop"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-30"
            aria-label="Ask"
            title="Ask (Enter)"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </form>
  );
});

export default Composer;
