"use client";

import React from "react";
import * as T from "@/lib/theme";
import { CallingBackground } from "./kit";

/**
 * Recent Calls, as five states.
 *
 * Ported from the Paper band "8 History" (frames N1, N2, A1, D2, D3) at the
 * values Paper actually holds, not from the picture of them.
 *
 * The redesign's argument, and the thing worth reviewing: TIME leads the row.
 * The list used to open with an award — three stars at the top left of a card,
 * date underneath — which reads as a scoreboard of things you did badly. Here
 * the primary line is when the call happened, the duration sits under it, and
 * the award is a small right-hand lane. Rows are separated by a hairline
 * instead of being boxed, so the page reads as one list rather than a stack of
 * receipts, and the section totals ("4m 37s total") give the one number a
 * learner actually wants: how much they talked.
 */

/* ── The shape of a row ──────────────────────────────────────────────────── */

/**
 * Whether this row has an award to show.
 *
 * Three server states collapse into two treatments, because the only thing the
 * user needs from the difference is whether waiting will help:
 *   * `pending` / `in_progress` / `unknown` → "coming". It resolves itself.
 *   * `failed` → "none". Terminal.
 *   * `not_available` → "none". Legacy imports that were never queued, so
 *     nothing is coming and nothing went wrong either.
 */
export type RowAnalysis = "ready" | "coming" | "none";

export interface HistoryRowData {
  id: string;
  /** Server-formatted and rendered verbatim, exactly as the app does it. */
  when: string;
  /**
   * Server-formatted, rendered verbatim. Null ONLY when `/conclude` never ran
   * and the server sent no length at all, which is rare and separate from
   * having no score: an unanalysed call still knows how long it was.
   */
  duration: string | null;
  /** Fractional in 0.5 steps, out of `totalStars`. */
  stars: number;
  totalStars: number;
  /** Defaults to "ready": the row has its award. */
  analysis?: RowAnalysis;
}

export interface HistorySection {
  key: string;
  label: string;
  /** The section's own total. The reason to group at all. */
  total: string;
  rows: HistoryRowData[];
}

/** The fixture, lifted row for row from the Paper frame. */
export const HISTORY_SECTIONS: HistorySection[] = [
  {
    key: "today",
    label: "TODAY",
    total: "4m 37s total",
    rows: [
      { id: "h1", when: "Today · 9:12 AM", duration: "4 min 37 s", stars: 2, totalStars: 3 },
    ],
  },
  {
    key: "week",
    label: "THIS WEEK",
    total: "9m 17s total",
    rows: [
      { id: "h2", when: "Yesterday · 8:41 PM", duration: "6 min 02 s", stars: 3, totalStars: 3 },
      { id: "h3", when: "12 Aug · 7:20 AM", duration: "3 min 15 s", stars: 1, totalStars: 3 },
    ],
  },
  {
    key: "earlier",
    label: "EARLIER",
    // 3:41 + 5:24. The totals are real sums, so the unanalysed call is IN it:
    // the call happened and those minutes were spoken. A total that quietly
    // dropped a call the user can see listed under it would be a worse bug
    // than the one this state exists to fix.
    total: "9m 05s total",
    rows: [
      // The award is missing; the DURATION is not. A call always has a length,
      // and this row used to say "Didn't finish", which was the internal reason
      // dressed up as user-facing copy. What the user can act on is the same
      // fact as every other unanalysed call: there is no score. The reason is
      // ours.
      { id: "h4", when: "10 Aug · 10:05 PM", duration: "3 min 41 s", stars: 0, totalStars: 3, analysis: "none" },
      { id: "h5", when: "8 Aug · 6:48 PM", duration: "5 min 24 s", stars: 3, totalStars: 3 },
    ],
  },
];

/**
 * The same list, with an analysis still in flight.
 *
 * The TERMINAL case now lives in the default fixture, because a call that
 * never concluded has no score either and there is no longer a separate way of
 * saying so. What this state adds is the transient one, so both sit on screen
 * together: the whole design question is whether a reader can tell "wait a
 * minute" apart from "this one is never coming" without being told twice.
 *
 * The section totals are UNCHANGED. The call happened and its minutes count;
 * only the award is missing, and a total that quietly dropped a call the user
 * can see listed above it would be a worse bug than the one being fixed.
 */
export const HISTORY_SECTIONS_NO_ANALYSIS: HistorySection[] =
  HISTORY_SECTIONS.map((s) => ({
    ...s,
    rows: s.rows.map((r) =>
      r.id === "h1" ? { ...r, analysis: "coming" as const } : r,
    ),
  }));

