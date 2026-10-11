import type { ScreeningResult, TestRequest } from "@/types/screening";

/** Client-side entry point: everything runs on the server via /api/screen. */

export * from "./presets";
export { statusFromScore } from "./scoring";

export async function runScreening(request: TestRequest, signal?: AbortSignal): Promise<ScreeningResult> {
  const res = await fetch("/api/screen", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Screening failed (${res.status}).`);
  return body as ScreeningResult;
}

/** Request a re-test of an alternative, reusing the same criteria so the runs line up. */
export function retestRequest(previous: ScreeningResult, material: string): TestRequest {
  return {
    component: previous.request.component,
    conditions: previous.request.conditions,
    material,
    reuse: {
      criteria: previous.criteria.map((c) => ({ id: c.id, label: c.label })),
      properties: previous.material.keyProperties.map((p) => p.label),
    },
  };
}
