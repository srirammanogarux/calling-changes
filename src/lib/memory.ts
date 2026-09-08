/**
 * The memory survey: the two things Sarah remembers from the last call, asked
 * as research rather than offered as a call.
 *
 * This is the version that shipped the decision. The three A/B layouts it beat
 * (a rotating bubble, and the same pick as two cards or a stack) all needed the
 * memory pipeline to exist AND be good before they taught anyone anything.
 * This needs two generated prompts and one write, so it answers "is this worth
 * building" before it is built. The trade, stated plainly: a survey measures
 * what people SAY, where an A/B measures what they DO, and on a question like
 * this the two come apart.
 */

export interface MemoryPrompt {
  /** Stable analytics id. Survives copy edits and translation. */
  id: string;
  /**
   * Grouping key for the experiment, and NEVER a label. A series keyed on
   * display copy fragments every time someone tweaks the wording, and Mixpanel
   * cannot backfill the split.
   */
  topicKey: string;
  /**
   * What the card says, and the only thing on it.
   *
   * A STATEMENT, not a question. Two questions side by side read as an exam:
   * the user is answering "which would you rather talk about", and asking them
   * two more questions inside the options makes them parse three at once. A
   * statement is a thing on offer, which is what a survey option should be.
   *
   * It also carries its own topic, because there is no label above it any
   * more. The first two or three words do the work the label used to: they say
   * what this is about before the eye reaches the end of the line.
   */
  statement: string;
}

export const MEMORY_PROMPTS: MemoryPrompt[] = [
  {
    id: "mp_football_messi",
    topicKey: "football",
    statement: "Messi retiring, and the point you never finished making.",
  },
  {
    id: "mp_work_interview",
    topicKey: "work",
    statement: "Your interview, and the English round you were nervous about.",
  },
];

/**
 * The sweep's tempo.
 *
 * `wordMs` is deliberately faster than speech: there is no audio here to set
 * the pace, and people read faster than they are spoken to. This is a sweep of
 * light across the sentence, not a karaoke track.
 */
export const MEMORY_TIMING = {
  /** One word's step. */
  wordMs: 150,
  /** Each word also EASES over this, so three or four are mid-transition at
   *  any moment and it reads as a wave rather than a stutter. */
  wordFadeMs: 200,
} as const;

export const SURVEY_COPY = {
  /** Asked in Sarah's bubble, in the slot the greeting normally holds. */
  question: "Based on your last call, which of these would you rather talk about?",
  submit: "Submit",
  /**
   * The skip.
   *
   * Present because the alternative is asking the same person the same
   * question every few calls until they answer it, which is how a research
   * prompt turns into spam. Quiet, under the button, and never styled as the
   * equal of Submit: it is an exit, not a second option.
   */
  skip: "Not now",
  /** Shown under the bubble once an answer is banked, and only then: the
   *  promise is owed to someone who actually answered. */
  tag: "We'll use your response for personalisation later",
} as const;

/** Where the survey is in its life. */
export type SurveyStage =
  /** The question and the two options. */
  | "asking"
  /** Answered. Today's greeting, with the promise under it. */
  | "answered"
  /** A session or two later, or skipped. Today's app, and no promise. */
  | "settled";
