"use client";

import React, { useEffect, useRef, useState } from "react";
import * as T from "@/lib/theme";

/**
 * The reusable calling widget kit — the web port of
 * `presentation/widgets/kit/*`.
 *
 * Same discipline as the Flutter kit: every widget is data + callbacks + a
 * STYLE OBJECT from the theme, and hardcodes no visuals of its own. Swap the
 * theme, get a new calling UI.
 */

/* ── Icons ────────────────────────────────────────────────────────────────
   Material Symbols Rounded, the same family the app's `Icons.*_rounded` set
   comes from, so a glyph here is the glyph the user sees on the phone. */

export function Icon({
  name,
  size = 24,
  color,
  outlined = false,
  className,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  outlined?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`ms${outlined ? " ms-outlined" : ""}${className ? ` ${className}` : ""}`}
      style={{ fontSize: size, color, width: size, height: size, ...style }}
    >
      {name}
    </span>
  );
}

/* ── Background ──────────────────────────────────────────────────────────── */

export function CallingBackground() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: T.backgroundCss,
      }}
    />
  );
}

/* ── Glow ─────────────────────────────────────────────────────────────────
   A soft light source: ONE elliptical radial falloff painted across the whole
   box. Not a blurred shape and not a lobed silhouette — a glow is a falloff,
   not an outline, and a mask blur would spread coverage out where the
   gradient is already transparent. */

export function Glow({
  rgb,
  alpha,
  width,
  height,
  centerX = "50%",
  centerY = "50%",
  intensity = 1,
  transitionMs = 420,
  breathe,
  style,
}: {
  rgb: string;
  alpha: number;
  width: number;
  height: number;
  centerX?: string;
  centerY?: string;
  intensity?: number;
  transitionMs?: number;
  /** Opacity breathing, min→max, as the light's own pulse. */
  breathe?: { min: number; max: number; periodMs: number };
  style?: React.CSSProperties;
}) {
  const inner: React.CSSProperties = breathe
    ? {
        animation: `cv3-breathe ${breathe.periodMs}ms ease-in-out infinite alternate`,
        ["--breath-min" as string]: breathe.min,
        ["--breath-max" as string]: breathe.max,
      }
    : {};
  return (
    <div
      style={{
        position: "absolute",
        left: `calc(${centerX} - ${width / 2}px)`,
        top: `calc(${centerY} - ${height / 2}px)`,
        width,
        height,
        pointerEvents: "none",
        opacity: intensity,
        transition: `opacity ${transitionMs}ms ease-in-out`,
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: T.glowGradient(rgb, alpha),
          ...inner,
        }}
      />
    </div>
  );
}

/**
 * The user's turn light: a wide, flat glow whose SOURCE sits below the phone,
 * so it reads as a pool of light the screen rests on rather than green paint
 * along the bottom. Always mounted — `active` cross-fades it, because adding
 * and removing it from the tree makes the hand-over pop.
 */
