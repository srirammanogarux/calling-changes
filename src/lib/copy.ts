/**
 * Copy, lifted verbatim from `assets/i18n/strings.i18n.json` (`callingV3`)
 * and from the compiled-in Remote Config defaults in
 * `call_feedback_options_data_source.dart` / `call_report_options_data_source.dart`.
 *
 * English only — the prototype has no locale switch, and inventing wording
 * here is how a prototype ends up validating copy the app never ships.
 */

export const t = {
  home: {
    greeting:
      "Hi! I am Sarah. You can speak freely with me. I will support you if you get stuck.",
    history: "History",
    timeUnavailable: "Unavailable",
    startCall: "Start Call",
    yourEnglishTutor: "Your English tutor",
    callWithSarah: "Call with Sarah",
    minLeft: (minutes: string) => `${minutes} min left`,
    minLeftUnder: (minutes: string) => `<${minutes} min left`,
    secondsLeft: (seconds: string) => `${seconds}s left`,
    upgradeCta: "Get more call time",
    requestMoreTalktimeCta: "Request more talktime",
    moreTalktimeSheetTitle: "Out of talktime for today",
    moreTalktimeSheetBody:
      "You've used your daily talktime with Sarah. Message us on WhatsApp and we'll sort you out with more.",
    moreTalktimeSheetCta: "Message us on WhatsApp",
    micPermissionNeeded: "Microphone permission is needed to start a call",
    outOfTimeFree:
      "You're out of call time for today. Upgrade to keep practicing with Sarah.",
  },
  active: {
    calling: "Calling…",
    sarahSpeaking: "Sarah is speaking",
    yourTurn: "Your turn",
    mute: "Mute",
    endCall: "End",
    cancel: "Cancel",
    speaker: "Speaker",
    earpiece: "Earpiece",
    wired: "Wired",
    bluetooth: "Bluetooth",
    reconnecting: "Reconnecting…",
    paused: "paused",
    minutesLeft: (minutes: string) => `<${minutes} min left`,
  },
  exit: {
    title: "Leave your call with Sarah?",
    body: "Your call is still running. Leaving now ends it.",
    stay: "Stay in call",
    end: "End call",
  },
  failure: {
    title: "Something went wrong",
    generic: "Couldn't start the call. Please try again.",
    noTalktime: "You're out of call time for today. Come back tomorrow!",
    sarahUnavailable: "Sarah couldn't join the call. Please try again.",
    agentFatal: "The call ended unexpectedly. Please try again.",
    agentLeft: "Sarah has unexpectedly left the call.",
    errorCodeLabel: "Error code",
    connectionLost: "Connection lost",
    tryAgain: "Try again",
    backHome: "Back to home",
    capacityFull:
      "Sarah's lines are all busy right now. Please try again in a minute.",
    rateLimited: "Too many call attempts. Please try again shortly.",
    talktimeUnavailable: "Couldn't fetch remaining talktime",
  },
  history: {
    title: "Recent Calls",
    empty: "No calls yet. Your finished calls will show up here.",
    retry: "Retry",
  },
  report: {
    title: "Report an issue",
    subtitle: "Tap what went wrong, and add a note if you can.",
    submit: "Send report",
    sendLogs: "Send diagnostic logs",
    sendLogsHint: "Helps us find the problem faster",
    thanks: "Thanks, report sent!",
  },
};

/** Mid-call report issues + their per-issue note hints. */
export const REPORT_ISSUES = [
  {
    key: "didnt_understand",
    label: "I didn't understand Sarah",
    hint: "Which word or question was confusing?",
  },
  {
    key: "misheard_me",
    label: "Sarah misheard me",
    hint: "What did she hear wrong?",
  },
  {
    key: "made_things_up",
    label: "She made up something I never said",
    hint: "What did she invent?",
  },
  {
    key: "wrong_correction",
    label: "Wrong correction",
    hint: "What should it have been?",
  },
  {
    key: "ignored_me",
    label: "She ignored what I said",
    hint: "What did you say that she skipped?",
  },
  {
    key: "repeating",
    label: "She keeps asking the same thing",
    hint: "What is she repeating?",
  },
  {
    key: "too_hard",
    label: "Too hard for my level",
    hint: "Which part felt too advanced?",
  },
  {
    key: "robotic",
    label: "Her reply felt generic / robotic",
    hint: "What felt off?",
  },
  {
    key: "audio_problem",
    label: "I couldn't hear her properly",
    hint: "What did the audio sound like?",
  },
  { key: "other", label: "Something else", hint: "Tell us what happened" },
];

/**
 * Post-call feedback: the heading IS the question, so it swaps with the star,
 * and each star gets its own chip bucket (1-star problems ≠ 5-star praise).
 */
export const FEEDBACK_COPY = {
  idleHeading: "How was your call?",
  idlePlaceholder: "Tell us more (optional)",
  optionsPrompt: "Pick all that apply",
  submitCta: "Submit feedback",
  dismissCta: "Not now",
  headings: {
    1: "Oh no. What went wrong?",
    2: "What let you down?",
    3: "What would make it a 5?",
    4: "Great! What clicked?",
    5: "Love it! What made it great?",
  } as Record<number, string>,
  placeholders: {
    1: "Tell us what broke so we can fix it",
    2: "What made this frustrating?",
    3: "What was missing?",
    4: "Anything we could sharpen?",
    5: "Anything you'd tell Sarah?",
  } as Record<number, string>,
};

export const FEEDBACK_OPTIONS: Record<
  number,
  { key: string; label: string }[]
> = {
  1: [
    { key: "drops", label: "Call kept dropping" },
    { key: "audio", label: "Couldn't hear her" },
    { key: "misheard", label: "She misheard me" },
    { key: "lag", label: "Too laggy" },
    { key: "voice", label: "Didn't like Sarah's voice" },
    { key: "silent", label: "She didn't respond" },
  ],
  2: [
    { key: "misheard_lot", label: "Misheard me a lot" },
    { key: "interrupted", label: "Cut me off" },
    { key: "too_fast", label: "Spoke too fast" },
    { key: "repetitive", label: "Repeated same questions" },
    { key: "bad_feedback", label: "Didn't like feedback" },
    { key: "pauses", label: "Long pauses" },
  ],
  3: [
    { key: "boring", label: "Boring topic" },
    { key: "too_easy", label: "Too easy" },
    { key: "too_hard", label: "Too hard" },
    { key: "need_better", label: "Need better feedback" },
    { key: "too_short", label: "Felt too short" },
    { key: "hard_follow", label: "Hard to follow" },
  ],
  4: [
    { key: "easy_talk", label: "Easy to talk to" },
    { key: "good_feedback", label: "Helpful feedback" },
    { key: "right_level", label: "Right difficulty" },
    { key: "natural", label: "Felt natural" },
    { key: "learned", label: "Learned something" },
    { key: "more_depth", label: "Wanted more depth" },
  ],
  5: [
    { key: "real_chat", label: "Felt like a real chat" },
    { key: "confident", label: "More confident now" },
    { key: "new_words", label: "Learned new words" },
    { key: "great_feedback", label: "Great feedback" },
    { key: "pace", label: "Perfect pace" },
    { key: "call_again", label: "Want to call again" },
  ],
};