/* ── The states ──────────────────────────────────────────────────────────── */

export type HistoryStateKey =
  /** Rows on screen. */
  | "loaded"
  /** The first load is in flight. */
  | "loading"
  /** Loaded, and there is genuinely nothing. */
  | "empty"
  /** The FIRST load failed, so there is no list at all. */
  | "error"
  /** The list is fine; the next PAGE failed. */
  | "load_more_failed"
  /** The calls are all there. Some of them have no award to show. */
  | "no_analysis";

export const HISTORY_STATES: {
  key: HistoryStateKey;
  label: string;
  hint: string;
  replaces: string;
}[] = [
  {
    key: "loaded",
    label: "N1 · Loaded",
    hint: "Time-led rows under dated sections, each with its own talk total. The award is a right-hand lane, not the headline.",
    replaces: "HistoryLoaded",
  },
  {
    key: "loading",
    label: "N2 · Loading",
    hint: "The skeleton is the SHAPE of the real row, down to the award slot, so nothing moves when the rows land.",
    replaces: "HistoryLoading",
  },
  {
    key: "empty",
    label: "A1 · Empty",
    hint: "Two ghost rows show what the page will look like once it fills, then the reason to make the first call.",
    replaces: "HistoryLoaded (no entries)",
  },
  {
    key: "error",
    label: "D2 · Couldn't load",
    hint: "The first load failed. A banner over the skeleton rather than a full-screen error: the page keeps its shape and the retry is one tap away.",
    replaces: "HistoryFailure",
  },
  {
    key: "load_more_failed",
    label: "D3 · Couldn't load more",
    hint: "The page you have is fine and stays on screen; only the next page failed. The retry lives at the bottom where the missing rows would be.",
    replaces: "HistoryLoaded(loadMoreFailed)",
  },
  {
    key: "no_analysis",
    label: "P · Analysis missing",
    hint: "The call is there and its minutes count; only the award is missing. It is said on the second line, where the row already explains itself: Analysing under a breathing dot while it is coming, Score unavailable under an alert glyph when it never will be. The award lane empties and the chevron goes with it, because a row that opens an empty page is worse than one that does not open. Today all three server states render as earnedStars ?? 0, so a missing analysis is indistinguishable from a zero-star call.",
    replaces: "analysisStatus != completed",
  },
];

export function historyState(key: string) {
  return HISTORY_STATES.find((s) => s.key === key) ?? HISTORY_STATES[0];
}

/* ── The screen ──────────────────────────────────────────────────────────── */

export function HistoryScreen({ state }: { state: HistoryStateKey }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CallingBackground />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />
        <div
          className="no-bar"
          data-testid="cv3_history_list"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 20px 20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {state === "empty" ? (
            <EmptyState />
          ) : state === "loading" ? (
            <Skeleton />
          ) : state === "error" ? (
            <>
              <ErrorBanner />
              <Skeleton />
            </>
          ) : (
            <>
              {(state === "no_analysis"
                ? HISTORY_SECTIONS_NO_ANALYSIS
                : HISTORY_SECTIONS
              ).map((s, i) => (
                <React.Fragment key={s.key}>
                  <SectionHeader section={s} first={i === 0} />
                  {s.rows.map((r) => (
                    <Row key={r.id} row={r} />
                  ))}
                </React.Fragment>
              ))}
              {state === "load_more_failed" && <LoadMoreFailed />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
        // Paper's frame had the status bar as a real 62px element; here it is
        // an overlay, so the same 20px clears the safe area instead of the top
        // of the glass.
        padding: `${T.frame.safeTop + 20}px 20px 16px 24px`,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // The 48px slot is bigger than the 32px glyph on purpose: it is the
          // tap target, and it pulls the arrow off the screen edge.
          marginLeft: -8,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      </div>
      <div style={{ flex: 1, color: "#FFFFFF", fontSize: 24, fontWeight: 600, lineHeight: "30px" }}>
        Recent Calls
      </div>
    </div>
  );
}

/**
 * The section head.
 *
 * The TOTAL is the whole reason the list is grouped. A bare "THIS WEEK" is
 * filing; "THIS WEEK · 9m 17s total" answers the question a learner opens this
 * page with.
 */
function SectionHeader({ section, first }: { section: HistorySection; first: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: `${first ? 20 : 26}px 4px 8px`,
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.1em",
          lineHeight: "16px",
        }}
      >
        {section.label}
      </div>
      <div
        className="tabular"
        style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: 13,
          fontWeight: 500,
          lineHeight: "16px",
        }}
      >
        {section.total}
      </div>
    </div>
  );
}

