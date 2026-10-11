"use client";

import { motion } from "framer-motion";
import type { ScreeningResult } from "@/types/screening";
import type { Doodle } from "@/types/doodle";
import { ObjectDoodle } from "@/components/doodle/ObjectDoodle";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { StatusBadge } from "@/components/ui/StatusBadge";

const VERDICT_TEXT = {
  PASS: "Looks like it'll hold up!",
  WARNING: "Could work, with some care",
  FAIL: "Probably not gonna make it",
} as const;

const MOOD = { PASS: "happy", WARNING: "worried", FAIL: "dizzy" } as const;

export function ResultSummary({ result, doodle }: { result: ScreeningResult; doodle?: Doodle | null }) {
  const passed = result.overallStatus === "PASS";
  return (
    <section className="card relative flex h-full flex-col items-center gap-3 p-4 text-center">
      {doodle && <ObjectDoodle doodle={doodle} name={result.request.component} mood={MOOD[result.overallStatus]} size={112} />}
      <div>
        <p className="font-display italic text-muted">{result.request.component}</p>
        <h2 className="mt-1 flex items-center justify-center gap-2 font-display text-3xl text-ink">
          <span aria-hidden className="size-4 shrink-0 rounded-md" style={{ background: result.material.color }} />
          {result.material.name}
        </h2>
        <p className="text-sm text-muted">{result.material.family}</p>
      </div>
      <div className="relative">
        <ScoreGauge score={result.overallScore} size={148} />
        {passed && <Celebration colors={[result.material.color, "#c4c1ef", "#e6c27a", "#9cc9ae", "#f2c4a8"]} />}
      </div>
      <div className="flex flex-col items-center gap-1">
        <StatusBadge status={result.overallStatus} size="lg" />
        <p className="font-display text-lg italic text-ink">{VERDICT_TEXT[result.overallStatus]}</p>
      </div>

      {/* Main reason, in plain language */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full rounded-2xl bg-ink/5 px-3 py-2.5 text-left text-[15px] leading-snug text-soft"
      >
        {result.mainReason}
      </motion.p>

      {result.limiting && result.overallStatus !== "PASS" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full rounded-2xl border-l-2 border-fail bg-fail/8 px-3 py-2 text-left text-sm"
        >
          <span className="block text-sm text-fail">Main limiting property</span>
          <span className="font-display text-base text-ink">{result.limiting.property}</span>
        </motion.div>
      )}

      <details className="w-full rounded-2xl bg-ink/5 px-3 py-2 text-left text-sm text-soft">
        <summary className="cursor-pointer select-none font-semibold text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2">
          How we understood your setup
        </summary>
        <p className="mt-2 leading-relaxed">{result.interpretation}</p>
        {result.assumptions.length > 0 && (
          <ul className="mt-2 space-y-1 text-muted">
            {result.assumptions.map((a) => (
              <li key={a}>• {a}</li>
            ))}
          </ul>
        )}
      </details>

      <ul className="mt-auto flex flex-wrap justify-center gap-1.5">
        {result.conditionTags.map((c) => (
          <li key={c} className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-soft">
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A small burst of tiny material blocks from behind the score. Purely for fun. */
function Celebration({ colors }: { colors: string[] }) {
  const bits = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2 + (i % 3) * 0.2;
    const dist = 80 + (i % 4) * 18;
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 20, rotate: (i % 2 ? 1 : -1) * (90 + i * 20), color: colors[i % colors.length] };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute size-3 rounded-[4px] border-[1.5px] border-ink"
          style={{ background: b.color }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 60], scale: [0, 1, 0.8], rotate: b.rotate, opacity: [1, 1, 0] }}
          transition={{ duration: 1.4, delay: 0.5 + (i % 5) * 0.03, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
