"use client";

import React, { useEffect, useRef, useState } from "react";
import * as T from "@/lib/theme";
import { t } from "@/lib/copy";
import { minutesLabel } from "@/lib/format";
import { startRouteFor, type HomeGate, type StartRoute } from "@/lib/types";
import {
  CallingAvatar,
  CallingBackground,
  CallingStartButton,
  CallingTopPill,
  Icon,
  SarahSpeechBubble,
  ShimmerBox,
} from "./kit";
import { MemoryBubble, MemoryDots } from "./MemoryBubble";
import { cardsFor, memorySet, SURVEY_COPY, type SurveyStage } from "@/lib/memory";
import { MemorySurvey } from "./MemorySurvey";
import { MemoryCards } from "./MemoryCards";
import { useMemoryOpener } from "@/lib/memoryOpener";

export type BalanceState =
  | { kind: "loading" }
  | { kind: "loaded"; remainingS: number; tooltip?: string }
  | { kind: "unknown" };

/**
 * The calling home (pre-call) screen — gradient, top pills, the ringed avatar
 * with name + subtitle + speech bubble, and a SOLID start button.
 *
 * Two rules carried over from the app:
 *  * the talktime pill is fail-OPEN — a fetch error degrades the pill, never
 *    blocks the call;
 *  * NEVER a dead button — every non-startable entitlement state maps to a
 *    live surface (paywall, upgrade CTA, or the WhatsApp sheet).
 */
