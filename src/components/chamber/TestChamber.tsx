"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import type { ScreeningResult } from "@/types/screening";
import { STATUS_STYLE } from "@/components/ui/status";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Specimen } from "./Specimen";
import { STAGE_BACKDROP, StageEffects, VerdictBadge } from "./StageEffects";
import { getReaction, pressDepth } from "./reactions";

type Phase = "enter" | "react" | "verdict";
const DURATION: Record<Phase, number> = { enter: 900, react: 1500, verdict: 1100 };

interface Props {
  result: ScreeningResult;
  onComplete?: () => void;
}

/**
 * Cartoon test chamber. Walks the specimen through each test the screening chose and plays a
 * reaction based on each stage's screening verdict. Purely illustrative.
 */
export function TestChamber({ result, onComplete }: Props) {
  const stages = result.stages;
  const [pos, setPos] = useState<{ i: number; phase: Phase }>({ i: 0, phase: "enter" });
  const done = pos.i >= stages.length;
  const completedRef = useRef(false);
  // Optional, user-controlled compact view once the run has finished.
  const [collapsed, setCollapsed] = useState(false);
  const bodyId = useId();
  const showCompact = done && collapsed;

  useEffect(() => {
    if (done) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return;
    }
    const t = setTimeout(() => {
      setPos((p) =>
        p.phase === "enter" ? { ...p, phase: "react" } : p.phase === "react" ? { ...p, phase: "verdict" } : { i: p.i + 1, phase: "enter" },
      );
    }, DURATION[pos.phase]);
    return () => clearTimeout(t);
  }, [pos, done, onComplete]);

  const skip = () => setPos({ i: stages.length, phase: "verdict" });
  const replay = () => {
    setCollapsed(false);
    setPos({ i: 0, phase: "enter" });
  };

  // When finished, keep showing the worst stage as the "final pose".
  const shownIndex = done ? worstStageIndex(result) : pos.i;
  const stage = stages[shownIndex];
  const phase: Phase = done ? "verdict" : pos.phase;
  const reacting = phase !== "enter";
  const reaction = getReaction(stage.visual, stage.status, reacting);
  const material = result.material;

  return (
    <section className="card overflow-hidden p-4" aria-label="Animated test chamber">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="relative flex size-3">
            {!done && <span className="absolute inline-flex size-full animate-ping rounded-full bg-fail opacity-70" />}
            <span className={`relative inline-flex size-3 rounded-full ${done ? "bg-pass" : "bg-fail"}`} />
          </span>
          <h2 className="min-w-0 font-display text-lg text-ink">
            {done ? "Test complete: " : "Testing "}
            <span className="italic">{material.name}</span>
            {done ? "" : "…"}
          </h2>
        </div>
        <div className="flex gap-2">
          {done && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
              aria-controls={bodyId}
              className="btn bg-paper-raised px-4 py-1 text-base text-ink"
            >
              {collapsed ? "▾ Expand" : "▴ Collapse"}
            </button>
          )}
          {done ? (
            <button onClick={replay} className="btn bg-paper-raised px-4 py-1 text-base text-ink">
              ↻ Replay
            </button>
          ) : (
            <button onClick={skip} className="btn bg-paper-raised px-4 py-1 text-base text-ink">
              Skip
            </button>
          )}
        </div>
      </div>

      {showCompact ? (
        <CompactSummary id={bodyId} result={result} />
      ) : (
        <div id={bodyId}>
          {/* Chamber window */}
          <motion.div
            className="relative h-[300px] overflow-hidden rounded-[1.25rem] border-[3px] border-chamber shadow-[inset_0_0_80px_rgb(0_0_0/0.45)] sm:h-[330px]"
            animate={{ background: STAGE_BACKDROP[stage.visual] }}
            transition={{ duration: 0.6 }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={stage.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StageEffects stage={stage.visual} intensity={!reacting ? 0 : stage.status === "FAIL" ? 2 : 1} />
              </motion.div>
            </AnimatePresence>

            {/* window glare + rivets */}
            <div className="pointer-events-none absolute inset-x-8 top-3 h-2 rounded-full bg-ink/8" />
            {["left-3 top-3", "right-3 top-3", "left-3 bottom-3", "right-3 bottom-3"].map((c) => (
              <span key={c} className={`absolute ${c} size-2 rounded-full bg-white/20`} />
            ))}

            {/* Stage title */}
            <div className="absolute left-1/2 top-5 z-20 max-w-[85%] -translate-x-1/2 truncate whitespace-nowrap rounded-full bg-chamber-deep/70 px-4 py-1 font-display text-base italic text-paper-raised backdrop-blur">
              {stage.label}
            </div>

            {/* Specimen lane */}
            <div className="absolute inset-x-0 bottom-[11%] flex justify-center">
              <motion.div
                key={done ? "final" : `${stage.id}-${pos.i}`}
                initial={done ? false : { x: -360 }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 16 }}
                className="relative flex flex-col items-center"
              >
                {/* Hydraulic press for the stress stage */}
                {stage.visual === "stress" && (
                  <motion.div
                    className="absolute bottom-[calc(100%-26px)] left-1/2 flex -translate-x-1/2 flex-col items-center"
                    initial={{ y: -160 }}
                    animate={{ y: reacting ? pressDepth(stage.status) : -120 }}
                    transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  >
                    <div className="h-40 w-5 bg-gradient-to-b from-slate-500 to-slate-300" />
                    <div className="h-6 w-36 rounded-lg bg-gradient-to-b from-slate-300 to-slate-500 shadow-lg" />
                  </motion.div>
                )}

                {/* Verdict, beside the specimen so it never covers the stage title or the specimen. */}
                <div className="absolute -right-16 top-0 z-10">
                  <AnimatePresence>{phase === "verdict" && <VerdictBadge key={`${stage.id}-v`} status={stage.status} />}</AnimatePresence>
                </div>

                {/*
                  On an overall fail, the final pose faints onto its side: it pivots on the body's
                  bottom-left corner (so it stays on the floor) and slides back to the centre.
                */}
                <motion.div
                  animate={done && result.overallStatus === "FAIL" ? { rotate: -90, x: 100 } : { rotate: 0, x: 0 }}
                  transition={{ delay: done ? 0.4 : 0, type: "spring", stiffness: 110, damping: 12 }}
                  style={{ originX: 0.1, originY: 0.87 }}
                >
                  <motion.div
                    key={`${stage.id}-${reacting}-${done}`}
                    animate={reaction.animate}
                    style={{ originY: 1 }}
                  >
                    <Specimen color={material.color} accent={material.accent} finish={material.finish} look={reaction.look} size={140} />
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>

            {/* Conveyor */}
            <div className="absolute inset-x-0 bottom-0 h-[10%] overflow-hidden bg-chamber-deep/90">
              <motion.div
                className="h-full w-[200%]"
                style={{ backgroundImage: "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.12) 0 20px, transparent 20px 40px)" }}
                animate={{ x: done ? 0 : ["0%", "-50%"] }}
                transition={{ duration: 6, repeat: done ? 0 : Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>

          {/* Caption */}
          <div className="mt-3 flex min-h-[2.5rem] items-center justify-center text-center" aria-live="polite">
            <AnimatePresence mode="wait">
              {phase === "verdict" && (
                <motion.p
                  key={`${stage.id}-${done}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`font-display text-lg ${STATUS_STYLE[stage.status].text}`}
                >
                  {done ? finalCaption(result) : stage.caption}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Stage track */}
          <ol className="mt-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
            {stages.map((s, idx) => {
              const revealed = done || idx < pos.i || (idx === pos.i && pos.phase === "verdict");
              const current = !done && idx === pos.i;
              const st = STATUS_STYLE[s.status];
              return (
                <li
                  key={s.id}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center transition ${current ? "bg-ink/8 ring-1 ring-iris/60" : "bg-ink/5"}`}
                >
                  <span className="font-display text-sm italic text-muted sm:hidden" aria-hidden>
                    {idx + 1}
                  </span>
                  <span className="hidden text-xs font-semibold leading-tight text-soft [overflow-wrap:anywhere] line-clamp-2 sm:block">{s.label}</span>
                  <span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${revealed ? `${st.bg} ${st.text}` : "bg-ink/5 text-muted"}`}>
                    {revealed ? st.icon : "·"}
                  </span>
                  <span className="sr-only">{revealed ? `${s.label}: ${s.status}` : `${s.label}: pending`}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-center font-display text-sm italic text-muted">Illustrative, not a simulation</p>
        </div>
      )}
    </section>
  );
}

/** Compact, collapsed view of a finished run: stage count, per-stage results and the final verdict. */
function CompactSummary({ id, result }: { id: string; result: ScreeningResult }) {
  const count = (st: string) => result.stages.filter((s) => s.status === st).length;
  const parts = [`${count("PASS")} passed`, `${count("WARNING")} warning${count("WARNING") === 1 ? "" : "s"}`, `${count("FAIL")} failed`];
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 rounded-2xl bg-ink/5 px-3 py-2.5"
    >
      <Specimen
        color={result.material.color}
        accent={result.material.accent}
        finish={result.material.finish}
        look={{ mood: result.overallStatus === "PASS" ? "happy" : result.overallStatus === "WARNING" ? "worried" : "dizzy" }}
        size={48}
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm text-ink">
          {result.stages.length} of {result.stages.length} stages complete
        </p>
        <p className="text-sm text-muted">{parts.join(" · ")}</p>
      </div>
      <ol className="flex gap-1.5" aria-label="Stage results">
        {result.stages.map((s) => (
          <li key={s.id} className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${STATUS_STYLE[s.status].bg} ${STATUS_STYLE[s.status].text}`}>
            <span aria-hidden>{STATUS_STYLE[s.status].icon}</span>
            <span className="sr-only">{`${s.label}: ${s.status}`}</span>
          </li>
        ))}
      </ol>
      <StatusBadge status={result.overallStatus} />
    </motion.div>
  );
}

function worstStageIndex(result: ScreeningResult): number {
  const rank = { PASS: 0, WARNING: 1, FAIL: 2 } as const;
  let best = 0;
  result.stages.forEach((s, i) => {
    if (rank[s.status] > rank[result.stages[best].status]) best = i;
  });
  return best;
}

function finalCaption(result: ScreeningResult): string {
  if (result.overallStatus === "PASS") return "Nailed it. Every test passed!";
  const worst = result.stages[worstStageIndex(result)];
  if (worst.status === "PASS") {
    return `Survived every test, but ${result.limiting?.label.toLowerCase() ?? "one criterion"} holds it back.`;
  }
  return result.overallStatus === "FAIL"
    ? `Struggled most in the ${worst.label.toLowerCase()} test.`
    : `Made it through, with some wobbles in the ${worst.label.toLowerCase()} test.`;
}
