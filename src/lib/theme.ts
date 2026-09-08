/**
 * Port of `lib/features/calling_v3/presentation/theme/calling_v3_theme.dart`.
 *
 * Every visual crank of the calling UI, in one place — same discipline as the
 * app: components take these values and hardcode nothing. Numbers are design
 * px against the 412x917 frame, which is also this prototype's CSS px because
 * the whole frame is scaled with one transform.
 */

export const FRAME = { width: 412, height: 917 };

export const colors = {
  lavender: "#C4B5FD",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.70)",
};

export const background = {
  top: "#332452",
  mid: "#1D1530",
  bottom: "#120E1C",
  /** The bottom-tab-bar colour, so the screen melts into it. */
  blend: "#0A0911",
  stops: [0, 0.5, 0.82, 1] as const,
};

export const backgroundCss = `linear-gradient(180deg, ${background.top} 0%, ${background.mid} 50%, ${background.bottom} 82%, ${background.blend} 100%)`;

export const historyPill = {
  textColor: "#FFFFFF",
  iconColor: "#FFFFFF",
  fill: "transparent",
  borderColor: "rgba(255,255,255,0.16)",
  borderWidth: 1,
  height: 36,
  radius: 18,
  fontSize: 13,
  iconSize: 15,
  horizontalPadding: 14,
  gap: 6,
};

export const minutesPill = {
  ...historyPill,
  textColor: "#D8CDFB",
  iconColor: "#D8CDFB",
  fill: "rgba(139,124,246,0.12)",
  borderColor: "transparent",
  borderWidth: 0,
};

export const avatar = {
  ringColors: ["#C4B5FD", "rgba(139,124,246,0.40)", "#C4B5FD"],
  ringWidth: 2,
  ringGap: 4,
  /** 0xB87660E0 — the resting halo. */
  glowColor: "118,96,224",
  glowAlpha: 0.72,
  /** 0xF47A64E6 — she is audible. */
  speakingGlowColor: "122,100,230",
  speakingGlowAlpha: 0.96,
  /** How far the halo carries, as a multiple of the avatar's diameter. */
  glowSpread: 6.6,
  /** Cross-fade only: V2 MOVED a light between speakers and it read as lag. */
  glowHandoffMs: 420,
  glimmerPeriodMs: 2600,
};

export const bubble = {
  fill: "rgba(255,255,255,0.09)",
  radius: 18,
  tailWidth: 18,
  tailHeight: 9,
  fontSize: 17,
  lineHeight: 1.45,
  paddingHorizontal: 32,
  paddingVertical: 18,
};

export const startButton = {
  gradientStart: "#EFE9FD",
  gradientEnd: "#CFC0F8",
  textColor: "#1A1230",
  height: 62,
  fontSize: 21,
  iconSize: 22,
  iconGap: 10,
};

export const neutralControl = {
  fill: "rgba(255,255,255,0.12)",
  iconColor: "#FFFFFF",
  size: 62,
  iconSize: 26,
  labelColor: "rgba(255,255,255,0.70)",
  labelSize: 11.5,
  labelGap: 8,
  disabledOpacity: 0.35,
};

export const activeControl = {
  ...neutralControl,
  fill: "#FFFFFF",
  iconColor: "#1A1230",
};

export const dangerControl = {
  ...neutralControl,
  fill: "#E5484D",
  iconColor: "#FFFFFF",
};

export const pulseRings = {
  /** Brightest right at Sarah's rim; the alpha fades to zero as it travels. */
  color: "rgba(196,181,253,0.35)",
  periodMs: 4000,
  /** RippleEffect's three hardcoded staggers, tuned for the 4s period. */
  staggersMs: [0, 1350, 2650],
};

export const elapsedChip = {
  fill: "rgba(255,255,255,0.08)",
  dotColor: "#4ADE80",
  pausedDotColor: "#FBBF24",
  dotSize: 7,
  textColor: "#FFFFFF",
  fontSize: 13,
  height: 30,
  radius: 15,
  horizontalPadding: 12,
  gap: 7,
};