export function HomeScreen({
  balance,
  gate,
  onStart,
  onHistory,
  onUpgrade,
  onWhatsApp,
  micDenied,
  memoryOpener = false,
  memoryLayout = "bubble",
  surveyStage = "asking",
  onSurveyAnswer,
  memorySetKey = "fresh",
  memoryNonce = 0,
  onStartAttributed,
}: {
  balance: BalanceState;
  gate: HomeGate;
  onStart: () => void;
  onHistory: () => void;
  onUpgrade: () => void;
  onWhatsApp: () => void;
  micDenied?: boolean;
  /** Swap the static greeting for the rotating memory opener. */
  memoryOpener?: boolean;
  /** Which state the card is in — see MEMORY_SETS. */
  memorySetKey?: string;
  /**
   * "bubble" = v1, one rotating card.
   * "cards"  = v2, two side by side, pick one.
   * "stack"  = v3, the same pick stacked vertically.
   * "survey" = v4, the same pick asked as research, then today's greeting.
   */
  memoryLayout?: "bubble" | "cards" | "stack" | "survey";
  /** v4 only: where the survey is in its life. */
  surveyStage?: SurveyStage;
  onSurveyAnswer?: (stage: SurveyStage) => void;
  /** Bump to reshuffle which prompt opens. */
  memoryNonce?: number;
  /** Which prompt was on screen when Start was tapped — the experiment's
   *  whole answer lives in this one value. */
  onStartAttributed?: (a: {
    promptId: string;
    topicKey: string;
    /** v2/v3 only: which SLOT the chosen card was in. Without it the result
     *  is a reading of the layout rather than of the topics. */
    position?: "left" | "right" | "top" | "bottom";
    msToPick?: number;
  }) => void;
}) {
  const remainingS = balance.kind === "loaded" ? balance.remainingS : null;
  const route = startRouteFor(gate, remainingS);
  const set = memorySet(memorySetKey);
  const prompts = set.prompts;
  const opener = useMemoryOpener(prompts, memoryNonce);
  const ctaPrompt = prompts[opener.ctaIndex];
  const pending = set.status === "pending";

  /* ── v2 draws ──────────────────────────────────────────────────────────
     Both drawn from the session nonce, and INDEPENDENTLY of each other: if
     the pre-selected card were always the left one, randomising position
     would buy nothing. */
  const { pair, header } = cardsFor(set);
  // Which topic sits LEFT is drawn per session: the left card wins more
  // regardless of what is on it.
  const flipped = Math.abs(memoryNonce) % 2 === 1;
  const ordered = flipped ? [pair[1], pair[0]] : pair;

  /**
   * NOTHING is pre-selected. A pre-ticked card with the button already loaded
   * is the strongest nudge on the screen, and it would have decided the
   * experiment for us. The cost is one required tap before the primary action,
   * which is why the time it takes is measured rather than assumed.
   */
  const [picked, setPicked] = useState<number | null>(null);
  const [nudge, setNudge] = useState(0);
  const cardsPrompt = picked === null ? null : ordered[picked];
  const shownAt = useRef(0);
  const pickedAfterMs = useRef<number | null>(null);
  useEffect(() => {
    shownAt.current = performance.now();
  }, []);

  const stacked = memoryLayout === "stack";
  const survey = memoryOpener && memoryLayout === "survey";
  const asking = survey && surveyStage === "asking";
  const cards =
    memoryOpener && (memoryLayout === "cards" || stacked);
  const choosePicked = (i: number) => {
    if (pickedAfterMs.current === null) {
      pickedAfterMs.current = Math.round(performance.now() - shownAt.current);
    }
    setPicked(i);
  };

  // A pending card promises nothing, so the CTA promises nothing either.
  // With nothing chosen the button names the NEXT STEP rather than sitting
  // there as an unexplained grey slab.
  const startLabel = survey
    ? asking
      ? SURVEY_COPY.submit
      : t.home.startCall
    : pending
      ? undefined
      : cards
        ? (cardsPrompt?.ctaLabel ?? "Pick a topic to start")
        : ctaPrompt.ctaLabel;
  // The one place the app's "never a dead button" rule bends, deliberately:
  // the button is visibly not ready and says why, rather than looking live
  // and doing nothing.
  // Submit needs an answer; Start never does.
  const startBlocked = asking
    ? picked === null
    : cards && !pending && cardsPrompt === null;
  // The button is gated, not dead: pressing it sends the eye to the decision
  // instead of doing nothing at all.
  const nudgeCards = () => setNudge((n) => n + 1);

  if (route === "paywallScreen") return <CallingPaywall onUpgrade={onUpgrade} />;

  const startWithAttribution = () => {
    // In v4 the button banks an answer rather than placing a call. The call
    // comes afterwards, from the ordinary greeting, exactly as it does today.
    if (asking) {
      onSurveyAnswer?.("answered");
      return;
    }
    if (memoryOpener) {
      // Attributed to the CTA's prompt, not the card's: the CTA is what the
      // user actually pressed, and it trails the card by design. A pending
      // card and a covered one both start a call that belongs to no topic —
      // crediting either would put a tap in the wrong bucket.
      if (pending) {
        onStartAttributed?.({ promptId: "none", topicKey: "no_memory" });
      } else if (cards && cardsPrompt) {
        onStartAttributed?.({
          promptId: cardsPrompt.id,
          topicKey: cardsPrompt.topicKey,
          // Top wins over bottom the way left wins over right, so the slot
          // travels with the tap either way.
          position: stacked
            ? picked === 0
              ? "top"
              : "bottom"
            : picked === 0
              ? "left"
              : "right",
          msToPick: pickedAfterMs.current ?? undefined,
        });
      } else if (ctaPrompt.covered) {
        onStartAttributed?.({ promptId: "none", topicKey: "other" });
      } else {
        onStartAttributed?.({
          promptId: ctaPrompt.id,
          topicKey: ctaPrompt.topicKey,
        });
      }
    }
    onStart();
  };

  return (
    <div
      style={{ position: "absolute", inset: 0 }}
      // A finger anywhere on the screen stops the rotation for the session:
      // the CTA must never change under a thumb already on its way down.
      onPointerDown={memoryOpener ? opener.stop : undefined}
    >
      <CallingBackground />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: `${T.frame.safeTop + T.frame.screenPaddingTop}px ${T.frame.screenPaddingH}px ${T.frame.screenPaddingBottom + T.frame.safeBottom}px`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <CallingTopPill
            testId="cv3_history_pill"
            style={T.historyPill}
            icon="history"
            label={t.home.history}
            onTap={onHistory}
          />
          {/* Nothing is known yet, so the pill shimmers at its own size instead
              of showing an em-dash — a "—" reads as a balance the server
              answered with, which is the one thing it must never be. */}
          {balance.kind === "loading" ? (
            <ShimmerBox
              height={T.minutesPill.height}
              width={110}
              radius={T.minutesPill.radius}
            />
          ) : (
            <div title={balance.kind === "loaded" ? balance.tooltip : undefined}>
              <CallingTopPill
                testId="cv3_minutes_pill"
                style={T.minutesPill}
                icon="schedule"
                outlinedIcon
                label={minutesLabel(remainingS, {
                  unavailable: t.home.timeUnavailable,
                  secondsLeft: t.home.secondsLeft,
                  minLeftUnder: t.home.minLeftUnder,
                  minLeft: t.home.minLeft,
                })}
              />
            </div>
          )}
        </div>

        {/* The vertical rhythm is measured, not centred: pills → 24 → heading
            → 40 → Sarah → 8 → her name → 4 → subtitle → 12 → the bubble.
            NOTHING here scrolls. A phone screen with a pinned CTA has one
            job, and a scroll container is how the hero ends up parked
            off-frame with the pills and the button still sitting there. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ height: stacked ? 10 : 24 }} />
          {/* v3 drops the big heading. Two stacked cards do not fit under it,
              and it is the most redundant thing on the screen once the pill
              below is asking the question and the button is naming the call. */}
          {!stacked && (
            <>
              <div
                style={{
                  fontSize: T.frame.homeHeadingSize,
                  fontWeight: 800,
                  textAlign: "center",
                  // A faint white bloom, not a second light source.
                  textShadow: "0 0 18px rgba(255,255,255,0.35)",
                }}
              >
                {t.home.callWithSarah}
              </div>
              <div style={{ height: 40 }} />
            </>
          )}
          {/* The cards need the room a full-height avatar was using, and
              stacking needs more still. The hero is not allowed to scroll, so
              the avatar is what yields. */}
          <CallingAvatar
            // v4 gives Sarah her full size back the moment the options clear,
            // which is what makes the screen feel like it has settled rather
            // than like something was removed from it.
            size={
              asking ? 150 : stacked ? 230 : cards ? 210 : T.frame.homeAvatarSize
            }
            src="/sarah-speaking.mp4"
            haloOpacity={0}
          />
          <div style={{ height: 8 }} />
          <div style={{ fontSize: T.frame.homeNameSize, fontWeight: 700 }}>Sarah</div>
          <div style={{ height: 4 }} />
          <div
            style={{
              fontSize: T.frame.homeSubtitleSize,
              color: T.frame.homeSubtitleColor,
            }}
          >
            {t.home.yourEnglishTutor}
          </div>
          <div style={{ height: 12 }} />
          {survey ? (
            <MemorySurvey
              pair={ordered}
              selected={picked}
              onSelect={choosePicked}
              stage={surveyStage}
              nudge={nudge}
            />
          ) : cards ? (
            <MemoryCards
              header={header}
              pair={ordered}
              selected={picked}
              onSelect={choosePicked}
              pending={pending}
              nudge={nudge}
              orientation={stacked ? "column" : "row"}
            />
          ) : memoryOpener ? (
            <MemoryBubble
              prompts={prompts}
              pending={pending}
              cardIndex={opener.cardIndex}
              litCount={opener.litCount}
              shown={opener.shown}
              // Swiping the bubble changes the TOPIC. The gesture belongs to
              // the card, not to the tab pager behind it.
              onSwipe={
                pending
                  ? undefined
                  : (d) =>
                      opener.jumpTo(
                        (opener.cardIndex + d + prompts.length) % prompts.length,
                      )
              }
            />
          ) : (
            <SarahSpeechBubble text={t.home.greeting} />
          )}
          <div style={{ height: 12 }} />
        </div>

        {/* Dots live beside the CTA, not under the bubble: they are about
            which prompt you are about to call on, not about the text. */}
        {memoryOpener && !cards && !survey && route === "ctaStart" && (
          <>
            {/* The dots' SPACE is held even when there is nothing to page
                between, so the CTA never moves between states. */}
            <div style={{ opacity: pending || prompts.length < 2 ? 0 : 1 }}>
              <MemoryDots
                count={prompts.length}
                index={opener.cardIndex}
                onJump={opener.jumpTo}
              />
            </div>
            <div style={{ height: 18 }} />
          </>
        )}

        {micDenied && (
          <div
            data-testid="cv3_mic_denied_snack"
            style={{
              marginBottom: 12,
              padding: "12px 16px",
              borderRadius: 8,
              background: "#323232",
              fontSize: 14,
            }}
          >
            {t.home.micPermissionNeeded}
          </div>
        )}

        <StartSlot
          route={route}
          startLabel={memoryOpener ? startLabel : undefined}
          // Submitting a survey is not placing a call, so the button does not
          // wear a phone.
          startIcon={asking ? null : "call"}
          startBlocked={startBlocked}
          onBlockedTap={nudgeCards}
          onStart={startWithAttribution}
          onUpgrade={onUpgrade}
          onWhatsApp={onWhatsApp}
        />
      </div>
    </div>
  );
}