function Row({ row }: { row: HistoryRowData }) {
  const analysis = row.analysis ?? "ready";
  // A row that opens an empty analysis is worse than a row that does not open.
  // "coming" still opens: the analysis page has its own waiting state, and
  // that is where someone who wants to watch it should be able to go.
  const opens = analysis !== "none";

  return (
    <button
      data-testid={`cv3_history_row_${row.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 4px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        textAlign: "left",
        width: "100%",
        cursor: opens ? "pointer" : "default",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ color: "#FFFFFF", fontSize: 17, fontWeight: 600, lineHeight: "22px" }}>
          {row.when}
        </div>

        {/* Line two is where the row explains itself. The duration is a fact
            about the call; what follows it is a fact about the score, and each
            leads with its own glyph so the two states are told apart before
            either is read. */}
        <div
          data-testid={`cv3_history_sub_${row.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            lineHeight: "18px",
          }}
        >
          {row.duration && (
            <span style={{ color: "rgba(255,255,255,0.50)" }}>{row.duration}</span>
          )}
          {row.duration && analysis !== "ready" && (
            <span style={{ color: "rgba(255,255,255,0.22)" }}>·</span>
          )}

          {analysis === "coming" && (
            <>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "#C4B5FD",
                  flexShrink: 0,
                  // A slow breath, not a blink: the row is waiting, not
                  // alerting, and six blinking dots down one list is a fault
                  // indicator panel.
                  animation: "hist-waiting 1.8s ease-in-out infinite",
                }}
              />
              <span style={{ color: "rgba(196,181,253,0.85)" }}>Analysing</span>
            </>
          )}

          {analysis === "none" && (
            <>
              {/* Amber, inherited from the "Didn't finish" line this replaces:
                  the row already had a colour for "something here is not
                  right", and it is not red, because nothing the user did
                  caused it and nothing they do will fix it. */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(251,191,36,0.75)"
                strokeWidth="2.2"
                strokeLinecap="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4.5M12 16h.01" />
              </svg>
              <span style={{ color: "rgba(251,191,36,0.75)" }}>Score unavailable</span>
            </>
          )}
        </div>
      </div>

      {/* The award lane. It is NEVER three empty stars when there is no
          analysis: that is a score of zero, and this row has no score at all.
          The two are opposite facts and they must not share a picture. The
          slot is held so the lane keeps its right edge either way. */}
      <div
        style={{
          minWidth: 48,
          height: 14,
          flexShrink: 0,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {analysis === "ready" && <StarRow earned={row.stars} total={row.totalStars} />}
      </div>

      <div style={{ width: 18, height: 18, flexShrink: 0 }}>
        {opens && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        )}
      </div>
    </button>
  );
}

/**
 * The award, at list scale.
 *
 * White rather than the summary page's gold: this is a dense list on a dark
 * ground, where five gold rows read as five warnings. A partial star is a
 * left-to-right CLIP of the lit glyph over the unlit one, so half a star is
 * half FILLED rather than a whole dimmer one.
 */
function StarRow({ earned, total }: { earned: number; total: number }) {
  const size = 14;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
      {Array.from({ length: total }, (_, i) => Math.max(0, Math.min(1, earned - i))).map(
        (fill, i) => (
          <div key={i} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <Star size={size} color="rgba(255,255,255,0.20)" />
            {fill > 0 && (
              <div style={{ position: "absolute", inset: 0, width: size * fill, overflow: "hidden" }}>
                <Star size={size} color="rgba(255,255,255,0.85)" />
              </div>
            )}
          </div>
        ),
      )}
    </div>
  );
}

function Star({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, display: "block" }}>
      <path
        d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"
        fill={color}
      />
    </svg>
  );
}

/* ── Loading ─────────────────────────────────────────────────────────────── */

/**
 * The skeleton is the row's SKELETON, not a generic grey block: two stacked
 * bars on the left, a three-star slot, a chevron stub. When the rows arrive
 * nothing reflows, because the placeholder was already the right shape.
 */
function Skeleton() {
  return (
    <>
      <SectionSkeleton first />
      <RowSkeleton width={168} />
      <SectionSkeleton />
      <RowSkeleton width={152} />
      <RowSkeleton width={176} />
      <RowSkeleton width={140} />
      <RowSkeleton width={162} />
    </>
  );
}

