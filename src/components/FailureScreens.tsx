"use client";

import React from "react";

/**
 * The seven call failure screens, ported from the approved failure-states
 * build: the same art, the same shared motion library, the same copy and the
 * same two buttons.
 *
 * The ONLY thing that changed is the frame around them. They were built at
 * 390x844 as a gallery; here they sit inside the same 412x917 device the rest
 * of this prototype uses, so a failure can be looked at next to the screen it
 * interrupts rather than on a page of its own.
 *
 * The illustration stage is left at exactly 290x290, because every offset in
 * the motion (the coin's drop line, the slot glow, the clock sweep, Sarah's
 * contact circle) is an absolute pixel position measured against that box.
 * Resizing it would quietly break all of them.
 */

const STAGE = 290;
/** Where the art sits, as the fraction of screen height it held at 390x844. */
const STAGE_TOP = 170;

export interface FailureScreen {
  key: string;
  /** The reason code this replaces, so the mapping is not lost in a redesign. */
  reason: string;
  title: string;
  body: string;
  primary: string;
  /** A cooldown that has not elapsed: present, named, and not yet pressable. */
  primaryLocked?: boolean;
  primaryIcon: "retry" | "call" | "upgrade";
  /** The CTA opens the paywall, so it is sold rather than merely offered. */
  primaryShine?: boolean;
  /** The one-line motion note from the original build. */
  note: string;
  art: React.ReactNode;
  /** Only the talktime screen carries the reset countdown, and it RUNS: a
   *  frozen clock on a screen whose whole promise is "wait" is the one detail
   *  that tells you the screen is a picture. Seconds from now to the reset. */
  resetInS?: number;
}

