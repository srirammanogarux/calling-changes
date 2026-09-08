"use client";

import React from "react";
import * as T from "@/lib/theme";
import { t } from "@/lib/copy";
import { SURVEY_COPY, type MemoryPrompt, type SurveyStage } from "@/lib/memory";
import { SweepText, useSweepOnSelect, wordCount } from "./SweepText";

/**
 * v4: the pick asked as a survey.
 *
 * The whole design problem here is the hand-off from question to greeting, so
 * the rule the whole component is built around is: THE BUBBLE NEVER MOVES.
 *
 * It is one element in one place, sized to the taller of its two texts from
 * the very first frame, with the question and the greeting stacked in the same
 * grid cell. Answering cross-fades between them. Nothing reflows, nothing
 * jumps, and the layout does not have to be animated because it never changes.
 * Everything else (the cards leaving, the tag arriving, Sarah growing back)
 * hangs off that fixed point on its own delay.
 */
export function MemorySurvey({
  pair,
  selected,
  onSelect,
  stage,
  nudge = 0,
}: {
  pair: MemoryPrompt[];
  selected: number | null;
  onSelect: (index: number) => void;
  stage: SurveyStage;
  nudge?: number;
}) {
  const asking = stage === "asking";
  const chosen = selected === null ? null : pair[selected];
  const lit = useSweepOnSelect(
    asking && chosen ? chosen.id : null,
    chosen ? wordCount(chosen.statement) : 0,
  );

  return (
    <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
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
        {/* Both texts in ONE grid cell: the box is the height of the longer of
            them from the start, so the swap is a pure cross-fade with zero
            layout movement. Animating a height here would be the thing that
            makes it feel stitched together. */}
        <div
          data-testid="cv3_survey_bubble"
          style={{
            alignSelf: "stretch",
            display: "grid",
            background: T.bubble.fill,
            borderRadius: T.bubble.radius,
            padding: `${T.bubble.paddingVertical}px ${T.bubble.paddingHorizontal}px`,
            textAlign: "center",
          }}
        >
          <BubbleLine text={SURVEY_COPY.question} visible={asking} />
          <BubbleLine text={t.home.greeting} visible={!asking} />
        </div>
      </div>

      {/* The options collapse rather than disappear: height, opacity and a
          small lift, so the space closes up under the bubble instead of
          vanishing from beneath it. */}
      <div
        style={{
          maxHeight: asking ? 460 : 0,
          opacity: asking ? 1 : 0,
          transform: asking ? "translateY(0)" : "translateY(-10px)",
          overflow: "hidden",
          transition: asking
            ? "max-height 380ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease-out 120ms, transform 380ms cubic-bezier(0.22,1,0.36,1)"
            : "max-height 460ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease-in, transform 460ms cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: asking ? "auto" : "none",
        }}
      >
        <div style={{ height: 16 }} />
        {/* Side by side. Survey options are meant to be SCANNED against each
            other, which two columns do better than a list, and the pair reads
            as one question rather than as two invitations stacked up. It costs
            copy width, which matters far less here than it does when the card
            is asking to be talked to. */}
        <div
          key={`survey-cards-${nudge}`}
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 10,
            animation: nudge > 0 ? "cv3-nudge 520ms ease-out" : undefined,
          }}
        >
          {pair.map((p, i) => (
            <OptionRow
              key={p.id}
              prompt={p}
              index={i}
              selected={i === selected}
              litCount={i === selected ? lit : 0}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      {/* The promise, and only for someone who was actually made one. */}
      <div
        style={{
          maxHeight: stage === "answered" ? 60 : 0,
          opacity: stage === "answered" ? 1 : 0,
          transform: stage === "answered" ? "translateY(0)" : "translateY(6px)",
          overflow: "hidden",
          transition:
            stage === "answered"
              ? "max-height 300ms ease-out 380ms, opacity 300ms ease-out 420ms, transform 300ms ease-out 420ms"
              : "max-height 200ms ease-in, opacity 160ms ease-in, transform 200ms ease-in",
        }}
      >
        <div
          data-testid="cv3_survey_tag"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingTop: 16,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: T.colors.lavender,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            {SURVEY_COPY.tag}
          </span>
        </div>
      </div>
    </div>
  );
}

/** One of the two texts the bubble holds, cross-faded in place. */
function BubbleLine({ text, visible }: { text: string; visible: boolean }) {
  return (
    <div
      style={{
        gridArea: "1 / 1",
        alignSelf: "center",
        color: "#fff",
        fontSize: T.bubble.fontSize,
        lineHeight: `${Math.round(T.bubble.fontSize * T.bubble.lineHeight)}px`,
        opacity: visible ? 1 : 0,
        // The outgoing line clears faster than the incoming one arrives, so
        // the eye is never asked which of two sentences is current.
        transition: visible
          ? "opacity 300ms ease-out 140ms"
          : "opacity 160ms ease-in",
      }}
    >
      {text}
    </div>
  );
}

/**
 * A survey option: half the width, and the same sweep the other layouts use,
 * so picking one lights it.
 */
function OptionRow({
  prompt,
  index,
  selected,
  litCount,
  onSelect,
}: {
  prompt: MemoryPrompt;
  index: number;
  selected: boolean;
  litCount: number;
  onSelect: (index: number) => void;
}) {
  return (
    <button
      data-testid={`cv3_card_${index}`}
      onClick={() => onSelect(index)}
      style={{
        // Equal halves with a shared floor, so the two options always read as
        // one row of choices.
        flex: 1,
        // Shorter than the pick-to-call cards: a survey option is read once
        // and compared, not lived with.
        minHeight: 132,
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
      {/* The topic label is gone: it named a category the statement already
          names, and shouted FOOTBALL in caps over a sentence about Messi. What
          takes the slot is the option's LETTER, which is scaffolding rather
          than content. It gives the row a left anchor so the tick is not
          floating on its own, and it gives the pair a shared vocabulary: two
          untitled cards are "the left one" and "the other one", which is not
          something anyone can say back to you.

          It follows the SLOT, not the prompt. Which topic sits left is drawn
          per session, so A is whatever is on the left this time. That keeps it
          honest as a pointer and costs nothing in the data, where position is
          already logged in its own field. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          alignSelf: "stretch",
        }}
      >
        <div
          style={{
            // Quieter than the topic label was. That one carried information;
            // this is a name for a box, and it must never be read before the
            // sentence under it.
            color: selected ? "rgba(216,205,251,0.85)" : "rgba(255,255,255,0.38)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            transition: "color 180ms ease",
          }}
        >
          {`OPTION ${String.fromCharCode(65 + index)}`}
        </div>
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
      <SweepText
        text={prompt.statement}
        litCount={litCount}
        fontSize={16}
        lineHeight="23px"
        fontWeight={500}
        litColor="#FFFFFF"
        dimColor="rgba(255,255,255,0.6)"
      />
    </button>
  );
}