function StartSlot({
  route,
  startLabel,
  startIcon = "call",
  startBlocked = false,
  onBlockedTap,
  onStart,
  onUpgrade,
  onWhatsApp,
}: {
  route: StartRoute;
  /** The memory opener names the topic, so the tap is unambiguous. */
  startLabel?: string;
  startIcon?: string | null;
  /** Waiting on a choice: the button is present, named and visibly not ready. */
  startBlocked?: boolean;
  onBlockedTap?: () => void;
  onStart: () => void;
  onUpgrade: () => void;
  onWhatsApp: () => void;
}) {
  switch (route) {
    case "ctaStart":
      return (
        <CallingStartButton
          testId="cv3_start"
          label={startLabel ?? t.home.startCall}
          icon={startIcon}
          variant={startBlocked ? "waiting" : "solid"}
          onTap={startBlocked ? onBlockedTap : onStart}
        />
      );
    case "ctaFreeUpgrade":
      return (
        <CallingStartButton
          testId="cv3_upgrade"
          icon="lock_open"
          label={t.home.upgradeCta}
          onTap={onUpgrade}
        />
      );
    case "ctaPremiumWhatsapp":
      return (
        <CallingStartButton
          testId="cv3_whatsapp"
          icon="chat"
          label={t.home.requestMoreTalktimeCta}
          onTap={onWhatsApp}
        />
      );
    default:
      return <CallingStartButton testId="cv3_start" label={t.home.startCall} onTap={null} />;
  }
}