export const FAILURE_SCREENS: FailureScreen[] = [
  {
    key: "no_talktime",
    reason: "noTalktime",
    title: "You're out of talktime",
    body: "You've used all 15 minutes. Your call will reset in the next",
    resetInS: 12 * 60 * 60,
    primary: "Get more talktime",
    primaryIcon: "upgrade",
    primaryShine: true,
    note: "Coin drop. Falls down the slot's centre line, taps the mouth, bounces, turns edge-on and slides inside, clipped at the mouth so it is truly swallowed.",
    art: (
      <Stage>
        <Ground />
        <Float animation="fs-bob 3.8s ease-in-out infinite">
          <Art src="/payphone_base.png" />
          <Shine src="/payphone_base.png" />
          <div
            style={{
              position: "absolute",
              left: 118,
              top: 100,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(245,180,80,.55) 0%, rgba(245,180,80,0) 66%)",
              opacity: 0,
              animation: "fs-slotGlow 3.8s ease-out infinite",
            }}
          />
          {/* Clipped at the slot mouth, so the coin is genuinely swallowed
              rather than fading out behind the art. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: -170,
              width: 290,
              height: 301.12,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 135.8,
                top: 263.9,
                width: 43.61,
                height: 42.2,
                background: "url('/coin_exact.png') center/contain no-repeat",
                filter: "drop-shadow(0 5px 7px rgba(0,0,0,.4))",
                animation: "fs-coinDrop 3.8s linear infinite",
              }}
            />
          </div>
        </Float>
      </Stage>
    ),
  },
  {
    key: "capacity",
    reason: "capacityFull",
    title: "The line's busy",
    body: "Sarah's on another call right now. Give it a moment and try her again.",
    primary: "Try calling again",
    primaryIcon: "call",
    note: "Ring-shake and waves. The rotary phone rattles like a real ring while two lavender rings pulse outward.",
    art: (
      <Stage color="#a78bf0">
        <Ground />
        <Wave />
        <Wave delay=".9s" />
        <Float animation="fs-ringShake 2.6s ease-in-out infinite">
          <Art src="/busy_float.png" />
          <Shine src="/busy_float.png" />
        </Float>
      </Stage>
    ),
  },
  {
    key: "rate_limited",
    reason: "rateLimited",
    title: "Let's slow down a moment",
    body: "You've tried a few times in a row. Take a short breather and we'll reconnect you.",
    primary: "Call again in 0:42",
    primaryLocked: true,
    primaryIcon: "call",
    note: "Jitter. The stack of phones buzzes in place with an amber glow swelling behind them; the CTA stays locked until the cooldown clears.",
    art: (
      <Stage color="#f5b450">
        <Ground />
        <Float animation="fs-bob 3.2s ease-in-out infinite">
          <div
            style={{
              position: "absolute",
              inset: 0,
              animation: "fs-jitter 2.9s ease-in-out infinite",
            }}
          >
            <Art src="/attempts_float.png" />
            <Shine src="/attempts_float.png" />
          </div>
        </Float>
        <GlowDot left={96} top={86} size={100} color="rgba(245,180,80,.5)" />
      </Stage>
    ),
  },
  {
    key: "connection_lost",
    reason: "connectionLost",
    title: "Connection lost",
    body: "Your internet dropped mid-call. Reconnect to Wi-Fi or data and try again.",
    primary: "Try again",
    primaryIcon: "retry",
    note: "The signal breaks, not the router. A box on a shelf is not what the user lost; the bars are. The outer arcs gutter out from the top down and a crack runs through them.",
    art: (
      <Stage color="#6ba8f5">
        <Ground />
        <Float animation="fs-bob 3.6s ease-in-out infinite">
          <SignalBreak />
        </Float>
        <GlowDot left={101} top={164} size={88} color="rgba(107,168,245,.55)" />
      </Stage>
    ),
  },
  {
    key: "agent_timeout",
    reason: "agentReadyTimeout",
    title: "Sarah couldn't pick up",
    body: "She didn't answer this time. Give her a moment and call again.",
    primary: "Try again",
    primaryIcon: "retry",
    note: "Ringing, unanswered. The phone rattles with lavender rings going out and Sarah's real photo in the contact circle. Zoomed: her photo is the point of the screen, and at the gallery size it was a 37px dot.",
    art: (
      <Stage color="#a78bf0" scale={1.4}>
        <Ground />
        <Wave />
        <Wave delay="1.1s" />
        <Float animation="fs-ringShake 3s ease-in-out infinite">
          <Art src="/sarah_float.png" />
          <div
            style={{
              position: "absolute",
              left: 126,
              top: 103,
              width: 37,
              height: 37,
              borderRadius: "50%",
              background: "url('/sarah_avatar.png') center/cover no-repeat",
              border: "2.5px solid #a78bf0",
              boxShadow: "0 2px 6px rgba(0,0,0,.45)",
            }}
          />
          <Shine src="/sarah_float.png" />
        </Float>
      </Stage>
    ),
  },
  {
    key: "agent_fatal",
    reason: "agentFatalError",
    title: "The call broke off",
    body: "Something went wrong on our end and the call dropped. Try starting a fresh one.",
    primary: "Try again",
    primaryIcon: "retry",
    note: "Crack split. The art is cut down the crack with clip-path and the two halves shudder apart, red flashing along the break.",
    art: (
      <Stage>
        <Ground />
        <div style={{ position: "absolute", inset: 0 }}>
          <Half side="l" />
          <Half side="r" />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "34%",
              width: 5,
              height: 120,
              transform: "translateX(-50%)",
              background: "linear-gradient(180deg, transparent, #f0736b, transparent)",
              opacity: 0,
              animation: "fs-crackFlash 3.4s ease-out infinite",
              filter: "blur(2px)",
            }}
          />
        </div>
      </Stage>
    ),
  },
  {
    key: "timed_out",
    reason: "connectFailure",
    title: "The call timed out",
    body: "We couldn't reach Sarah in time. Check your connection and try again.",
    primary: "Try again",
    primaryIcon: "retry",
    note: "Clock sweep. A hand sweeps continuously around the clock face while the handset drifts, time running out.",
    art: (
      <Stage color="#f5b450">
        <Ground />
        <Float animation="fs-bob 4s ease-in-out infinite">
          <Art src="/timeout_float.png" />
          <div
            style={{
              position: "absolute",
              left: 156.5,
              top: 81.7,
              width: 56,
              height: 56,
              borderRadius: "50%",
              background:
                "conic-gradient(from 0deg, rgba(245,180,80,.55), rgba(245,180,80,0) 26%)",
              animation: "fs-spin 2.4s linear infinite",
              mixBlendMode: "screen",
            }}
          />
          <Shine src="/timeout_float.png" />
        </Float>
      </Stage>
    ),
  },
];

export function failureScreen(key: string): FailureScreen {
  return FAILURE_SCREENS.find((s) => s.key === key) ?? FAILURE_SCREENS[0];
}

export function FailureScreenView({ screen }: { screen: FailureScreen }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        // The approved background, kept rather than swapped for the home
        // gradient: the art was keyed out against this one.
        background:
          "linear-gradient(178deg, #2c2148 0%, #221a3b 40%, #171024 70%, #0d0a16 100%)",
      }}
    >
      <div style={{ height: STAGE_TOP, flexShrink: 0 }} />
      {screen.art}

      <h2
        style={{
          marginTop: 40,
          color: "#fff",
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          textAlign: "center",
        }}
      >
        {screen.title}
      </h2>
      <p
        style={{
          marginTop: 12,
          color: "#a49cbe",
          fontSize: 16,
          lineHeight: 1.5,
          textAlign: "center",
          maxWidth: 316,
        }}
      >
        {screen.body}
      </p>

      {screen.resetInS !== undefined && <ResetClock seconds={screen.resetInS} />}

      <div style={{ flex: 1 }} />
      <div
        style={{
          flexShrink: 0,
          padding: "0 24px 52px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
        }}
      >
        <button
          data-testid="fs_primary"
          style={{
            position: "relative",
            overflow: "hidden",
            height: 56,
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            fontSize: 16.5,
            fontWeight: 700,
            background: screen.primaryLocked ? "rgba(255,255,255,.16)" : "#ddd2fb",
            color: screen.primaryLocked ? "#b9b1cf" : "#241a3d",
            cursor: screen.primaryLocked ? "default" : "pointer",
            boxShadow: screen.primaryShine
              ? "0 6px 22px rgba(221,210,251,.22)"
              : undefined,
          }}
        >
          {/* The gloss only rides the CTA that costs money. Put it on every
              button and it stops meaning anything; here it is the one signal
              that says this one opens a purchase. */}
          {screen.primaryShine && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: -20,
                bottom: -20,
                left: 0,
                width: 78,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.85) 50%, rgba(255,255,255,0) 100%)",
                animation: "fs-btnShine 3.4s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
          )}
          <PrimaryIcon kind={screen.primaryIcon} />
          <span style={{ position: "relative" }}>{screen.primary}</span>
        </button>
        <button
          data-testid="fs_secondary"
          style={{
            height: 50,
            borderRadius: 25,
            background: "rgba(255,255,255,.055)",
            color: "#c1b9d6",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Go back to home
        </button>
      </div>
    </div>
  );
}

