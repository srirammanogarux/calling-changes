/**
 * Port of `call_timer_display.dart` — pure, so the thresholds are provable
 * without a frame.
 *
 * The call timer counts UP from 0:00. Remaining talktime only becomes visible
 * once it matters: a nudge beside the timer from 10 minutes down, stepping
 * once a minute, and in the last 5 minutes the nudge REPLACES the timer with
 * a countdown.
 */

export type TimerDisplay =
  | { kind: "elapsed"; elapsedS: number }
  | { kind: "nudge"; elapsedS: number; minutesLeft: number }
  | { kind: "countdown"; remainingS: number };

/** Nudge appears at/below this much remaining talktime. */
export const NUDGE_START_MINUTES = 10;
/** At/below this, the countdown replaces the elapsed timer. */
export const NUDGE_FINAL_MINUTES = 5;

export function timerDisplay(
  elapsedS: number,
  capS: number | null,
): TimerDisplay {
  // No cap = the server reaper owns runaway calls; nothing to warn about.
  if (capS === null) return { kind: "elapsed", elapsedS };
  const remaining = capS - elapsedS;
  if (remaining <= NUDGE_FINAL_MINUTES * 60) {
    return { kind: "countdown", remainingS: Math.max(0, remaining) };
  }
  if (remaining > NUDGE_START_MINUTES * 60) return { kind: "elapsed", elapsedS };
  // Whole minutes, rounded UP: the label reads "<N min left" precisely
  // because of that rounding — there is always less than this, never more.
  return { kind: "nudge", elapsedS, minutesLeft: Math.ceil(remaining / 60) };
}

/** mm:ss, minutes unbounded (63 minutes reads "63:05", never "1:03:05"). */
export function formatCallDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export type TimerCue = "none" | "shake" | "bounce";

/**
 * What the time row should DO on a transition. The nudge APPEARING is
 * deliberately not a cue — that transition already has its own motion (the
 * row widens and the elapsed pill glides aside).
 */
export function timerCueFor(was: TimerDisplay, now: TimerDisplay): TimerCue {
  // The countdown taking over at 5:00 is the biggest change the row makes.
  if (was.kind !== "countdown" && now.kind === "countdown") return "bounce";
  if (
    was.kind === "nudge" &&
    now.kind === "nudge" &&
    was.minutesLeft !== now.minutesLeft
  ) {
    return "shake";
  }
  // The last second, landing with the cap's buzz.
  if (
    was.kind === "countdown" &&
    now.kind === "countdown" &&
    was.remainingS > 1 &&
    now.remainingS <= 1
  ) {
    return "shake";
  }
  return "none";
}

/**
 * The home pill's balance label. Under a minute it shows real seconds; under
 * five it rounds UP and says "less than", so the number is never a promise of
 * more time than the user has.
 */
export function minutesLabel(
  remainingS: number | null,
  copy: {
    unavailable: string;
    secondsLeft: (s: string) => string;
    minLeftUnder: (m: string) => string;
    minLeft: (m: string) => string;
  },
): string {
  if (remainingS === null) return copy.unavailable;
  if (remainingS <= 0) return copy.secondsLeft("0");
  if (remainingS < 60) return copy.secondsLeft(String(Math.floor(remainingS)));
  if (remainingS <= 300) return copy.minLeftUnder(String(Math.ceil(remainingS / 60)));
  return copy.minLeft(String(Math.floor(remainingS / 60)));
}
