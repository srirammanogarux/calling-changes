"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ChangesPanel, PANEL_WIDTH } from "@/components/ChangesPanel";
import { HomeScreen, type BalanceState } from "@/components/HomeScreen";
import { FailureScreenView, failureScreen } from "@/components/FailureScreens";
import { HistoryScreen, type HistoryStateKey } from "@/components/HistoryScreen";
import type { SurveyStage } from "@/lib/memory";
import type { HomeGate } from "@/lib/types";

/**
 * calling-changes: only the parts of the calling tab that are actually
 * changing.
 *
 * Three groups, nothing else. The GREETING SLOT (today's static line as the
 * control, then the four memory-opener versions and every state inside them),
 * the FAILURE SCREENS, and RECENT CALLS. The live call and the summary sit in
 * the full prototype; putting them here would bury the changes in a flow
 * nobody is being asked to review.
 */

type Section = "greeting" | "failure" | "history";

const BALANCE: BalanceState = {
  kind: "loaded",
  remainingS: 12 * 60,
  tooltip: "You get 15 minutes of calling every day. Resets at midnight.",
};

/** Entitled, so the greeting slot is what the screen is about. */
const GATE: HomeGate = {
  canStart: true,
  hasPremium: true,
  isHardPaywallLocked: false,
  hasPaywallDecision: false,
};

export default function Page() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [section, setSection] = useState<Section>("greeting");

  const [greeting, setGreeting] = useState<"memory" | "static">("memory");
  const [memoryLayout, setMemoryLayout] = useState<
    "bubble" | "cards" | "stack" | "survey"
  >("bubble");
  const [memorySetKey, setMemorySetKey] = useState("fresh");
  const [surveyStage, setSurveyStage] = useState<SurveyStage>("asking");
  const [failureKey, setFailureKey] = useState("no_talktime");
  const [historyKey, setHistoryKey] = useState<HistoryStateKey>("loaded");

  const [memoryNonce, setMemoryNonce] = useState(0);
  const redraw = useCallback(
    () => setMemoryNonce(Math.floor(Math.random() * 1000)),
    [],
  );
  useEffect(() => {
    // First draw client-side only: a random value in the initial render is a
    // hydration mismatch.
    const id = window.setTimeout(redraw, 0);
    return () => window.clearTimeout(id);
  }, [redraw]);

  const [lastStart, setLastStart] = useState<{
    promptId: string;
    topicKey: string;
    position?: "left" | "right" | "top" | "bottom";
    msToPick?: number;
  } | null>(null);

  /** Every switch redraws, so each version plays from its first beat and no
   *  choice is carried over from the one before it. */
  const pickLayout = useCallback(
    (l: "bubble" | "cards" | "stack" | "survey") => {
      setMemoryLayout(l);
      setSurveyStage("asking");
      redraw();
    },
    [redraw],
  );
  const pickSet = useCallback(
    (k: string) => {
      setMemorySetKey(k);
      redraw();
    },
    [redraw],
  );

  // "Still being written" is a wait, not a screen: it resolves on its own.
  useEffect(() => {
    if (memorySetKey !== "pending") return;
    const id = window.setTimeout(() => {
      setMemorySetKey("fresh");
      redraw();
    }, 4500);
    return () => window.clearTimeout(id);
  }, [memorySetKey, memoryNonce, redraw]);

  return (
    <>
      <PhoneFrame reserveRight={panelOpen ? PANEL_WIDTH : 0}>
        {section === "greeting" ? (
          <HomeScreen
            key={`home-${memoryNonce}`}
            balance={BALANCE}
            gate={GATE}
            memoryOpener={greeting === "memory"}
            memoryLayout={memoryLayout}
            memorySetKey={memorySetKey}
            surveyStage={surveyStage}
            onSurveyAnswer={setSurveyStage}
            memoryNonce={memoryNonce}
            onStartAttributed={setLastStart}
            onStart={() => {}}
            onHistory={() => {}}
            onUpgrade={() => {}}
            onWhatsApp={() => {}}
          />
        ) : section === "failure" ? (
          <FailureScreenView screen={failureScreen(failureKey)} />
        ) : (
          <HistoryScreen key={historyKey} state={historyKey} />
        )}
      </PhoneFrame>

      <ChangesPanel
        open={panelOpen}
        onToggle={() => setPanelOpen((o) => !o)}
        section={section}
        setSection={setSection}
        greeting={greeting}
        setGreeting={setGreeting}
        memoryLayout={memoryLayout}
        setMemoryLayout={pickLayout}
        memorySetKey={memorySetKey}
        setMemorySetKey={pickSet}
        surveyStage={surveyStage}
        setSurveyStage={setSurveyStage}
        failureKey={failureKey}
        setFailureKey={setFailureKey}
        historyKey={historyKey}
        setHistoryKey={setHistoryKey}
        onReshuffle={redraw}
        lastStart={lastStart}
      />
    </>
  );
}
