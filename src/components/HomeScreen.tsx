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
import { MEMORY_PROMPTS, SURVEY_COPY, type SurveyStage } from "@/lib/memory";
import { MemorySurvey } from "./MemorySurvey";

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
  surveyStage = "asking",
  onSurveyAnswer,
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
  /** Swap the static greeting for the memory survey. */
  memoryOpener?: boolean;
  /** Where the survey is in its life. */
  surveyStage?: SurveyStage;
  onSurveyAnswer?: (stage: SurveyStage) => void;
  /** Bump to reshuffle which prompt opens. */
  memoryNonce?: number;
  /** Which prompt was on screen when Start was tapped — the experiment's
   *  whole answer lives in this one value. */
  onStartAttributed?: (a: {
    promptId: string;
    topicKey: string;
    /** Which SLOT the chosen card was in. Without it the result is a reading
     *  of the layout rather than of the topics. */
    position?: "left" | "right";
    msToPick?: number;
  }) => void;
}) {
  const remainingS = balance.kind === "loaded" ? balance.remainingS : null;
  const route = startRouteFor(gate, remainingS);

  // Which topic sits LEFT is drawn per session and logged with the tap: the
  // left card wins more regardless of what is on it, so without the draw the
  // answer is a reading of our own layout.
  const flipped = Math.abs(memoryNonce) % 2 === 1;
  const ordered = flipped
    ? [MEMORY_PROMPTS[1], MEMORY_PROMPTS[0]]
    : MEMORY_PROMPTS;

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

  const survey = memoryOpener;
  const asking = survey && surveyStage === "asking";
  const choosePicked = (i: number) => {
    if (pickedAfterMs.current === null) {
      pickedAfterMs.current = Math.round(performance.now() - shownAt.current);
    }
    setPicked(i);
  };

  // Submit needs an answer; Start never does.
  const startLabel = asking ? SURVEY_COPY.submit : t.home.startCall;
  // The one place the app's "never a dead button" rule bends, deliberately:
  // the button is visibly not ready, and the skip underneath means nobody is
  // trapped behind it.
  const startBlocked = asking && picked === null;
  // The button is gated, not dead: pressing it sends the eye to the decision
  // instead of doing nothing at all.
  const nudgeCards = () => setNudge((n) => n + 1);

  if (route === "paywallScreen") return <CallingPaywall onUpgrade={onUpgrade} />;

  const startWithAttribution = () => {
    // The button banks an answer rather than placing a call. The call comes
    // afterwards, from the ordinary greeting, exactly as it does today.
    if (asking) {
      if (cardsPrompt) {
        onStartAttributed?.({
          promptId: cardsPrompt.id,
          topicKey: cardsPrompt.topicKey,
          position: picked === 0 ? "left" : "right",
          msToPick: pickedAfterMs.current ?? undefined,
        });
      }
      onSurveyAnswer?.("answered");
      return;
    }
    onStart();
  };

  /**
   * Skipped, so nothing was banked and nothing is owed.
   *
   * It lands on "settled" rather than "answered" for exactly that reason: the
   * tag says we will use your response, and there is no response. Logged as a
   * dismissal so the cadence can back off instead of asking again in four
   * calls.
   */
  const skipSurvey = () => {
    onStartAttributed?.({
      promptId: "none",
      topicKey: "skipped",
      msToPick: Math.round(performance.now() - shownAt.current),
    });
    onSurveyAnswer?.("settled");
  };

  return (
    <div
      style={{ position: "absolute", inset: 0 }}
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
        {/* History and talktime are hidden while the question is up, and only
            while it is up.
            Neither belongs to what is being asked. "12 min left" is a budget
            for a call the user is not being invited to make yet, and reading
            it next to a survey is the moment they wonder whether answering
            costs them minutes. Both come back the instant the answer is in.

            The row keeps its HEIGHT throughout, so nothing below it moves when
            they arrive; only the ink fades. */}
        <div
          data-testid="cv3_top_pills"
          aria-hidden={asking}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: asking ? 0 : 1,
            pointerEvents: asking ? "none" : "auto",
            // Arriving takes longer than leaving, and waits for the bubble to
            // finish swapping: two things fading in at once reads as a screen
            // reloading rather than as one settling.
            transition: asking
              ? "opacity 160ms ease-in"
              : "opacity 320ms ease-out 420ms",
          }}
        >
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
          {/* The hero tightens while the question is up and opens back out
              once it clears. Both spacers TRANSITION rather than snapping, so
              the screen settles into the answer instead of re-laying out under
              it. */}
          <Spacer height={asking ? 12 : 24} />
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
          <Spacer height={asking ? 22 : 40} />
          {/* The options need the room a full-height avatar was using, and the
              hero is not allowed to scroll, so the avatar is what yields.
              Sarah gets her full size back the moment they clear, which is
              what makes the screen feel like it has settled rather than like
              something was taken off it. */}
          <CallingAvatar
            size={asking ? 142 : T.frame.homeAvatarSize}
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
          ) : (
            <SarahSpeechBubble text={t.home.greeting} />
          )}
          <div style={{ height: 12 }} />
        </div>

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

        {/* The skip.
            Under the button, and never beside it: two things on one line are
            two options, and this is not one. It is plain text at the weight of
            the subtitle, with a tap target big enough to hit and no border,
            fill or icon to argue with Submit.

            It COLLAPSES rather than disappearing, so the button glides down
            into the space instead of the row vanishing from under it. */}
        <div
          style={{
            maxHeight: asking ? 46 : 0,
            opacity: asking ? 1 : 0,
            overflow: "hidden",
            pointerEvents: asking ? "auto" : "none",
            transition: asking
              ? "max-height 320ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease-out 140ms"
              : "max-height 380ms cubic-bezier(0.4,0,0.2,1), opacity 160ms ease-in",
          }}
        >
          <button
            data-testid="cv3_survey_skip"
            onClick={skipSurvey}
            style={{
              width: "100%",
              height: 46,
              fontSize: 15,
              fontWeight: 500,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {SURVEY_COPY.skip}
          </button>
        </div>
      </div>
    </div>
  );
}

/** A gap that can change size without the screen jumping. */
function Spacer({ height }: { height: number }) {
  return (
    <div
      style={{
        height,
        flexShrink: 0,
        transition: "height 380ms cubic-bezier(0.22,1,0.36,1)",
      }}
    />
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