export function BreathingGlow({ active }: { active: boolean }) {
  const g = T.userGlow;
  return (
    <Glow
      rgb={g.color}
      alpha={1}
      width={g.widthFraction * T.FRAME.width}
      height={g.height}
      centerY={`${g.centerY * 100}%`}
      intensity={active ? 1 : 0}
      transitionMs={g.handoffMs}
      breathe={{
        min: g.minOpacity,
        max: g.maxOpacity,
        periodMs: g.breathPeriodMs,
      }}
    />
  );
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */

export function CallingAvatar({
  size,
  src,
  speaking = false,
  haloOpacity = 1,
}: {
  size: number;
  src: string;
  /** Sarah is audible — the halo brightens and breathes. */
  speaking?: boolean;
  /**
   * 0 hands the light over to the other speaker: exactly one side of the
   * conversation is lit at a time, so the halo itself says whose turn it is.
   */
  haloOpacity?: number;
}) {
  const s = T.avatar;
  const reach = size * s.glowSpread;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        // Never squashed by a tight column: a circle that has become an
        // ellipse is the first thing anyone notices.
        flexShrink: 0,
        transition: `width ${T.frame.phaseTransitionMs}ms ease-in-out, height ${T.frame.phaseTransitionMs}ms ease-in-out`,
      }}
    >
      {/* The halo. Only the COLOUR moves while she speaks — it does not
          inflate. */}
      <div
        style={{
          position: "absolute",
          left: (size - reach) / 2,
          top: (size - reach) / 2,
          width: reach,
          height: reach,
          pointerEvents: "none",
          opacity: haloOpacity,
          transition: `opacity ${s.glowHandoffMs}ms ease-in-out`,
        }}
      >
        {/* The two colours CROSS-FADE rather than stack: in the app this is
            one light whose colour lerps toward the speaking value, so adding
            the second on top of the first would paint twice the light. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: T.glowGradient(s.glowColor, s.glowAlpha),
            opacity: speaking ? 0 : 1,
            transition: "opacity 260ms ease-in-out",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: T.glowGradient(s.speakingGlowColor, s.speakingGlowAlpha),
            opacity: speaking ? 1 : 0,
            transition: "opacity 260ms ease-in-out",
            animation: speaking
              ? "cv3-halo-breathe 1100ms ease-in-out infinite alternate"
              : undefined,
          }}
        />
      </div>

      {/* The ring. Rotating the sweep gradient IS the glimmer — no second
          widget laid over it. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `conic-gradient(${s.ringColors[0]}, ${s.ringColors[1]}, ${s.ringColors[2]}, ${s.ringColors[0]})`,
          WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${s.ringWidth}px), #000 calc(100% - ${s.ringWidth}px))`,
          mask: `radial-gradient(farthest-side, transparent calc(100% - ${s.ringWidth}px), #000 calc(100% - ${s.ringWidth}px))`,
          animation: `cv3-spin ${s.glimmerPeriodMs}ms linear infinite`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: s.ringWidth + s.ringGap,
          borderRadius: "50%",
          overflow: "hidden",
        }}
      >
        {/* A video source plays muted, looped and inline — the same job the
            animated webp did, at a fraction of the weight and without the
            frame-rate ceiling. The poster is the video's own first frame, so
            nothing pops when it swaps in. */}
        {src.endsWith(".mp4") ? (
          <video
            src={src}
            poster={src.replace(/\.mp4$/, ".jpg")}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Sarah"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
    </div>
  );
}