export const sarahSpeakingChip = {
  fill: "rgba(196,181,253,0.18)",
  accent: "#C4B5FD",
  textColor: "#D8CDFB",
  fontSize: 13,
  height: 34,
  radius: 17,
  horizontalPadding: 14,
  gap: 8,
  barCount: 4,
  barWidth: 3,
  barMaxHeight: 14,
  blinkPeriodMs: 900,
};

export const userTurnIndicator = {
  fill: "rgba(255,255,255,0.12)",
  textColor: "#FFFFFF",
  fontSize: 13,
  fontWeight: 600,
  gifSize: 30,
  gap: 6,
  height: 34,
  radius: 17,
  horizontalPadding: 14,
};

export const reconnectingChip = {
  height: 36,
  horizontalPadding: 14,
  radius: 18,
  gap: 8,
  fontSize: 13,
  spinnerSize: 14,
  spinnerStroke: 2,
  fill: "rgba(245,158,11,0.20)",
  border: "rgba(245,158,11,0.40)",
  spinnerColor: "#FBBF24",
  textColor: "#FDE68A",
};

export const talktimeNudge = {
  height: 28,
  horizontalPadding: 10,
  radius: 14,
  gap: 6,
  fontSize: 12,
  iconSize: 13,
  fill: "rgba(245,158,11,0.20)",
  border: "rgba(245,158,11,0.30)",
  iconColor: "#FBBF24",
  textColor: "#FDE68A",
};

export const transcript = {
  recentColor: "#FFFFFF",
  recentFontSize: 20,
  horizontalPadding: 28,
  /** How long a NEW line takes to rise into the reading position. */
  revealMs: 520,
  /** How long the line being replaced takes to clear out. Short on purpose. */
  exitMs: 180,
};

/** The user's turn light: source off-screen, so it reads as light from behind. */
export const userGlow = {
  color: "66,216,144",
  widthFraction: 1.6,
  height: 900,
  centerY: 1.04,
  handoffMs: 420,
  breathPeriodMs: 2600,
  minOpacity: 0.21,
  maxOpacity: 0.52,
};

export const frame = {
  /**
   * Device insets. The status bar and the home indicator own these bands, so
   * every screen's own padding starts after them — the same job `SafeArea`
   * does in the app.
   */
  safeTop: 60,
  safeBottom: 18,

  screenPaddingH: 20,
  screenPaddingTop: 20,
  screenPaddingBottom: 32,

  homeAvatarSize: 258,
  homeHeadingSize: 30,
  homeNameSize: 27,
  homeSubtitleSize: 14,
  homeSubtitleColor: "rgba(216,205,251,0.75)",

  ringingAvatarSize: 195,
  ringingNameSize: 28,
  callingBlinkPeriodMs: 1100,
  ringingTopSpacer: 140,
  phaseTransitionMs: 450,

  activeAvatarSize: 112,
  activeAvatarChipGap: 8,
  activeChipRowDrop: 12,
  controlsBottomGap: 32,
  controlsChipGap: 24,
  flagButtonSize: 38,
};

/**
 * The `Glow` painter's falloff, sampled from `(1 - t²)³` — value AND slope
 * both reach zero at t=1, so the light ends without a kink the eye reads as
 * an edge. Same nine samples the Dart painter uses.
 */
const FALLOFF = [1.0, 0.954, 0.824, 0.635, 0.422, 0.226, 0.084, 0.013, 0.0];

/** An elliptical radial falloff, as one CSS gradient. */
export function glowGradient(rgb: string, alpha: number): string {
  const stops = FALLOFF.map((f, i) => {
    const pct = (i / (FALLOFF.length - 1)) * 100;
    return `rgba(${rgb},${(alpha * f).toFixed(3)}) ${pct.toFixed(1)}%`;
  });
  return `radial-gradient(ellipse 50% 50% at 50% 50%, ${stops.join(", ")})`;
}