/* ── The shared motion pieces ─────────────────────────────────────────── */

/**
 * The 290x290 box every offset in every animation was measured against.
 *
 * `scale` zooms the whole thing as one transform rather than resizing it: the
 * coin's drop line, the slot glow and Sarah's contact circle are all absolute
 * pixel positions inside this box, so growing the box would leave them where
 * they were. The outer div carries the SCALED size so the column below it
 * still lays out correctly.
 */
function Stage({
  children,
  color,
  scale = 1,
}: {
  children: React.ReactNode;
  color?: string;
  scale?: number;
}) {
  const box = Math.round(STAGE * scale);
  return (
    <div
      style={{
        position: "relative",
        width: box,
        height: box,
        flexShrink: 0,
        color,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: STAGE,
          height: STAGE,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The reset clock, running.
 *
 * Counted off a deadline rather than by decrementing a number, so a
 * backgrounded tab does not leave the clock minutes behind where it should be.
 */
function ResetClock({ seconds }: { seconds: number }) {
  const [left, setLeft] = React.useState(seconds);

  React.useEffect(() => {
    const end = Date.now() + seconds * 1000;
    const id = window.setInterval(() => {
      setLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    }, 250);
    return () => window.clearInterval(id);
  }, [seconds]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const parts = [
    pad(Math.floor(left / 3600)),
    pad(Math.floor(left / 60) % 60),
    pad(left % 60),
  ];

  return (
    <div
      data-testid="fs_countdown"
      style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 7 }}
    >
      {parts.map((v, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span style={{ color: "#7d7595", fontSize: 16, fontWeight: 600 }}>:</span>
          )}
          <b
            className="tabular"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 40,
              height: 34,
              padding: "0 9px",
              borderRadius: 10,
              background: "rgba(255,255,255,.10)",
              color: "#fff",
              fontSize: 16.5,
              fontWeight: 700,
            }}
          >
            {v}
          </b>
        </React.Fragment>
      ))}
    </div>
  );
}

