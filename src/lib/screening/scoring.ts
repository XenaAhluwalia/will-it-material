import type { Status } from "@/types/screening";

export const PASS_THRESHOLD = 75;
export const WARNING_THRESHOLD = 50;

export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function statusFromScore(score: number): Status {
  if (score >= PASS_THRESHOLD) return "PASS";
  if (score >= WARNING_THRESHOLD) return "WARNING";
  return "FAIL";
}

const STATUS_RANK: Record<Status, number> = { PASS: 0, WARNING: 1, FAIL: 2 };

export function worstStatus(statuses: Status[]): Status {
  return statuses.reduce<Status>((worst, s) => (STATUS_RANK[s] > STATUS_RANK[worst] ? s : worst), "PASS");
}

export function statusRank(s: Status): number {
  return STATUS_RANK[s];
}
