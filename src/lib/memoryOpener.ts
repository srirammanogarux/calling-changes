"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildShowOrder, MEMORY_TIMING as M, type MemoryPrompt } from "./memory";

/**
 * The opener's little state machine: which card is on screen, how much of it
 * is lit, and when the CTA is allowed to follow.
 *
 * One hook rather than callbacks out of a component, because three different
 * things read this state at three different moments — the bubble (immediately),
 * the pager dots (immediately) and the CTA label (one beat later) — and a
 * callback chain would let them drift apart.
 */

export interface MemoryOpenerState {
  /** The card on screen right now — the bubble and the dots read this. */
  cardIndex: number;
  /** The card the CTA is allowed to name. Trails `cardIndex` by `ctaLagMs`. */
  ctaIndex: number;
  /** How many words of the current card are lit. */
  litCount: number;
  /** False while the outgoing card is on its way out. */
  shown: boolean;
  /** Rotation has stopped — the user touched something, or it finished. */
  stopped: boolean;
  /** Any touch on the screen stops the rotation for the session. */
  stop: () => void;
  /** A dot tap: jump there and stop. */
  jumpTo: (index: number) => void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useMemoryOpener(
  prompts: MemoryPrompt[],
  /** Bumping this reshuffles: a new random start card. */
  nonce = 0,
): MemoryOpenerState {
  // Which prompt OPENS is what the experiment measures, so it must vary —
  // otherwise the second prompt is permanently the understudy and we learn
  // nothing about it. The randomness itself lives with the caller (an event
  // handler, where it belongs); this only maps the draw onto a card.
  const drawn = Math.abs(Math.trunc(nonce)) % prompts.length;
  /**
   * The full running order, not just a starting point: a COVERED card leads
   * once and then drops out, so the sequence cannot be `(start + n) % length`
   * any more.
   */
  const order = useMemo(
    () => buildShowOrder(prompts, drawn),
    [prompts, drawn],
  );
  const startIndex = order[0];

  const [cardIndex, setCardIndex] = useState(startIndex);
  const [ctaIndex, setCtaIndex] = useState(startIndex);
  const [litCount, setLitCount] = useState(0);
  const [shown, setShown] = useState(true);
  const [stopped, setStopped] = useState(false);

  const stoppedRef = useRef(false);
  useEffect(() => {
    stoppedRef.current = stopped;
  }, [stopped]);

  const wordCount = useCallback(
    (i: number) => prompts[i].question.trim().split(/\s+/).length,
    [prompts],
  );

  const stop = useCallback(() => setStopped(true), []);

  const jumpTo = useCallback(
    (index: number) => {
      setStopped(true);
      setCardIndex(index);
      setCtaIndex(index);
      setLitCount(wordCount(index));
      setShown(true);
    },
    [wordCount],
  );

  useEffect(() => {
    // Reduce-motion: everything readable, nothing moving, dots still work.
    if (prefersReducedMotion()) {
      const id = window.setTimeout(() => {
        setLitCount(wordCount(startIndex));
        setStopped(true);
      }, 0);
      return () => window.clearTimeout(id);
    }

    let cancelled = false;
    const timers: number[] = [];
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    /** Light the current card in full and give up the floor. */
    const rest = (i: number) => {
      setLitCount(wordCount(i));
      setShown(true);
      setStopped(true);
    };

    const run = async () => {
      const totalShows = order.length;
      for (let show = 0; show < totalShows; show++) {
        const i = order[show];

        if (show > 0) {
          // Hand-over: the outgoing card leaves, the incoming one rises into
          // the same slot while it is still on its way out.
          setShown(false);
          await sleep(M.outMs - M.overlapMs);
          if (cancelled) return;
          setCardIndex(i);
          setLitCount(0);
          setShown(true);
          // The CTA follows the card home rather than travelling with it.
          timers.push(
            window.setTimeout(() => {
              if (!cancelled) setCtaIndex(i);
            }, M.inMs + M.ctaLagMs),
          );
        }

        await sleep(M.inMs);
        if (cancelled) return;
        if (stoppedRef.current) return rest(i);

        const words = wordCount(i);
        for (let w = 1; w <= words; w++) {
          if (cancelled) return;
          // A touch mid-sweep finishes the sentence instantly rather than
          // freezing it half-lit, which would read as a stall.
          if (stoppedRef.current) return rest(i);
          setLitCount(w);
          await sleep(M.wordMs);
        }
        if (cancelled) return;

        // The decision window.
        await sleep(M.holdMs);
        if (cancelled) return;
        if (stoppedRef.current) return rest(i);
        // Last show: rest here rather than looping forever.
        if (show === totalShows - 1) {
          setStopped(true);
          return;
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [order, startIndex, wordCount]);

  return { cardIndex, ctaIndex, litCount, shown, stopped, stop, jumpTo };
}
