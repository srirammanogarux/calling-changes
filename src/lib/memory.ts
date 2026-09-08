/**
 * The memory-driven opener: what Sarah remembers from the last call, turned
 * into a question that sits in the greeting bubble.
 *
 * The bubble is ONE static shape. What changes is the CARD inside it — the
 * topic label, the question, and the CTA that names the topic. Cards arrive,
 * light up word by word, hold, and hand over.
 */

export interface MemoryPrompt {
  /** Stable analytics id. Survives copy edits and translation. */
  id: string;
  /** Grouping key for the experiment — never the label. */
  topicKey: string;
  /** Shown above the question. */
  topicLabel: string;
  /** The CTA copy, which names the topic so the tap is unambiguous. */
  ctaLabel: string;
  question: string;
  /**
   * Already talked about. Shown ONCE as an acknowledgement and then retired —
   * the tick is the cheapest proof the system is listening, and this card can
   * never start a call about a topic that is finished.
   */
  covered?: boolean;
  /**
   * How many calls this topic has survived. 2+ means the question is a
   * FOLLOW-UP rather than a first ask: a topic is a thread, not a card.
   */
  visits?: number;
}

/** Whether the opener has anything to show yet. */
export type OpenerStatus = "ready" | "pending";

export const MEMORY_PROMPTS: MemoryPrompt[] = [
  {
    id: "mp_football_messi",
    topicKey: "football",
    topicLabel: "FOOTBALL",
    ctaLabel: "Talk about football",
    question:
      "You never finished your point about Messi retiring. How do you feel about it?",
  },
  {
    // The id and the topicKey are the ANALYTICS identity and do not move when
    // the wording does: a series keyed on a label fragments every time someone
    // tweaks the copy, and Mixpanel cannot backfill the split.
    id: "mp_work_interview",
    topicKey: "work",
    topicLabel: "INTERVIEW",
    ctaLabel: "Talk about the interview",
    question:
      "How did the interview go? You were nervous about the English round.",
  },
];

/**
 * Every number in the motion, in one place.
 *
 * `wordMs` is deliberately faster than speech: there is no audio here to set
 * the pace, and people read faster than they are spoken to — a sing-along
 * tempo means the user finished reading two seconds before the animation did.
 * This is a sweep of light across the sentence, not a karaoke track.
 */
export const MEMORY_TIMING = {
  /** Card arrives: scale 0.96 → 1 with a fade. */
  inMs: 260,
  /** Card leaves: scale 1 → 0.97 with a fade. Shorter than the arrival, so
   *  the eye never has to decide which of two cards is current. */
  outMs: 180,
  /** How long the outgoing and incoming cards overlap. Never a hard cut. */
  overlapMs: 80,
  /** One word's step. Each word also EASES over `wordFadeMs`, so three or
   *  four are mid-transition at any moment and it reads as a wave. */
  wordMs: 150,
  wordFadeMs: 200,
  /** The decision window: the card is fully lit and nothing is moving, so a
   *  thumb already on its way cannot land on a CTA that just changed. */
  holdMs: 1500,
  /** The CTA label swaps AFTER the card lands, so the eye travels card →
   *  button rather than watching both change at once. */
  ctaLagMs: 120,
  /** Each prompt is shown this many times, then the rotation rests. A thing
   *  that loops forever beside a CTA is fidgety, and it costs battery. */
  cycles: 2,
} as const;


/* ── Demo sets ───────────────────────────────────────────────────────────
   Each is a real state the card can be in, not a mock-up of one. The
   director picks between them; everything else in the screen behaves
   identically. */

export interface MemorySet {
  key: string;
  label: string;
  hint: string;
  status: OpenerStatus;
  prompts: MemoryPrompt[];
}

const WORK: MemoryPrompt = MEMORY_PROMPTS[1];

export const MEMORY_SETS: MemorySet[] = [
  {
    key: "fresh",
    label: "Two fresh prompts",
    hint: "The default. Both topics new, rotation runs two cycles and rests.",
    status: "ready",
    prompts: MEMORY_PROMPTS,
  },
  {
    key: "covered",
    label: "Covered — the tick",
    hint: "Football was talked about last call. Shown once with a tick, then it hands over and never comes back. Its CTA cannot start a call about it.",
    status: "ready",
    prompts: [
      {
        ...MEMORY_PROMPTS[0],
        id: "mp_football_covered",
        covered: true,
        ctaLabel: "Talk about something else",
        question:
          "We covered this on Thursday. Nice one, I’ll bring you something new.",
      },
      WORK,
    ],
  },
  {
    key: "deepened",
    label: "Deepened — 2nd time",
    hint: "The topic is not finished, it comes back further along and quotes what you actually said.",
    status: "ready",
    prompts: [
      {
        ...MEMORY_PROMPTS[0],
        id: "mp_football_followup",
        visits: 2,
        question:
          "Last time you said Messi leaving felt like the end of an era. Has that changed?",
      },
      WORK,
    ],
  },
  {
    key: "pending",
    label: "Still being written",
    hint: "You hung up and came straight back. The bubble holds its shape and shimmers; Start still works and says nothing it cannot keep. Resolves on its own after a few seconds.",
    status: "pending",
    prompts: MEMORY_PROMPTS,
  },
  {
    key: "ceiling",
    label: "Ceiling — three lines",
    hint: "The tallest card the copy cap allows. Watch the bubble hold its height when it hands over to the short one.",
    status: "ready",
    prompts: [
      {
        id: "mp_wedding_speech",
        topicKey: "wedding",
        topicLabel: "YOUR SISTER’S WEDDING",
        ctaLabel: "Talk about the wedding",
        question:
          "You said the wedding was in Jaipur in December and you were dreading the speech. Have you started writing it?",
      },
      WORK,
    ],
  },
];

