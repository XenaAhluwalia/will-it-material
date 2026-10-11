"use client";

import { motion } from "framer-motion";
import type { ScreeningResult } from "@/types/screening";
import { Specimen } from "@/components/chamber/Specimen";
import { statusFromScore } from "@/lib/screening/scoring";
import { STATUS_STYLE } from "@/components/ui/status";

interface Props {
  result: ScreeningResult;
  /** Material currently being re-tested, if any. */
  pendingMaterial: string | null;
  onTest: (material: string) => void;
}

export function RecommendationCard({ result, pendingMaterial, onTest }: Props) {
  const [top, ...others] = result.alternatives;
  const passed = result.overallStatus === "PASS";
  const busy = pendingMaterial !== null;

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="card relative overflow-hidden p-4"
      aria-labelledby="try-instead"
    >
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <motion.div
          className="mx-auto shrink-0 sm:mx-0"
          animate={{ y: [0, -8, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <Specimen color={top.color} accent="#ffffff" finish="gloss" look={{ mood: "happy" }} size={96} />
        </motion.div>
        <div className="flex-1">
          <p id="try-instead" className="font-display text-lg italic text-ink"><span className="marker">
            {passed ? "Also worth a look" : "Try this instead"}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h3 className="ink-texture font-display text-3xl">{top.name}</h3>
            <Estimate score={top.estimatedScore} />
          </div>
          <p className="text-sm text-muted">{top.family}</p>
          <ul className="mt-2 space-y-1">
            {top.reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-soft">
                <span className="mt-0.5 text-pass" aria-hidden>
                  ✓
                </span>
                {r}
              </li>
            ))}
            {top.tradeoff && (
              <li className="flex items-start gap-2 text-sm text-muted">
                <span className="mt-0.5" aria-hidden>
                  ~
                </span>
                Trade-off: {top.tradeoff}
              </li>
            )}
          </ul>
        </div>
        <TestButton name={top.name} pending={pendingMaterial === top.name} disabled={busy} onTest={onTest} primary />
      </div>

      {others.length > 0 && (
        <div className="relative mt-4 border-t border-sand pt-3">
          <p className="mb-2 font-display italic text-muted">Other options</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {others.map((a) => (
              <li key={a.name} className="flex items-center gap-3 rounded-2xl bg-ink/5 px-3 py-2.5">
                <span aria-hidden className="size-4 shrink-0 rounded-md" style={{ background: a.color }} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    {a.name} <Estimate score={a.estimatedScore} />
                  </span>
                  <span className="block text-sm text-muted">{a.reasons[0]}</span>
                </span>
                <TestButton name={a.name} pending={pendingMaterial === a.name} disabled={busy} onTest={onTest} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
}

function Estimate({ score }: { score: number }) {
  return <span className={`text-sm font-semibold ${STATUS_STYLE[statusFromScore(score)].text}`}>Est. ~{score}/100</span>;
}

function TestButton({
  name,
  pending,
  disabled,
  primary,
  onTest,
}: {
  name: string;
  pending: boolean;
  disabled: boolean;
  primary?: boolean;
  onTest: (name: string) => void;
}) {
  return (
    <button
      onClick={() => onTest(name)}
      disabled={disabled}
      aria-label={`Test ${name}`}
      className={
        primary
          ? "btn shrink-0 bg-iris px-6 py-3 text-lg text-paper-raised"
          : "btn shrink-0 bg-paper-raised px-4 py-1 text-base text-ink"
      }
    >
      {pending ? "Testing…" : primary ? "Test this material" : "Test"}
    </button>
  );
}
