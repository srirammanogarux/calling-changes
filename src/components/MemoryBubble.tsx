"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as T from "@/lib/theme";
import { SweepText } from "./SweepText";
import { MEMORY_TIMING as M, type MemoryPrompt } from "@/lib/memory";

/**
 * ONE speech bubble. The card inside it changes.
 *
 * The bubble's height is the height of the TALLEST card, always — every card
 * is rendered stacked in the same grid cell, so the box is sized by the
 * longest question and a shorter one simply centres inside it. Without that
 * the bubble would grow and shrink between cards and take the Start button
 * with it, which is the difference between this feeling premium and feeling
 * cheap. Generated copy will not stay two lines forever.
 */
export function MemoryBubble({
  prompts,
  cardIndex,
  litCount,
  shown,
  onSwipe,
  pending = false,
}: {
  prompts: MemoryPrompt[];
  cardIndex: number;
  /** Words lit on the active card. */
  litCount: number;
  /** False while the outgoing card is leaving. */
  shown: boolean;
  /** +1 = next card, -1 = previous. */
  onSwipe?: (direction: 1 | -1) => void;
  /** The memory has not been written yet — hold the shape, say nothing. */
  pending?: boolean;
}) {
  const s = T.bubble;
  const { x: dragX, animate: dragAnimate, attachWheel, handlers } =
    useHorizontalSwipe(onSwipe);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
      {/* Sarah's tail — the reason this reads as her talking rather than as a
          card the app is showing. */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${s.tailWidth / 2}px solid transparent`,
          borderRight: `${s.tailWidth / 2}px solid transparent`,
          borderBottom: `${s.tailHeight}px solid ${s.fill}`,
        }}
      />
      <div
        data-testid="cv3_memory_bubble"
        ref={attachWheel}
        {...handlers}
        style={{
          alignSelf: "stretch",
          background: s.fill,
          borderRadius: s.radius,
          padding: "16px 18px",
          // Every card in the same cell: the box takes the tallest one.
          display: "grid",
          // The gesture is the BUBBLE's, not the page's: `pan-y` lets a
          // vertical scroll through and claims every horizontal drag, so a
          // swipe changes the topic and never carries the tab with it.
          touchAction: "pan-y",
          cursor: onSwipe && !pending ? "grab" : "default",
          userSelect: "none",
          overflow: "hidden",
        }}
      >
        {pending && <PendingCard />}
        {!pending &&
          prompts.map((p, i) => {
          const active = i === cardIndex;
          return (
            <div
              key={p.id}
              style={{
                gridArea: "1 / 1",
                display: "flex",
                flexDirection: "column",
                gap: 9,
                justifyContent: "center",
                opacity: active && shown ? 1 - Math.min(0.45, Math.abs(dragX) / 260) : 0,
                transform: active
                  ? shown
                    ? `translateX(${dragX}px) scale(1)`
                    : "scale(0.97)"
                  : "scale(0.96)",
                transition:
                  active && dragAnimate === false
                    ? "none"
                    : active
                      ? shown
                        ? `opacity ${M.inMs}ms ease-out, transform ${M.inMs}ms cubic-bezier(0.22,1,0.36,1)`
                        : `opacity ${M.outMs}ms ease-in, transform ${M.outMs}ms ease-in`
                      : "none",
                pointerEvents: active ? "auto" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    color: "#D8CDFB",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                  }}
                >
                  {p.topicLabel}
                </div>
                <div style={{ flex: 1 }} />
                <CardMark prompt={p} />
              </div>
              <Question
                text={p.question}
                litCount={active ? litCount : 0}
                muted={p.covered}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The right-hand slot of the label row. Chrome appears there ONLY when it
 * carries news: the tick for a topic that is finished, a marker for one that
 * has come back. The default card shows nothing at all.
 *
 * It used to carry provenance ("From Tuesday"), which was a receipt for a
 * claim nobody disputes — the user was there. The sentence beside it
 * ("You never finished your point about...") already proves Sarah was
 * listening, and it does it while being interesting. Two credentials for one
 * sentence, in the second-most-looked-at pixel on the card.
 */
function CardMark({ prompt }: { prompt: MemoryPrompt }) {
  if (prompt.covered) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" fill="#43D6A0" />
        <path
          d="M7.5 12.2l3 3 6-6.4"
          fill="none"
          stroke="#0D2B20"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if ((prompt.visits ?? 1) > 1) {
    return (
      <div
        style={{
          padding: "3px 9px",
          borderRadius: 999,
          background: "rgba(196,181,253,0.16)",
          color: "#D8CDFB",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.06em",
          flexShrink: 0,
        }}
      >
        {ordinal(prompt.visits ?? 2)} time
      </div>
    );
  }
  return null;
}

function ordinal(n: number): string {
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

/**
 * The memory has not been written yet. The bubble keeps its shape and its
 * place — a spinner or an empty box would both read as something broken,
 * where this reads as something arriving.
 */
function PendingCard() {
  return (
    <div
      data-testid="cv3_memory_pending"
      style={{ gridArea: "1 / 1", display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="cv3-shimmer" style={{ width: 74, height: 11, borderRadius: 6 }} />
        <div style={{ flex: 1 }} />
      </div>
      <div className="cv3-shimmer" style={{ width: "100%", height: 15, borderRadius: 8 }} />
      <div className="cv3-shimmer" style={{ width: "62%", height: 15, borderRadius: 8 }} />
    </div>
  );
}

/**
 * v1's line, rendered by the shared sweep so every layout lights words the
 * same way. A covered card is an acknowledgement rather than an invitation,
 * so it never reaches full white and cannot compete with a live prompt.
 */
function Question({
  text,
  litCount,
  muted = false,
}: {
  text: string;
  litCount: number;
  muted?: boolean;
}) {
  return (
    <SweepText
      text={text}
      litCount={litCount}
      fontSize={T.bubble.fontSize}
      lineHeight={`${Math.round(T.bubble.fontSize * T.bubble.lineHeight)}px`}
      litColor={muted ? "rgba(255,255,255,0.62)" : "#FFFFFF"}
      dimColor={muted ? "rgba(255,255,255,0.34)" : "rgba(255,255,255,0.5)"}
      glow={!muted}
    />
  );
}

/** Two dots by the CTA. Tappable, so control never depends on a swipe. */
export function MemoryDots({
  count,
  index,
  onJump,
}: {
  count: number;
  index: number;
  onJump: (i: number) => void;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 7, height: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          data-testid={`cv3_memory_dot_${i}`}
          aria-label={`Prompt ${i + 1}`}
          onClick={() => onJump(i)}
          style={{
            width: i === index ? 20 : 6,
            height: 6,
            borderRadius: 999,
            background: i === index ? T.colors.lavender : "rgba(255,255,255,0.25)",
            transition: "width 260ms cubic-bezier(0.22,1,0.36,1), background 260ms ease",
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}


/**
 * Horizontal drag on the bubble.
 *
 * The card follows the finger with resistance, and a committed swipe lands the
 * NEW card from the direction the old one left — so the gesture reads as a
 * carousel rather than a toggle. Below the threshold it springs back, which is
 * how a user learns the gesture exists without being punished for a stray
 * touch.
 *
 * Vertical intent wins outright: if the first movement is mostly up or down we
 * let go of the pointer entirely, so a scroll is never stolen by the card.
 */
function useHorizontalSwipe(onSwipe?: (direction: 1 | -1) => void) {
  const [x, setX] = useState(0);
  const [animate, setAnimate] = useState(true);
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<"none" | "x" | "y">("none");
  const swipeRef = useRef(onSwipe);
  useEffect(() => {
    swipeRef.current = onSwipe;
  }, [onSwipe]);

  /** Past this, the swipe commits. Short enough to feel light, long enough
   *  that a thumb resting on the bubble does not flip the topic. */
  const THRESHOLD = 44;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
    axis.current = "none";
    setAnimate(false);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (axis.current === "none") {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axis.current === "y") start.current = null;
      return;
    }
    if (axis.current !== "x") return;
    // Resistance: the card moves less than the finger, so the box never feels
    // like it is coming off its hinges.
    setX(dx * 0.45);
  }, []);

  const finish = useCallback(
    (e: React.PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s || axis.current !== "x") {
        setAnimate(true);
        setX(0);
        return;
      }
      const dx = e.clientX - s.x;
      axis.current = "none";
      if (Math.abs(dx) >= THRESHOLD && onSwipe) {
        const direction: 1 | -1 = dx < 0 ? 1 : -1;
        onSwipe(direction);
        // Land the incoming card from the side the outgoing one left.
        setAnimate(false);
        setX(direction === 1 ? 70 : -70);
        requestAnimationFrame(() => {
          setAnimate(true);
          setX(0);
        });
        return;
      }
      setAnimate(true);
      setX(0);
    },
    [onSwipe],
  );

  /**
   * The same gesture from a trackpad or a mouse wheel.
   *
   * Registered by hand so it can be NON-PASSIVE: without `preventDefault` a
   * two-finger flick scrolls the document instead of the card, which is how
   * the whole mockup ends up sliding toward empty space. Deltas accumulate so
   * one physical flick is one card, and a cooldown stops the tail of that
   * flick counting as a second.
   */
  const attachWheel = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    let accum = 0;
    let cooldownUntil = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      // Ours either way: even below the threshold this must not reach the page.
      e.preventDefault();
      const now = performance.now();
      if (now < cooldownUntil) return;
      accum += e.deltaX;
      if (Math.abs(accum) < 40) return;
      const direction: 1 | -1 = accum > 0 ? 1 : -1;
      accum = 0;
      cooldownUntil = now + 650;
      swipeRef.current?.(direction);
      setAnimate(false);
      setX(direction === 1 ? 70 : -70);
      requestAnimationFrame(() => {
        setAnimate(true);
        setX(0);
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return {
    x,
    animate,
    attachWheel,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onPointerLeave: finish,
    },
  };
}