function SectionSkeleton({ first }: { first?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${first ? 20 : 26}px 4px 8px`,
      }}
    >
      <Bar w={62} h={11} bg="rgba(255,255,255,0.13)" />
      <Bar w={88} h={11} bg="rgba(255,255,255,0.08)" />
    </div>
  );
}

function RowSkeleton({ width }: { width: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 4px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
        <div
          className="cv3-shimmer"
          style={{ width, height: 15, borderRadius: 8, flexShrink: 0 }}
        />
        <Bar w={86} h={12} bg="rgba(255,255,255,0.08)" />
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 13,
              height: 13,
              borderRadius: 3,
              background: "rgba(255,255,255,0.10)",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      <div
        style={{
          width: 8,
          height: 14,
          borderRadius: 3,
          background: "rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      />
    </div>
  );
}

function Bar({ w, h, bg }: { w: number; h: number; bg: string }) {
  return <div style={{ width: w, height: h, borderRadius: 6, background: bg, flexShrink: 0 }} />;
}

/* ── Empty ───────────────────────────────────────────────────────────────── */

/**
 * Two ghost rows, then the reason to make a call.
 *
 * The ghosts are the argument: an empty state that only apologises teaches
 * nothing, where a faded preview of the real list says what this page will be
 * worth once there is something in it.
 */
function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 12px 60px",
      }}
    >
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 10, opacity: 0.28 }}>
        <GhostRow title={150} sub={80} strong />
        <GhostRow title={120} sub={70} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40 }}>
        <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 700, lineHeight: "30px", textAlign: "center" }}>
          No calls yet
        </div>
        <div
          style={{
            paddingTop: 10,
            color: "rgba(255,255,255,0.65)",
            fontSize: 16,
            lineHeight: "25px",
            textAlign: "center",
          }}
        >
          Every call you finish lands here: how long you spoke, and what you earned.
        </div>
      </div>

      <button
        data-testid="cv3_history_empty_cta"
        style={{
          alignSelf: "stretch",
          marginTop: 28,
          height: 58,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          borderRadius: 18,
          background: "linear-gradient(180deg, #EFE9FE 0%, #C7B4F4 100%)",
        }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <path
            d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.3 1z"
            fill="#1A1230"
          />
        </svg>
        <div style={{ color: "#1A1230", fontSize: 18, fontWeight: 700, lineHeight: "22px" }}>
          Call Sarah
        </div>
      </button>
    </div>
  );
}

function GhostRow({ title, sub, strong }: { title: number; sub: number; strong?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 4px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <Bar w={title} h={12} bg={strong ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.28)"} />
        <Bar w={sub} h={10} bg={strong ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.14)"} />
      </div>
      <Bar w={52} h={12} bg={strong ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.14)"} />
    </div>
  );
}

/* ── The two failures ────────────────────────────────────────────────────── */

/**
 * The first load failed.
 *
 * A banner over the skeleton rather than a full-screen apology: the page keeps
 * its shape, so a retry that works fills the rows already on screen instead of
 * replacing one whole screen with another.
 */
function ErrorBanner() {
  return (
    <div
      data-testid="cv3_history_banner"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 4,
        padding: "14px 16px",
        borderRadius: 16,
        background: "rgba(240,163,47,0.12)",
        border: "1px solid rgba(240,163,47,0.30)",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4.5M12 16h.01" />
      </svg>
      <div style={{ flex: 1, color: "#FDE68A", fontSize: 14, fontWeight: 500, lineHeight: "18px" }}>
        Couldn&rsquo;t load your calls
      </div>
      <button style={{ flexShrink: 0, color: "#FFFFFF", fontSize: 14, fontWeight: 700, lineHeight: "18px" }}>
        Retry
      </button>
    </div>
  );
}

/**
 * The NEXT page failed.
 *
 * Deliberately quiet, and deliberately not a banner: what the user is reading
 * is still correct and still there. Only the rows below this line are missing,
 * so the notice sits exactly where they would have been.
 */
function LoadMoreFailed() {
  return (
    <div
      data-testid="cv3_history_more_failed"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "22px 0 8px",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.50)", fontSize: 14, lineHeight: "18px" }}>
        Couldn&rsquo;t load older calls
      </div>
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M3 3v5h5" />
          <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        </svg>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 600, lineHeight: "18px" }}>
          Retry
        </div>
      </button>
    </div>
  );
}
