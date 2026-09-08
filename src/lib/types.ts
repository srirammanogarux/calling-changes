/**
 * Port of the calling_v3 state contract.
 *
 * `CallingV3State` (call_session_state.dart) is a sealed union where every
 * per-phase state carries ONLY its phase's fields — never one wide state class
 * whose fields are meaningful in some statuses and not others. Discriminated
 * unions are the TS equivalent, so the same exhaustiveness holds.
 */

/** Why a call ENDED (client-side view; the server owns the authoritative one). */
export type CallEndReason =
  | "userEnded"
  | "connectionLost"
  | "durationCap"
  | "appBackground"
  | "feedbackTimeout"
  | "hostTeardown";

/** Why a call failed before/during being live. */
export type CallFailureReason =
  | "startApiFailure"
  | "connectFailure"
  | "agentReadyTimeout"
  | "noTalktime"
  | "agentFatalError"
  | "capacityFull"
  | "rateLimited"
  | "connectionLost"
  | "agentLeft";

export type CallingV3State =
  /** Pre-call. No resources held. */
  | { kind: "idle" }
  /** `/start` in flight. */
  | { kind: "requestingToken" }
  /** Grant in hand; room connect in flight. */
  | { kind: "connecting"; callId: string }
  /** Room joined; awaiting the agent's `agent_ready`. */
  | { kind: "waitingForAgent"; callId: string }
  /** Live conversation — lifecycle facts only; the caption lives on playout. */
  | {
      kind: "active";
      callId: string;
      /** Starts true: the opener auto-mute, so the user can't barge in. */
      muted: boolean;
      /** The mid-call report overlay holds the call FROZEN, not ended. */
      feedbackPaused: boolean;
      /** A FLAG, never a status — the lifecycle stays active throughout. */
      reconnecting: boolean;
      /** The grant's cap, anchored at activation. Null = no client-side cap. */
      maxCallDurationS: number | null;
    }
  /** User (or system) asked to end; teardown in flight. */
  | { kind: "ending"; callId: string }
  /** A was-active call that ended cleanly — the summary is earned. */
  | { kind: "completed"; callId: string; reason: CallEndReason }
  /** Terminal clean end for a call that never reached active. */
  | { kind: "ended"; callId: string; reason: CallEndReason }
  /** Terminal failure. */
  | {
      kind: "failed";
      reason: CallFailureReason;
      callId?: string;
      agentErrorCode?: string;
      /**
       * The user actually talked to Sarah before the agent died. Only
       * `agentFatalError` and `agentLeft` can be true here — and it is what
       * sends them to the SUMMARY instead of an error screen.
       */
      reachedActive: boolean;
    };

/** The derived conversation view of a live call (call_playout_state.dart). */
export interface CallPlayoutState {
  /** Accumulated subtitle for the CURRENT assistant turn. */
  caption: string;
  /** FINISHED assistant lines, oldest first. */
  transcript: string[];
  /** Debounced "the bot is audible" — drives the GLOWS. */
  botSpeaking: boolean;
  /** The agent's own timeline — drives the CHIPS, and runs seconds ahead. */
  botTurnActive: boolean;
  /** Raw local VAD: the device hears the user right now. */
  userAudible: boolean;
  /** The opener has finished playing. Never reverts within a call. */
  openerComplete: boolean;
  userTurns: number;
  botTurns: number;
}

export const emptyPlayout: CallPlayoutState = {
  caption: "",
  transcript: [],
  botSpeaking: false,
  botTurnActive: false,
  userAudible: false,
  openerComplete: false,
  userTurns: 0,
  botTurns: 0,
};

/**
 * A finished call ended cleanly, or died after the user had already held a
 * conversation. Both earn the post-call summary (summaryWorthy, page.dart).
 */
export function summaryWorthy(s: CallingV3State): boolean {
  return s.kind === "completed" || (s.kind === "failed" && s.reachedActive);
}

/** The call id a summary-worthy state carries into the summary route. */
export function summaryCallId(s: CallingV3State): string | null {
  if (s.kind === "completed") return s.callId;
  if (s.kind === "failed") return s.callId ?? null;
  return null;
}

/** The phases the active route is on screen for. */
export function isLivePhase(s: CallingV3State): boolean {
  return (
    s.kind === "requestingToken" ||
    s.kind === "connecting" ||
    s.kind === "waitingForAgent" ||
    s.kind === "active"
  );
}

/** The G1 entitlement route for the home CTA — never a dead button. */
export type StartRoute =
  | "ctaStart"
  | "ctaFreeUpgrade"
  | "ctaPremiumWhatsapp"
  | "paywallScreen"
  | "ctaDisabled";

export interface HomeGate {
  canStart: boolean;
  hasPremium: boolean;
  isHardPaywallLocked: boolean;
  hasPaywallDecision: boolean;
}

/**
 * Port of `callingV3StartRoute` (call_start_route.dart) — the entitlement →
 * surface decision, a pure function. The design rule it encodes: NEVER a dead
 * button. Every non-startable entitlement state maps to a live surface.
 *
 * `remainingS` null means UNKNOWN, which is NOT exhaustion: the pill fails
 * open and `/init` stays the real gate, so a fetch error never strands a user.
 */
export function startRouteFor(
  gate: HomeGate,
  remainingS: number | null,
): StartRoute {
  const exhausted = remainingS !== null && remainingS <= 0;
  // Premium is never locked: entitlement covers the hard-lock flag.
  const isLocked = !gate.hasPremium && (gate.isHardPaywallLocked || exhausted);
  if (isLocked && gate.hasPaywallDecision) return "paywallScreen";
  if (gate.hasPremium && exhausted) return "ctaPremiumWhatsapp";
  if (isLocked) return "ctaFreeUpgrade";
  if (gate.canStart) return "ctaStart";
  return "ctaDisabled";
}
