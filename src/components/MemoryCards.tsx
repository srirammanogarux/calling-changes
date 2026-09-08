"use client";

import React from "react";
import * as T from "@/lib/theme";
import type { MemoryPrompt } from "@/lib/memory";
import { SweepText, useSweepOnSelect, wordCount } from "./SweepText";

/**
 * v2 of the memory opener: a prompt above, two cards below, pick one.
 *
 * Nothing moves on its own. That is the whole point: with the rotating bubble,
 * which card was on screen at the moment of the tap depended partly on how
 * quickly the user reached the button, so the result mixed topic appeal with
 * reaction time. Here both options are equally available and the tap is a
 * choice.
 *
 * The trade is width. Two cards at 189px hold roughly half the copy of one
 * full-bleed bubble, so the question stops being a sentence Sarah says and
 * becomes a label the app shows. That is a real cost, not a detail.
 */
export function MemoryCards({
  header,
  pair,
  selected,
  onSelect,
  pending = false,
  nudge = 0,
  orientation = "row",
}: {
  header: string;
  /** Always two. `pending` renders placeholders in their place. */
  pair: MemoryPrompt[];
  /** Null until the user picks. Nothing is selected by default. */
  selected: number | null;
  onSelect: (index: number) => void;
  pending?: boolean;
  /** Bumped when the user taps the button before choosing: the cards answer
   *  rather than the tap going nowhere. */
  nudge?: number;
  /**
   * "row" is v2, two cards side by side. "column" is v3, stacked.
   *
   * Stacking buys the copy width back: a full-bleed card holds the sentence
   * Sarah would actually say, where a 189px one holds a label. It costs
   * height, which on a screen that is not allowed to scroll has to come out
   * of something else.
   */
  orientation?: "row" | "column";
}) {
  const column = orientation === "column";
  // The sweep belongs to the CHOICE, so it lives here rather than in the card:
  // moving the pick has to restart it, and the abandoned card must not be left
  // holding a half-lit sentence.
  const chosen = selected === null ? null : pair[selected];
  const lit = useSweepOnSelect(
    chosen ? `${chosen.id}` : null,
    chosen ? wordCount(chosen.question) : 0,
  );
  return (
    <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
      {/* Sarah still speaks the line above the cards, so the screen keeps
          reading as her asking rather than as a menu the app put up. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${T.bubble.tailWidth / 2}px solid transparent`,
            borderRight: `${T.bubble.tailWidth / 2}px solid transparent`,
            borderBottom: `${T.bubble.tailHeight}px solid ${T.bubble.fill}`,
          }}
        />
        <div
          data-testid="cv3_cards_header"
          style={{
            alignSelf: "stretch",
            background: T.bubble.fill,
            borderRadius: T.bubble.radius,
            padding: "12px 32px",
            textAlign: "center",
            fontSize: T.bubble.fontSize,
            lineHeight: "25px",
            color: "#fff",
          }}
        >
          {header}
        </div>
      </div>

      <div style={{ height: column ? 24 : 30 }} />

      <div
        key={`cards-${nudge}`}
        style={{
          display: "flex",
          flexDirection: column ? "column" : "row",
          alignItems: "stretch",
          gap: 10,
          animation: nudge > 0 ? "cv3-nudge 520ms ease-out" : undefined,
        }}
      >
        {pending
          ? [0, 1].map((i) => <PendingCard key={i} column={column} />)
          : pair.map((p, i) => (
              <Card
                key={p.id}
                prompt={p}
                index={i}
                selected={i === selected}
                litCount={i === selected ? lit : 0}
                onSelect={onSelect}
                column={column}
              />
            ))}
      </div>
    </div>
  );
}

function Card({
  prompt,
  index,
  selected,
  litCount,
  onSelect,
  column = false,
}: {
  prompt: MemoryPrompt;
  index: number;
  selected: boolean;
  /** Words lit on this card. Only the chosen one is ever above zero. */
  litCount: number;
  onSelect: (index: number) => void;
  column?: boolean;
}) {
  const open = prompt.topicKey === "open";
  return (
    <button
      data-testid={`cv3_card_${index}`}
      onClick={() => onSelect(index)}
      style={{
        // Stacked cards are sized by their copy; side-by-side ones share a
        // floor so the pair always reads as one row.
        flex: column ? "0 0 auto" : 1,
        minHeight: column ? 0 : 178,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 16,
        textAlign: "left",
        borderRadius: 18,
        background: selected ? "rgba(196,181,253,0.12)" : "rgba(255,255,255,0.07)",
        border: `1px solid ${selected ? "rgba(196,181,253,0.45)" : "rgba(255,255,255,0.11)"}`,
        transition: "background 180ms ease, border-color 180ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "stretch" }}>
        <div
          style={{
            color: selected ? "#D8CDFB" : "#A99BE0",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            // The label can be long ("YOUR SISTER'S WEDDING") in a 189px card,
            // so it wraps rather than pushing the tick off the edge.
            flex: 1,
            minWidth: 0,
          }}
        >
          {prompt.topicLabel}
          {(prompt.visits ?? 1) > 1 && (
            <span style={{ color: "rgba(255,255,255,0.45)" }}> · 2ND</span>
          )}
        </div>
        {/* The corner is the SELECTION indicator here, not a state marker:
            what the card is currently doing outranks what it has been. */}
        {selected ? (
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" fill="#C4B5FD" />
            <path
              d="M7.5 12.2l3 3 6-6.4"
              fill="none"
              stroke="#241B3F"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              border: "1.5px solid rgba(255,255,255,0.22)",
              flexShrink: 0,
            }}
          />
        )}
      </div>
      {/* Both cards rest DIM, and picking one lights it word by word. The
          resting state has to stay comfortably readable: this is a choice the
          user makes by reading both, not a line waiting to be performed. */}
      <SweepText
        text={prompt.question}
        litCount={litCount}
        fontSize={16}
        lineHeight="23px"
        fontWeight={500}
        litColor="#FFFFFF"
        dimColor={open ? "rgba(255,255,255,0.52)" : "rgba(255,255,255,0.6)"}
      />
    </button>
  );
}

function PendingCard({ column = false }: { column?: boolean }) {
  return (
    <div
      data-testid="cv3_cards_pending"
      style={{
        // Stacked cards are sized by their copy; side-by-side ones share a
        // floor so the pair always reads as one row.
        flex: column ? "0 0 auto" : 1,
        minHeight: column ? 0 : 178,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        borderRadius: 18,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.11)",
      }}
    >
      <div className="cv3-shimmer" style={{ width: 62, height: 11, borderRadius: 6 }} />
      <div className="cv3-shimmer" style={{ width: "100%", height: 14, borderRadius: 7 }} />
      <div className="cv3-shimmer" style={{ width: "72%", height: 14, borderRadius: 7 }} />
    </div>
  );
}