export function memorySet(key: string): MemorySet {
  return MEMORY_SETS.find((s) => s.key === key) ?? MEMORY_SETS[0];
}

/**
 * The order the cards are shown in.
 *
 * A COVERED card is an acknowledgement of the call that just happened, so it
 * leads — once — and then drops out. Everything fresh cycles behind it. The
 * same card is never shown twice in a row, which would read as a stall rather
 * than a hand-over.
 */
export function buildShowOrder(
  prompts: MemoryPrompt[],
  startIndex: number,
  cycles = MEMORY_TIMING.cycles,
): number[] {
  const covered = prompts.map((_, i) => i).filter((i) => prompts[i].covered);
  const fresh = prompts.map((_, i) => i).filter((i) => !prompts[i].covered);
  if (fresh.length === 0) return covered.length ? covered : [0];

  const offset = Math.max(0, fresh.indexOf(startIndex));
  const rotated = fresh.map((_, k) => fresh[(offset + k) % fresh.length]);
  const order: number[] = [...covered];
  for (let c = 0; c < cycles; c++) order.push(...rotated);

  return order.filter((v, i) => i === 0 || v !== order[i - 1]);
}


/* ── v2: two cards, pick one ─────────────────────────────────────────────
   The rotation is gone, so the card that gets the tap is no longer partly a
   function of WHEN the thumb arrived. What replaces it are two biases the
   layout creates on its own, and both are handled at the call site:

     * POSITION — the left card wins regardless of content, so which topic
       sits left is drawn per session;
     * DEFAULT — a pre-ticked card with the CTA already loaded is the
       strongest nudge in the room, so which card starts selected is drawn
       independently of position.

   Both travel with the tap, or the experiment is measuring our own layout. */

/**
 * The permanent second option.
 *
 * v2 always shows TWO cards. When there is only one real memory (or one has
 * just been covered) this fills the other slot, which means the layout can
 * never look broken, and the escape hatch we have wanted since the start gets
 * a home instead of being an apologetic line of microcopy.
 */
export const OPEN_CARD: MemoryPrompt = {
  id: "mp_open",
  topicKey: "open",
  topicLabel: "ANYTHING",
  ctaLabel: "Start Call",
  question: "Something else on your mind?",
};

/**
 * The pair of cards, and the line above them.
 *
 * The HEADER is the state channel in v2. A covered topic is acknowledged
 * there rather than as a dead card taking up half the screen, so both slots
 * stay pickable at all times.
 */
export function cardsFor(set: MemorySet): {
  pair: MemoryPrompt[];
  header: string;
} {
  if (set.status === "pending") {
    return { pair: [], header: "Getting your topics ready" };
  }
  const covered = set.prompts.find((p) => p.covered);
  const pair = set.prompts.filter((p) => !p.covered);
  while (pair.length < 2) pair.push(OPEN_CARD);
  return {
    pair: pair.slice(0, 2),
    header: covered
      ? `We covered ${covered.topicLabel.toLowerCase()} last time. What next?`
      : "Pick a topic for a personalised call",
  };
}


/* ── v4: the survey ──────────────────────────────────────────────────────
   The same two topics, asked as research rather than offered as a call.
   Nothing is personalised today, and the screen never pretends otherwise:
   the answer is banked, the promise is dated, and the call that follows is
   the ordinary one.

   Its value is sequence. v2 and v3 both need the memory pipeline to exist AND
   be good before they teach you anything. This needs two generated prompts
   and one write, so it answers "is this worth building" before it is built.
   The trade is that a survey measures what people SAY, where the A/B measures
   what they DO, and on a question like this those two come apart. */

export const SURVEY_COPY = {
  /** Asked in Sarah's bubble, in the slot the greeting normally holds. */
  question: "Based on your last call, which of these would you rather talk about?",
  submit: "Submit",
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
  /** A session or two later. The promise has been read; the tag is gone. */
  | "settled";