function Ground() {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 16,
        width: 170,
        height: 26,
        transform: "translateX(-50%)",
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,.4), rgba(0,0,0,0) 70%)",
        animation: "fs-groundBob 3.8s ease-in-out infinite",
      }}
    />
  );
}

function Float({
  children,
  animation,
}: {
  children: React.ReactNode;
  animation?: string;
}) {
  return <div style={{ position: "absolute", inset: 0, animation }}>{children}</div>;
}

function Art({ src, style }: { src: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url('${src}')`,
        backgroundPosition: "center",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        filter: "drop-shadow(0 16px 22px rgba(0,0,0,.32))",
        ...style,
      }}
    />
  );
}

/** A highlight travelling across the art, masked to its own silhouette. */
function Shine({ src }: { src: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundRepeat: "no-repeat",
        backgroundImage:
          "linear-gradient(115deg, transparent 42%, rgba(255,255,255,.24) 50%, transparent 58%)",
        backgroundSize: "260% 100%",
        animation: "fs-shine 6.5s ease-in-out infinite",
        mixBlendMode: "screen",
        WebkitMaskImage: `url('${src}')`,
        maskImage: `url('${src}')`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      }}
    />
  );
}

function Wave({ delay }: { delay?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        borderRadius: "50%",
        transform: "translate(-50%,-50%)",
        border: "2px solid currentColor",
        opacity: 0,
        animation: "fs-waveOut 2.6s ease-out infinite",
        animationDelay: delay,
      }}
    />
  );
}

function GlowDot({
  left,
  top,
  size,
  color,
}: {
  left: number;
  top: number;
  size: number;
  color: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        color,
        borderRadius: "50%",
        background: "radial-gradient(circle, currentColor 0%, transparent 66%)",
        opacity: 0,
        animation: "fs-glowPulse 2.8s ease-in-out infinite",
      }}
    />
  );
}

function Half({ side }: { side: "l" | "r" }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "url('/broke_float.png') center/contain no-repeat",
        filter: "drop-shadow(0 14px 20px rgba(0,0,0,.34))",
        clipPath: side === "l" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
        animation:
          side === "l"
            ? "fs-splitL 3.4s ease-in-out infinite"
            : "fs-splitR 3.4s ease-in-out infinite",
      }}
    />
  );
}

/**
 * Connection lost, drawn as the thing the user actually lost.
 *
 * The old art was a router on a shelf, which is a picture of hardware most
 * people do not own and none of them are looking at. What breaks in a dropped
 * call is the SIGNAL, so that is what is on screen: the arcs gutter out from
 * the outside in, the way bars really die, and a crack runs down through them.
 * Drawn rather than exported, so the break can move.
 */
function SignalBreak() {
  const arc = (r: number) => {
    const c = Math.cos((215 * Math.PI) / 180) * r;
    const y = 208 + Math.sin((215 * Math.PI) / 180) * r;
    return `M ${145 + c} ${y} A ${r} ${r} 0 0 1 ${145 - c} ${y}`;
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg
        viewBox="0 0 290 290"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          filter: "drop-shadow(0 14px 20px rgba(0,0,0,.34))",
          overflow: "visible",
        }}
      >
        <defs>
          <linearGradient id="fsSig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dcd2ff" />
            <stop offset="100%" stopColor="#8f7fe0" />
          </linearGradient>
          {/* The crack is a hole cut through every arc at once, so the gap
              lines up across all three the way a real break would. */}
          <mask id="fsBreak">
            <rect x="-40" y="-40" width="370" height="370" fill="#fff" />
            <polygon points="145,208 216,10 254,32" fill="#000" />
          </mask>
        </defs>

        <g
          mask="url(#fsBreak)"
          fill="none"
          stroke="url(#fsSig)"
          strokeWidth="16"
          strokeLinecap="round"
        >
          <path
            d={arc(124)}
            style={{ animation: "fs-arcOut 3.6s ease-in-out infinite" }}
          />
          <path
            d={arc(86)}
            style={{ animation: "fs-arcOut 3.6s ease-in-out .18s infinite" }}
          />
          <path d={arc(48)} />
        </g>
        <circle cx="145" cy="208" r="13" fill="url(#fsSig)" />

        {/* The break itself, lighting up on the beat the arcs drop out. */}
        <polyline
          points="206,88 203,114 176,128 180,159 162,174"
          fill="none"
          stroke="#f0736b"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            animation: "fs-breakFlash 3.6s ease-in-out infinite",
            filter: "drop-shadow(0 0 6px rgba(240,115,107,.9))",
          }}
        />
      </svg>
    </div>
  );
}

function PrimaryIcon({ kind }: { kind: FailureScreen["primaryIcon"] }) {
  if (kind === "call") return <CallIcon />;
  if (kind === "upgrade") return <UpgradeIcon />;
  return <RetryIcon />;
}

/**
 * The paywall icon.
 *
 * A refresh arrow on this button was a small lie: it says "try that again",
 * and the button opens a purchase. A sparkle is the one glyph the whole app
 * store agrees means "more, and it costs something", and it does not carry
 * the locked-out feeling a padlock does on a screen that is already a no.
 */
function UpgradeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.4c.3 0 .6.2.7.5l1.2 3.5a4 4 0 0 0 2.4 2.5l3.5 1.2c.7.2.7 1.2 0 1.4l-3.5 1.2a4 4 0 0 0-2.4 2.5l-1.2 3.5a.75.75 0 0 1-1.4 0l-1.2-3.5a4 4 0 0 0-2.5-2.5l-3.5-1.2a.75.75 0 0 1 0-1.4l3.5-1.2a4 4 0 0 0 2.5-2.5l1.2-3.5c.1-.3.4-.5.7-.5Z" />
      <path d="M18.6 2.1c.15 0 .28.1.33.24l.4 1.13c.1.28.3.5.6.6l1.13.4a.35.35 0 0 1 0 .66l-1.13.4c-.3.1-.5.32-.6.6l-.4 1.13a.35.35 0 0 1-.66 0l-.4-1.13a1 1 0 0 0-.6-.6l-1.13-.4a.35.35 0 0 1 0-.66l1.13-.4c.3-.1.5-.32.6-.6l.4-1.13a.35.35 0 0 1 .33-.24Z" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

function CallIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}