/**
 * Stand-in for `CallingTabPaywallScreen`. The paywall is its own feature with
 * its own RC-driven offers, so this prototype renders the SHAPE of it — the
 * full-bleed takeover that replaces the home screen entirely, top row
 * included — rather than a copy of pricing it has no business asserting.
 */
function CallingPaywall({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CallingBackground />
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: `${T.frame.safeTop + T.frame.screenPaddingTop}px 20px ${32 + T.frame.safeBottom}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ alignSelf: "flex-start" }}>
          <Icon name="arrow_back" size={24} />
        </div>
        <div style={{ height: 20 }} />
        <CallingAvatar size={170} src="/sarah-speaking.mp4" haloOpacity={0.6} />
        <div style={{ height: 28 }} />
        <div style={{ fontSize: 26, fontWeight: 800, textAlign: "center" }}>
          Unlock calls with Sarah
        </div>
        <div style={{ height: 10 }} />
        <div
          style={{
            fontSize: 15,
            textAlign: "center",
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.5,
            maxWidth: 300,
          }}
        >
          {t.home.outOfTimeFree}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Prototype stand-in. The real screen is the RC-driven
          <br />
          CallingTabPaywallScreen.
        </div>
        <CallingStartButton icon="lock_open" label={t.home.upgradeCta} onTap={onUpgrade} />
      </div>
    </div>
  );
}
