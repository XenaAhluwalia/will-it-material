"use client";

import type { ScreeningResult } from "@/types/screening";
import { ScoreBar } from "@/components/ui/ScoreGauge";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Props {
  original: ScreeningResult;
  recommended: ScreeningResult;
}

/**
 * Side-by-side of two runs. The re-test is asked to reuse the original's criteria
 * and property labels, so rows are matched by id/label; anything one run lacks shows "—".
 */
export function ComparisonView({ original, recommended }: Props) {
  const rows = unionBy([...original.criteria, ...recommended.criteria], (c) => c.id).map((c) => ({
    key: c.id,
    label: c.label,
    a: original.criteria.find((x) => x.id === c.id)?.score ?? null,
    b: recommended.criteria.find((x) => x.id === c.id)?.score ?? null,
  }));
  rows.push({ key: "overall", label: "Overall", a: original.overallScore, b: recommended.overallScore });

  return (
    <section className="card p-4" aria-labelledby="compare-heading">
      <h2 id="compare-heading" className="mb-4 font-display text-xl text-ink">
        Side by side
      </h2>

      <div className="grid grid-cols-[minmax(80px,auto)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 gap-y-3 sm:gap-x-6">
        <span />
        <ColumnHead tag="Original" result={original} />
        <ColumnHead tag="Re-tested" result={recommended} />

        {rows.map((row, i) => {
          const isOverall = row.key === "overall";
          return (
            <div key={row.key} className={`contents ${isOverall ? "font-bold" : ""}`}>
              <span className={`font-display text-sm ${isOverall ? "border-t border-sand pt-3 text-ink" : "text-soft"}`}>
                {row.label}
              </span>
              <Cell score={row.a} better={row.a !== null && row.b !== null && row.a > row.b} delay={i * 0.08} divider={isOverall} />
              <Cell score={row.b} better={row.a !== null && row.b !== null && row.b > row.a} delay={i * 0.08 + 0.04} divider={isOverall} />
            </div>
          );
        })}
      </div>

      <PropertiesTable original={original} recommended={recommended} />
    </section>
  );
}

function PropertiesTable({ original, recommended }: Props) {
  const norm = (s: string) => s.trim().toLowerCase();
  const labels = unionBy([...original.material.keyProperties, ...recommended.material.keyProperties], (p) => norm(p.label)).map((p) => p.label);
  const valueOf = (r: ScreeningResult, label: string) => r.material.keyProperties.find((p) => norm(p.label) === norm(label))?.value ?? "—";
  if (!labels.length) return null;
  return (
    <div className="mt-5 border-t border-sand pt-4">
      <h3 className="mb-2 font-display text-base text-ink">Material properties</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th scope="col" className="py-1.5 pr-3 font-bold">Property</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-bold">{original.material.name}</th>
              <th scope="col" className="py-1.5 text-right font-bold">{recommended.material.name}</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => (
              <tr key={label} className="border-t border-sand">
                <th scope="row" className="py-2 pr-3 text-left font-semibold text-soft">{label}</th>
                <td className="py-2 pr-3 text-right font-display text-ink">{valueOf(original, label)}</td>
                <td className="py-2 text-right font-display text-ink">{valueOf(recommended, label)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-muted">Values are approximate AI-provided figures intended for conceptual screening only.</p>
    </div>
  );
}

function unionBy<T>(items: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((i) => !seen.has(key(i)) && seen.add(key(i)));
}

function ColumnHead({ tag, result }: { tag: string; result: ScreeningResult }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <span className="font-display text-sm italic text-muted">{tag}</span>
      <span className="flex max-w-full items-center gap-2 font-display text-ink">
        <span aria-hidden className="size-3 shrink-0 rounded" style={{ background: result.material.color }} />
        <span className="truncate">{result.material.name}</span>
      </span>
      <StatusBadge status={result.overallStatus} size="sm" />
    </div>
  );
}

function Cell({ score, better, delay, divider }: { score: number | null; better: boolean; delay: number; divider: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${divider ? "border-t border-sand pt-3" : ""}`}>
      {score === null ? (
        <span className="text-sm text-muted">Not scored</span>
      ) : (
        <>
          <ScoreBar score={score} delay={delay} />
          <span className={`w-12 shrink-0 text-right font-display text-sm ${better ? "text-ink" : "text-muted"}`}>
            {score}
            {better && <span className="ml-0.5 text-pass">▲</span>}
          </span>
        </>
      )}
    </div>
  );
}
