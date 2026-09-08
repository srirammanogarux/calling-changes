"use client";

import React, { useEffect, useState } from "react";
import { FRAME, frame as F } from "@/lib/theme";

/**
 * The 412x917 design frame the app is authored against (flutter_screenutil),
 * dressed as a device and scaled to fit the window with one transform — which
 * is what lets every component inside use design px directly, exactly as the
 * Dart theme does.
 *
 * The device chrome is not decoration: the status bar and the home indicator
 * eat real estate on a phone, so the screens are inset by [F.safeTop] and
 * [F.safeBottom] here rather than being drawn edge to edge in a browser and
 * discovering the collision on device.
 */

const BEZEL = 11;
const DEVICE_W = FRAME.width + BEZEL * 2;
const DEVICE_H = FRAME.height + BEZEL * 2;

export function PhoneFrame({
  children,
  reserveRight = 0,
}: {
  children: React.ReactNode;
  /** Width taken by the director panel, so the phone stays centred beside it. */
  reserveRight?: number;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth - reserveRight;
      const h = window.innerHeight;
      const pad = w < 760 ? 16 : 72;
      setScale(Math.min((w - pad) / DEVICE_W, (h - pad) / DEVICE_H));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [reserveRight]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        right: reserveRight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        // Plain white behind the device. The screen is the only dark thing in
        // frame, which is what a mockup wants — nothing competes with it, and
        // it drops straight into a deck or a doc.
        background: "#FFFFFF",
      }}
    >
      <div
        style={{
          width: DEVICE_W,
          height: DEVICE_H,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          position: "relative",
          flex: "0 0 auto",
          borderRadius: 58,
          padding: BEZEL,
          // Titanium-ish edge: a dark body, a light hairline catching the
          // light at the top, and a long soft shadow underneath.
          background: "linear-gradient(160deg, #3a3a40 0%, #17171b 22%, #101014 78%, #35353b 100%)",
          // Re-weighted for a light ground: a soft contact shadow plus a wide
          // ambient one. The heavy black glow that worked on a dark stage
          // reads as dirt on white.
          boxShadow:
            "0 24px 48px rgba(16,16,24,0.18), 0 4px 12px rgba(16,16,24,0.12), 0 2px 0 rgba(255,255,255,0.10) inset, 0 0 0 1px rgba(0,0,0,0.35)",
        }}
      >
        <div
          data-testid="cv3_screen"
          style={{
            position: "relative",
            width: FRAME.width,
            height: FRAME.height,
            borderRadius: 47,
            overflow: "hidden",
            background: "#0A0911",
          }}
        >
          {children}
          <StatusBar />
          <DynamicIsland />
          <HomeIndicator />
        </div>
      </div>
    </div>
  );
}

/** Time left, radios right — sitting in the [F.safeTop] band every screen leaves free. */
function StatusBar() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: F.safeTop,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          color: "#fff",
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: 0.2,
          width: 90,
        }}
      >
        9:41
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Signal */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="#fff">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        {/* Wi-Fi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="#fff">
          <path d="M8 11.2 5.6 8.6a3.4 3.4 0 0 1 4.8 0z" />
          <path
            d="M2.9 5.7a7.4 7.4 0 0 1 10.2 0"
            fill="none"
            stroke="#fff"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M0.9 3.1a10.6 10.6 0 0 1 14.2 0"
            fill="none"
            stroke="#fff"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect
            x="0.6"
            y="0.6"
            width="21"
            height="10.8"
            rx="3"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.45"
            strokeWidth="1.2"
          />
          <rect x="2.4" y="2.4" width="17.4" height="7.2" rx="1.8" fill="#fff" />
          <path d="M23.2 4.2v3.6a2 2 0 0 0 0-3.6z" fill="#fff" fillOpacity="0.45" />
        </svg>
      </div>
    </div>
  );
}

function DynamicIsland() {
  return (
    <div
      style={{
        position: "absolute",
        top: 13,
        left: "50%",
        transform: "translateX(-50%)",
        width: 122,
        height: 35,
        borderRadius: 999,
        background: "#000",
        pointerEvents: "none",
        zIndex: 51,
      }}
    />
  );
}

function HomeIndicator() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 9,
        left: "50%",
        transform: "translateX(-50%)",
        width: 138,
        height: 5,
        borderRadius: 999,
        background: "rgba(255,255,255,0.55)",
        pointerEvents: "none",
        zIndex: 51,
      }}
    />
  );
}
