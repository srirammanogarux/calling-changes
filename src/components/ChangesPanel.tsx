"use client";

import React from "react";
import { type SurveyStage } from "@/lib/memory";
import { FAILURE_SCREENS, failureScreen } from "./FailureScreens";
import { HISTORY_STATES, historyState, type HistoryStateKey } from "./HistoryScreen";

export const PANEL_WIDTH = 340;

/**
 * The picker. Two groups, because there are two changes: what the greeting
 * slot says, and what a failed call looks like.
 */
export function ChangesPanel({
  open,
  onToggle,
  section,
  setSection,
  greeting,
  setGreeting,
  surveyStage,
  setSurveyStage,
  failureKey,
  setFailureKey,
  historyKey,
  setHistoryKey,
  onReshuffle,
  lastStart,
}: {
  open: boolean;
  onToggle: () => void;
  section: "greeting" | "failure" | "history";
  setSection: (s: "greeting" | "failure" | "history") => void;
  greeting: "memory" | "static";
  setGreeting: (g: "memory" | "static") => void;
  surveyStage: SurveyStage;
  setSurveyStage: (s: SurveyStage) => void;
  failureKey: string;
  setFailureKey: (k: string) => void;
  historyKey: HistoryStateKey;
  setHistoryKey: (k: HistoryStateKey) => void;
  onReshuffle: () => void;
  lastStart: {
    promptId: string;
    topicKey: string;
    position?: "left" | "right";
    msToPick?: number;
  } | null;
}) {
  if (!open) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 60,
          padding: "10px 16px",
          borderRadius: 999,
          background: "#14121A",
          color: "#fff",
          border: "1px solid rgba(0,0,0,0.10)",
          boxShadow: "0 4px 14px rgba(16,16,24,0.18)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Changes ▸
      </button>
    );
  }

  return (
    <div
      className="no-bar"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: PANEL_WIDTH,
        zIndex: 60,
        overflowY: "auto",
        background: "#0d0c14",
        borderLeft: "1px solid rgba(255,255,255,0.10)",
        padding: 20,
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>Calling changes</div>
        <button onClick={onToggle} style={{ color: "rgba(255,255,255,0.5)" }}>
          ✕
        </button>
      </div>
      <div style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.5, marginBottom: 18 }}>
        Only the parts of the calling tab that are changing. The live call and
        the summary live in the full prototype.
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {(
          [
            ["greeting", "Greeting"],
            ["failure", "Failures"],
            ["history", "History"],
          ] as ["greeting" | "failure" | "history", string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setSection(k)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: 600,
              background: section === k ? "#A78BFA" : "rgba(255,255,255,0.08)",
              color: section === k ? "#1A1230" : "#fff",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "greeting" ? (
        <>
          <Section title="What the bubble says">
            <Radio
              checked={greeting === "static"}
              label="Static greeting (today's app)"
              hint="The same 17 words for everyone, forever. The control arm."
              onChange={() => setGreeting("static")}
            />
            <Radio
              checked={greeting === "memory"}
              label="Memory survey"
              hint="Asks which of two remembered topics they would rather talk about, banks the answer, then hands over to today's greeting. Personalises nothing yet, so it can ship before the memory pipeline exists."
              onChange={() => setGreeting("memory")}
            />
          </Section>

          {greeting === "memory" && (
            <>
              <Section title="Survey stage">
                <div style={{ display: "flex", gap: 6 }}>
                  {(
                    [
                      ["asking", "Asking"],
                      ["answered", "Answered"],
                      ["settled", "Later"],
                    ] as [SurveyStage, string][]
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setSurveyStage(k)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          surveyStage === k ? "#A78BFA" : "rgba(255,255,255,0.08)",
                        color: surveyStage === k ? "#1A1230" : "#fff",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div style={hintStyle}>
                  While the question is up, History and the talktime pill are
                  gone. Neither belongs to what is being asked, and &ldquo;12
                  min left&rdquo; beside a survey is the moment someone wonders
                  whether answering costs them minutes. Both fade back in once
                  the answer is banked.
                </div>
                <div style={hintStyle}>
                  Answered keeps the promise under the bubble. Later is a
                  session or two on, and also where Not now lands: the tag is
                  gone and the screen is today&rsquo;s app again. Cadence in the
                  real thing is every four to seven calls, drawn at random, and
                  a skip should back that off rather than reset it.
                </div>
              </Section>

              <button
                onClick={onReshuffle}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.08)",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Replay / reshuffle
              </button>
              <div style={hintStyle}>
                Which topic sits left is drawn per session and rides the
                answer, so neither is permanently the understudy and the result
                is not a reading of our own layout. A and B name the SLOT, not
                the topic: A is whatever is on the left this time.
              </div>

              <div style={{ marginTop: 16 }}>
                <Row k="answer" v={lastStart?.topicKey ?? "—"} />
                <Row k="prompt_id" v={lastStart?.promptId ?? "—"} />
                <Row k="position" v={lastStart?.position ?? "—"} />
                <Row
                  k="time to answer"
                  v={
                    lastStart?.msToPick !== undefined
                      ? `${(lastStart.msToPick / 1000).toFixed(1)}s`
                      : "—"
                  }
                />
              </div>
            </>
          )}
        </>
      ) : section === "failure" ? (
        <Section title="Failure screen">
          {FAILURE_SCREENS.map((s, i) => (
            <Radio
              key={s.key}
              checked={failureKey === s.key}
              label={`${String(i + 1).padStart(2, "0")} · ${s.title}`}
              hint={s.note}
              onChange={() => setFailureKey(s.key)}
            />
          ))}
          <div style={{ marginTop: 12 }}>
            <Row k="replaces" v={failureScreen(failureKey).reason} />
          </div>
          <div style={hintStyle}>
            Same art, same motion library and same copy as the approved
            failure-states build. Only the frame changed: these sit in the
            device the rest of the prototype uses, so a failure can be seen
            next to the screen it interrupts.
          </div>
        </Section>
      ) : (
        <Section title="Recent Calls">
          {HISTORY_STATES.map((h) => (
            <Radio
              key={h.key}
              checked={historyKey === h.key}
              label={h.label}
              hint={h.hint}
              onChange={() => setHistoryKey(h.key)}
            />
          ))}
          <div style={{ marginTop: 12 }}>
            <Row k="bloc state" v={historyState(historyKey).replaces} />
          </div>
          <div style={hintStyle}>
            The redesign&rsquo;s argument is that TIME leads the row. The list
            used to open with the award, which reads as a scoreboard; here the
            date is the headline, the duration sits under it, and the stars are
            a small right-hand lane. Sections carry their own talk total.
          </div>
          <div style={hintStyle}>
            Not drawn in Paper, and still live in the bloc: loading-more,
            backfilling (legacy rows still merging in) and backfill-stalled.
            All three are footers under a readable list.
          </div>
        </Section>
      )}
    </div>
  );
}


const hintStyle: React.CSSProperties = {
  marginTop: 8,
  color: "rgba(255,255,255,0.42)",
  lineHeight: 1.5,
  fontSize: 12,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.40)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Radio({
  checked,
  label,
  hint,
  onChange,
}: {
  checked: boolean;
  label: string;
  hint: string;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "9px 10px",
        marginBottom: 6,
        borderRadius: 8,
        background: checked ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${checked ? "#A78BFA" : "rgba(255,255,255,0.10)"}`,
      }}
    >
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div
        style={{
          fontSize: 11.5,
          color: "rgba(255,255,255,0.45)",
          marginTop: 3,
          lineHeight: 1.45,
        }}
      >
        {hint}
      </div>
    </button>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
      <span style={{ color: "rgba(255,255,255,0.45)" }}>{k}</span>
      <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{v}</span>
    </div>
  );
}
