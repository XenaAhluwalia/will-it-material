import type { Criterion, Importance, ScreeningResult, StageResult, StageVisual, Status, TestRequest } from "@/types/screening";
import type { MaterialProfile } from "@/types/material";
import type { ModelOutput } from "./schema";
import { PASS_THRESHOLD, WARNING_THRESHOLD, clamp, statusFromScore, statusRank, worstStatus } from "./scoring";

/**
 * Turns the model's judgement into a ScreeningResult. The model decides *what*
 * matters and how well the material does; verdicts, the overall score and the
 * headline are derived here so they always agree with the per-criterion scores.
 */

const WEIGHT: Record<Importance, number> = { critical: 3, important: 2, minor: 1 };
const MAX_CRITERIA = 6;
const MAX_STAGES = 6;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function assembleResult(request: TestRequest, out: ModelOutput, model: string): ScreeningResult {
  const material: MaterialProfile = {
    ...out.material,
    color: hex(out.material.color, "#94a3b8"),
    accent: hex(out.material.accent, "#f1f5f9"),
    keyProperties: out.material.keyProperties.slice(0, 6),
  };

  const criteria: Criterion[] = dedupe(out.criteria)
    .slice(0, MAX_CRITERIA)
    .map((c) => {
      const score = Math.round(clamp(c.score));
      return {
        ...c,
        issue: c.issue.replace(/[.\s]+$/, ""),
        score,
        status: statusFromScore(score),
        visual: c.visual === "none" ? null : c.visual,
      };
    });
  if (!criteria.length) throw new Error("The screening came back without any criteria.");

  // A minor criterion can drag the verdict down to WARNING, never to FAIL.
  const overallStatus = worstStatus(
    criteria.map((c) => (c.importance === "minor" && c.status === "FAIL" ? "WARNING" : c.status)),
  );
  const totalWeight = criteria.reduce((s, c) => s + WEIGHT[c.importance], 0);
  let overallScore = Math.round(criteria.reduce((s, c) => s + c.score * WEIGHT[c.importance], 0) / totalWeight);
  // Keep the number consistent with the verdict.
  if (overallStatus === "FAIL") overallScore = Math.min(overallScore, WARNING_THRESHOLD - 1);
  if (overallStatus === "WARNING") overallScore = Math.min(overallScore, PASS_THRESHOLD - 1);
  if (overallStatus === "PASS") overallScore = Math.max(overallScore, PASS_THRESHOLD);

  const limiting = pickLimiting(criteria);

  return {
    request,
    material,
    interpretation: out.interpretation,
    assumptions: out.assumptions.slice(0, 4),
    conditionTags: out.conditionTags.slice(0, 8),
    criteria,
    overallScore,
    overallStatus,
    stages: buildStages(criteria),
    limiting,
    mainReason: buildMainReason(material, overallStatus, limiting),
    alternatives: out.alternatives
      .filter((a) => a.name.trim().toLowerCase() !== material.name.trim().toLowerCase())
      .slice(0, 3)
      .map((a) => ({ ...a, color: hex(a.color, "#94a3b8"), reasons: a.reasons.slice(0, 3), estimatedScore: Math.round(clamp(a.estimatedScore)) })),
    model,
  };
}

function dedupe<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => !seen.has(i.id) && seen.add(i.id));
}

function hex(value: string, fallback: string) {
  return HEX.test(value.trim()) ? value.trim() : fallback;
}

/** Weakest criterion by its effect on the verdict, then by score, then by importance. */
function pickLimiting(criteria: Criterion[]): Criterion | null {
  const effective = (c: Criterion) => (c.importance === "minor" && c.status === "FAIL" ? 1 : statusRank(c.status));
  return criteria.reduce<Criterion | null>((worst, c) => {
    if (!worst) return c;
    const d = effective(c) - effective(worst) || worst.score - c.score || WEIGHT[c.importance] - WEIGHT[worst.importance];
    return d > 0 ? c : worst;
  }, null);
}

function buildStages(criteria: Criterion[]): StageResult[] {
  const shown = criteria.filter((c): c is Criterion & { visual: StageVisual } => c.visual !== null);
  // The chamber needs at least one stage; fall back to a stress test of every criterion.
  const source = shown.length ? shown : criteria.map((c) => ({ ...c, visual: "stress" as const }));
  return source.slice(0, MAX_STAGES).map((c) => ({
    id: c.id,
    visual: c.visual,
    label: c.label,
    status: c.status,
    caption: c.caption,
  }));
}

function buildMainReason(m: MaterialProfile, status: Status, limiting: Criterion | null): string {
  if (!limiting || status === "PASS") {
    const tight = limiting ? ` Its tightest margin is ${limiting.label.toLowerCase()}.` : "";
    return `${m.name} looks like a strong fit: it's ${m.goodAt}, and nothing in this screening raised a red flag.${tight}`;
  }
  return `${m.name} is ${m.goodAt}, but ${limiting.issue}.`;
}