/** The connecting-screen ripples: filled circles fading to zero as they go. */
export function PulseRings({ diameter }: { diameter: number }) {
  return (
    <div
      style={{
        position: "absolute",
        width: diameter,
        height: diameter,
        pointerEvents: "none",
      }}
    >
      {T.pulseRings.staggersMs.map((delay, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: T.pulseRings.color,
            animation: `cv3-ripple ${T.pulseRings.periodMs}ms linear infinite`,
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Pills and buttons ───────────────────────────────────────────────────── */

export function CallingTopPill({
  style,
  icon,
  label,
  onTap,
  outlinedIcon = false,
  testId,
}: {
  style: typeof T.historyPill;
  icon: string;
  label: string;
  onTap?: () => void;
  outlinedIcon?: boolean;
  testId?: string;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onTap}
      disabled={!onTap}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: style.gap,
        height: style.height,
        padding: `0 ${style.horizontalPadding}px`,
        borderRadius: style.radius,
        background: style.fill,
        border: style.borderWidth
          ? `${style.borderWidth}px solid ${style.borderColor}`
          : "none",
        color: style.textColor,
        cursor: onTap ? "pointer" : "default",
        maxWidth: "100%",
      }}
    >
      <Icon name={icon} size={style.iconSize} color={style.iconColor} outlined={outlinedIcon} />
      <span
        style={{
          fontSize: style.fontSize,
          fontWeight: 600,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
    </button>
  );
}

export function CallingStartButton({
  label,
  icon = "call",
  onTap,
  testId,
  variant = "solid",
}: {
  label: string;
  icon?: string | null;
  onTap?: (() => void) | null;
  testId?: string;
  /**
   * "waiting" is the button before a required choice has been made. It is a
   * DIFFERENT button, not a dimmed one: a faded copy of the live CTA reads as
   * broken, where an outline reads as not yet. It also drops the phone icon,
   * because an icon promising a call above a label asking for a topic is the
   * button contradicting itself.
   */
  variant?: "solid" | "waiting";
}) {
  const s = T.startButton;
  const waiting = variant === "waiting";
  const enabled = !!onTap;
  return (
    <button
      data-testid={testId}
      onClick={onTap ?? undefined}
      disabled={!enabled}
      style={{
        width: "100%",
        height: s.height,
        borderRadius: s.height / 2,
        background: waiting
          ? "rgba(255,255,255,0.05)"
          : `linear-gradient(90deg, ${s.gradientStart}, ${s.gradientEnd})`,
        border: waiting ? "1.5px solid rgba(255,255,255,0.20)" : "none",
        color: waiting ? "rgba(255,255,255,0.62)" : s.textColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.iconGap,
        opacity: enabled || waiting ? 1 : 0.5,
        cursor: enabled ? "pointer" : "default",
        // The fill arriving is what makes the pick feel like it landed.
        transition: "background 220ms ease, color 220ms ease, border-color 220ms ease",
      }}
    >
      <span
        // Keyed on the label so a changed CTA fades its words in rather than
        // cutting to them.
        key={label}
        style={{
          display: "flex",
          alignItems: "center",
          gap: s.iconGap,
          animation: "cv3-label-swap 260ms ease-out",
        }}
      >
        {icon && !waiting && <Icon name={icon} size={s.iconSize} />}
        <span style={{ fontSize: waiting ? 17 : s.fontSize, fontWeight: waiting ? 600 : 700 }}>
          {label}
        </span>
      </span>
    </button>
  );
}

export function CallingRoundControl({
  style,
  icon,
  label,
  onTap,
  testId,
}: {
  style: typeof T.neutralControl;
  icon: string;
  label: string;
  onTap?: (() => void) | null;
  testId?: string;
}) {
  const enabled = !!onTap;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: enabled ? 1 : style.disabledOpacity,
      }}
    >
      <button
        data-testid={testId}
        onClick={onTap ?? undefined}
        disabled={!enabled}
        style={{
          width: style.size,
          height: style.size,
          borderRadius: "50%",
          background: style.fill,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: enabled ? "pointer" : "default",
          transition: "background 220ms ease",
        }}
      >
        <Icon name={icon} size={style.iconSize} color={style.iconColor} />
      </button>
      <div
        style={{
          marginTop: style.labelGap,
          fontSize: style.labelSize,
          fontWeight: 500,
          color: style.labelColor,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function SarahSpeechBubble({ text }: { text: string }) {
  const s = T.bubble;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${s.tailWidth / 2}px solid transparent`,
          borderRight: `${s.tailWidth / 2}px solid transparent`,
          borderBottom: `${s.tailHeight}px solid ${s.fill}`,
        }}
      />
      <div
        style={{
          background: s.fill,
          borderRadius: s.radius,
          padding: `${s.paddingVertical}px ${s.paddingHorizontal}px`,
          fontSize: s.fontSize,
          lineHeight: s.lineHeight,
          textAlign: "center",
          color: "#fff",
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* ── Chips ───────────────────────────────────────────────────────────────── */

export function ElapsedTimeChip({
  text,
  paused = false,
  pausedSuffix,
  dotColorOverride,
}: {
  text: string;
  paused?: boolean;
  pausedSuffix?: string;
  dotColorOverride?: string;
}) {
  const s = T.elapsedChip;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        height: s.height,
        padding: `0 ${s.horizontalPadding}px`,
        borderRadius: s.radius,
        background: s.fill,
      }}
    >
      <span
        style={{
          width: s.dotSize,
          height: s.dotSize,
          borderRadius: "50%",
          background: paused ? s.pausedDotColor : dotColorOverride ?? s.dotColor,
        }}
      />
      <span
        className="tabular"
        style={{ fontSize: s.fontSize, fontWeight: 600, color: s.textColor }}
      >
        {paused && pausedSuffix ? `${text} · ${pausedSuffix}` : text}
      </span>
    </div>
  );
}

export function TalktimeNudgeChip({ label }: { label: string }) {
  const s = T.talktimeNudge;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        height: s.height,
        padding: `0 ${s.horizontalPadding}px`,
        borderRadius: s.radius,
        background: s.fill,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <Icon name="schedule" size={s.iconSize} color={s.iconColor} outlined />
      <span
        className="tabular"
        style={{ fontSize: s.fontSize, fontWeight: 600, color: s.textColor }}
      >
        {label}
      </span>
    </div>
  );
}

/** Neither side is talking and the transport is re-establishing: a spinner,
    never a speaking equalizer, so it cannot be mistaken for someone holding
    the floor. */
export function ReconnectingChip({ label }: { label: string }) {
  const s = T.reconnectingChip;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        height: s.height,
        padding: `0 ${s.horizontalPadding}px`,
        borderRadius: s.radius,
        background: s.fill,
        border: `1px solid ${s.border}`,
      }}
    >
      <span
        style={{
          width: s.spinnerSize,
          height: s.spinnerSize,
          borderRadius: "50%",
          border: `${s.spinnerStroke}px solid ${s.spinnerColor}`,
          borderTopColor: "transparent",
          animation: "cv3-spin 900ms linear infinite",
        }}
      />
      <span style={{ fontSize: s.fontSize, fontWeight: 600, color: s.textColor }}>
        {label}
      </span>
    </div>
  );
}

/** Sarah's chip: a staggered equalizer, the classic four bars. */
export function SpeakingStateChip({ label }: { label: string }) {
  const s = T.sarahSpeakingChip;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        height: s.height,
        padding: `0 ${s.horizontalPadding}px`,
        borderRadius: s.radius,
        background: s.fill,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          height: s.barMaxHeight,
        }}
      >
        {Array.from({ length: s.barCount }).map((_, i) => (
          <span
            key={i}
            style={{
              width: s.barWidth,
              borderRadius: s.barWidth,
              background: s.accent,
              animation: `cv3-eq ${s.blinkPeriodMs}ms ease-in-out infinite`,
              animationDelay: `${(i * s.blinkPeriodMs) / s.barCount}ms`,
            }}
          />
        ))}
      </span>
      <span style={{ fontSize: s.fontSize, fontWeight: 600, color: s.textColor }}>
        {label}
      </span>
    </div>
  );
}

/** A wave gif that PLAYS with device VAD next to a plain white label. */
export function UserTurnIndicator({
  label,
  voiceActive,
}: {
  label: string;
  voiceActive: boolean;
}) {
  const s = T.userTurnIndicator;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        height: s.height,
        padding: `0 ${s.horizontalPadding}px`,
        borderRadius: s.radius,
        background: s.fill,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wave.gif"
        alt=""
        style={{
          width: s.gifSize,
          height: s.gifSize,
          // The gif has no controller here; resting on a still frame is what
          // "not hearing you" has to look like.
          opacity: voiceActive ? 1 : 0.45,
          filter: voiceActive ? "none" : "grayscale(1)",
          transition: "opacity 160ms linear",
        }}
      />
      <span
        style={{ fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.textColor }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Transcript ──────────────────────────────────────────────────────────── */

/**
 * History is OFF (as in the app): only the live line renders, and it holds the
 * centre for the whole call. The outgoing line lifts and fades in a fraction
 * of the time the new one takes to rise into the same spot, so the eye never
 * has to decide which of two captions is current.
 */
export function CallingTranscript({ lines }: { lines: string[] }) {
  const s = T.transcript;
  const index = lines.length - 1;
  const text = lines[index] ?? "";
  const [leaving, setLeaving] = useState<{ key: number; text: string } | null>(null);
  const prev = useRef<{ key: number; text: string } | null>(null);

  useEffect(() => {
    if (index < 0) return;
    if (prev.current && prev.current.key !== index) {
      setLeaving(prev.current);
      const id = window.setTimeout(() => setLeaving(null), s.exitMs);
      prev.current = { key: index, text };
      return () => window.clearTimeout(id);
    }
    prev.current = { key: index, text };
  }, [index, text, s.exitMs]);

  if (index < 0) return <div style={{ flex: 1 }} />;

  const lineStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: s.recentColor,
    fontSize: s.recentFontSize,
    fontWeight: 600,
    lineHeight: 1.4,
  };

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `0 ${s.horizontalPadding}px`,
      }}
    >
      <div style={{ position: "relative", width: "100%" }}>
        {leaving && (
          <div
            key={`out-${leaving.key}`}
            style={{
              ...lineStyle,
              top: "50%",
              transform: "translateY(-50%)",
              animation: `cv3-line-out ${s.exitMs}ms ease-in forwards`,
            }}
          >
            {leaving.text}
          </div>
        )}
        <div
          key={index}
          style={{
            ...lineStyle,
            position: "relative",
            animation: `cv3-line-in ${s.revealMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

/* ── Shimmer ─────────────────────────────────────────────────────────────── */

export function ShimmerBox({
  height,
  width,
  radius = 8,
  animate = true,
}: {
  height: number;
  width?: number | string;
  radius?: number;
  animate?: boolean;
}) {
  return (
    <div
      className={animate ? "cv3-shimmer" : undefined}
      style={{
        height,
        width: width ?? "100%",
        borderRadius: radius,
        background: animate ? undefined : "rgba(255,255,255,0.12)",
      }}
    />
  );
}
