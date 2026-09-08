"use client";

import React, { useEffect, useState } from "react";
import { MEMORY_TIMING as M } from "@/lib/memory";

/**
 * The word sweep, shared by every layout so the gesture means the same thing
 * wherever it appears.
 *
 * Each word flips on its own beat but eases over a longer window, so several
 * are mid-transition at once and the line reads as a wave rather than a
 * stutter. The unlit state is never a ghost: someone reading faster than the
 * sweep has to be able to read ahead, so the contrast between lit and unlit
 * does the work rather than the unlit half being unreadable.
 */
export function SweepText({
  text,
  litCount,
  fontSize,
  lineHeight,
  litColor = "#FFFFFF",
  dimColor = "rgba(255,255,255,0.5)",
  glow = true,
  fontWeight,
}: {
  text: string;
  /** Words lit, from the left. */
  litCount: number;
  fontSize: number;
  lineHeight: string;
  litColor?: string;
  dimColor?: string;
  glow?: boolean;
  fontWeight?: number;
}) {
  const words = text.trim().split(/\s+/);
  return (
    <div style={{ fontSize, lineHeight, fontWeight }}>
      {words.map((w, i) => {
        const lit = i < litCount;
        return (
          <span
            key={i}
            style={{
              color: lit ? litColor : dimColor,
              textShadow:
                lit && glow ? "0 0 12px rgba(255,255,255,0.25)" : "none",
              transition: `color ${M.wordFadeMs}ms ease-out, text-shadow ${M.wordFadeMs}ms ease-out`,
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Runs the sweep when a card is CHOSEN rather than on a timer.
 *
 * In v1 the sweep is Sarah saying the line as it arrives. Here it is the
 * answer to a tap: the card you picked lights up, which is what makes the
 * choice feel like it landed rather than like a radio button.
 *
 * Nothing is gated on it. Start is live from the first word, so a long
 * sentence never holds the user up.
 */
export function useSweepOnSelect(
  /** Null while nothing is chosen. */
  key: string | null,
  words: number,
): number {
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (key === null) {
      const id = window.setTimeout(() => setLit(0), 0);
      return () => window.clearTimeout(id);
    }
    const timers: number[] = [];
    // Every write is inside a timeout: the sweep restarts from zero when the
    // choice moves to the other card, so a half-lit sentence is never left
    // behind on the card the user just abandoned.
    timers.push(window.setTimeout(() => setLit(0), 0));
    for (let w = 1; w <= words; w++) {
      timers.push(window.setTimeout(() => setLit(w), 40 + (w - 1) * M.wordMs));
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [key, words]);

  return lit;
}
