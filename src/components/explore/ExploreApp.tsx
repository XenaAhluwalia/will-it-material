"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import type { MaterialSuggestion } from "@/types/material";
import type { ScreeningResult, TestRequest } from "@/types/screening";
import type { Doodle } from "@/types/doodle";
import { describeConditions, retestRequest, runScreening, type Setup } from "@/lib/screening";
import { fetchDoodle } from "@/lib/doodle/client";
import { TestForm } from "@/components/form/TestForm";
import { TestChamber } from "@/components/chamber/TestChamber";
import { ResultSummary } from "@/components/results/ResultSummary";
import { CriterionCard } from "@/components/results/CriterionCard";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { ComparisonView } from "@/components/results/ComparisonView";
import { ObjectDoodle } from "@/components/doodle/ObjectDoodle";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Brand } from "@/components/ui/Brand";

interface Run {
  id: number;
  result: ScreeningResult;
  /** The run this one replaced via "Test this material", for comparison. */
  previous: ScreeningResult | null;
}

/** What we're waiting on: a fresh test from the form, or a re-test of an alternative. */
type Pending = { material: string; fromForm: boolean } | null;

export function ExploreApp({ suggestions, initial }: { suggestions: MaterialSuggestion[]; initial: Setup }) {
  const [setup, setSetup] = useState<Setup>(initial);
  const [run, setRun] = useState<Run | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [formKey, setFormKey] = useState(0);
  // undefined while sketching, null when there's no sketch.
  const [doodle, setDoodle] = useState<Doodle | null | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const doodleFor = useRef("");

  const start = async (req: TestRequest, previous: ScreeningResult | null) => {
    abortRef.current?.abort();
    const ctrl = (abortRef.current = new AbortController());
    setPending({ material: req.material, fromForm: !previous });
    setError(null);
    if (!previous) {
      const key = req.component.toLowerCase();
      if (doodleFor.current !== key) setDoodle(undefined);
      doodleFor.current = key;
      fetchDoodle(req.component, req.material).then((d) => {
        if (doodleFor.current === key) setDoodle(d);
      });
    }
    try {
      const result = await runScreening(req, ctrl.signal);
      setRun((r) => ({ id: (r?.id ?? 0) + 1, result, previous }));
      setRevealed(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      if (abortRef.current === ctrl) setPending(null);
    }
  };

  const submitSetup = (s: Setup) => {
    setSetup(s);
    start({ component: s.component, material: s.material, conditions: describeConditions(s) }, null);
  };

  const onChamberDone = useCallback(() => setRevealed(true), []);
  const tryAnother = () => {
    abortRef.current?.abort();
    setPending(null);
    setError(null);
    setRun(null);
    setFormKey((k) => k + 1);
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3 py-6">
          <Brand />
          <Disclaimer compact />
        </header>

        <AnimatePresence mode="wait">
          {pending?.fromForm ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GettingReady material={pending.material} component={setup.component} doodle={doodle} />
            </motion.div>
          ) : !run ? (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <h1 className="ink-texture mb-1 font-display text-4xl sm:text-5xl">What should we test?</h1>
              <p className="mb-6 text-lg text-soft">Pick a thing, say what it&apos;s made of, then decide how rough its life gets.</p>
              <TestForm key={formKey} suggestions={suggestions} initial={setup} error={error} onSubmit={submitSetup} />
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="ink-texture font-display text-4xl sm:text-5xl">Here&apos;s how it went</h1>
                <button onClick={tryAnother} className="btn bg-paper-raised px-5 py-2 text-lg text-ink">
                  Test something else
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:items-start">
                <TestChamber key={run.id} result={run.result} onComplete={onChamberDone} />
                {revealed ? (
                  <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
                    <ResultSummary result={run.result} doodle={doodle} />
                  </motion.div>
                ) : (
                  <Waiting />
                )}
              </div>

              {revealed && (
                <>
                  {error && (
                    <p role="alert" className="card px-4 py-3 text-sm text-soft ring-1 ring-fail/25">
                      <span className="font-semibold text-fail">Re-test failed.</span> {error}
                    </p>
                  )}
                  {run.result.alternatives.length > 0 ? (
                    <RecommendationCard
                      result={run.result}
                      pendingMaterial={pending?.material ?? null}
                      onTest={(name) => start(retestRequest(run.result, name), run.result)}
                    />
                  ) : (
                    run.result.overallStatus !== "PASS" && (
                      <p className="card px-4 py-3 text-sm text-soft">
                        No clearly better material came up for these conditions. Try going easier on it.
                      </p>
                    )
                  )}

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {run.result.criteria.map((c, i) => (
                      <CriterionCard key={c.id} criterion={c} index={i} />
                    ))}
                  </div>

                  {run.previous && <ComparisonView original={run.previous} recommended={run.result} />}

                  <p className="text-center text-xs text-muted">Scored by {run.result.model}. AI estimates can be wrong, so double-check before you build anything real.</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}

function Waiting() {
  return (
    <div className="card grid min-h-[300px] place-items-center p-4 text-center">
      <div>
        <Spinner />
        <p className="mt-4 font-display text-xl text-ink">Running tests…</p>
        <p className="text-sm text-muted">Your score shows up when the chamber finishes.</p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <motion.div
      className="mx-auto size-12 rounded-full border-4 border-iris-soft border-t-iris"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

const STEPS = ["Reading your setup", "Looking up the material", "Picking the tests that matter", "Scoring each test"];

function GettingReady({ material, component, doodle }: { material: string; component: string; doodle: Doodle | null | undefined }) {
  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center gap-4 p-8 text-center" aria-live="polite">
      <ObjectDoodle doodle={doodle} name={component} size={150} />
      {doodle === null && <Spinner />}
      <div>
        <p className="ink-texture font-display text-3xl">Getting the lab ready</p>
        <p className="mt-1 text-soft">
          {component} made of {material}
        </p>
      </div>
      <ul className="w-full max-w-xs space-y-1.5 text-left text-sm text-muted">
        {STEPS.map((s, i) => (
          <motion.li key={s} initial={{ opacity: 0.25 }} animate={{ opacity: 1 }} transition={{ delay: i * 2.5, duration: 0.6 }}>
            <span aria-hidden className="mr-2 text-iris">•</span>
            {s}
          </motion.li>
        ))}
      </ul>
      <p className="text-xs text-muted">Usually takes 10 to 30 seconds.</p>
    </div>
  );
}
