"use client";

import { motion } from "framer-motion";
import type { Criterion, Importance } from "@/types/screening";
import { ScoreBar } from "@/components/ui/ScoreGauge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUS_STYLE } from "@/components/ui/status";

const IMPORTANCE_LABEL: Record<Importance, string> = { critical: "Critical", important: "Important", minor: "Nice to have" };

/** One criterion the screening decided matters for this object. */
export function CriterionCard({ criterion: c, index }: { criterion: Criterion; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index }}
      className="card flex flex-col gap-2.5 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="min-w-0">
            <h3 className="font-display text-lg leading-tight text-ink">{c.label}</h3>
            <p className="font-display text-sm italic text-muted">{IMPORTANCE_LABEL[c.importance]}</p>
          </div>
        </div>
        <StatusBadge status={c.status} size="sm" />
      </div>

      <div className="flex items-center gap-3">
        <ScoreBar score={c.score} delay={0.12 * index} />
        <span className={`w-9 text-right font-display text-lg ${STATUS_STYLE[c.status].text}`}>{c.score}</span>
      </div>

      <p className="text-sm leading-relaxed text-soft">{c.status === "PASS" ? c.ok : capitalize(c.issue) + "."}</p>
      <p className="mt-auto text-xs text-muted">Property: {c.property}</p>
    </motion.article>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
