import type { MaterialProfile } from "./material";

/** Everything the user tells us. All free text: any object, any material, any conditions. */
export interface TestRequest {
  /** The object, component or tool, e.g. "kitchen spatula" or "Mars rover wheel". */
  component: string;
  /** The candidate material, e.g. "PLA", "pine", "Inconel 718", "borosilicate glass". */
  material: string;
  /** Free-form description of the environment, use and anything else that matters. */
  conditions: string;
  /**
   * Criteria from an earlier run. When re-testing an alternative we ask the model to
   * score the same criteria so the two runs can be compared side by side.
   */
  reuse?: { criteria: { id: string; label: string }[]; properties: string[] };
}

export type Status = "PASS" | "WARNING" | "FAIL";

export type Importance = "critical" | "important" | "minor";

/** The five illustrative chamber effects. The model picks the closest one per test. */
export type StageVisual = "cold" | "heat" | "stress" | "radiation" | "corrosion";

/** One requirement the model decided matters for this object in these conditions. */
export interface Criterion {
  /** Stable kebab-case id, reused across re-tests for comparison. */
  id: string;
  /** Short name, e.g. "Heat resistance" or "Dishwasher survival". */
  label: string;
  /** The material property this is about, e.g. "Glass transition temperature". */
  property: string;
  importance: Importance;
  score: number;
  status: Status;
  /** Plain-language explanation, phrased to follow "but…". */
  issue: string;
  /** Plain-language sentence when things are fine. */
  ok: string;
  /** Chamber effect, or null if this criterion isn't shown in the chamber. */
  visual: StageVisual | null;
  /** Short caption shown in the chamber for this test. */
  caption: string;
}

export interface StageResult {
  /** Criterion id (visuals can repeat, so this is the React key). */
  id: string;
  visual: StageVisual;
  label: string;
  status: Status;
  caption: string;
}

export interface Alternative {
  name: string;
  family: string;
  color: string;
  /** Up to three short reasons it beats the original here. */
  reasons: string[];
  /** What you give up by switching. */
  tradeoff: string;
  /** Model's rough guess of how it would score on the same criteria. */
  estimatedScore: number;
}

export interface ScreeningResult {
  request: TestRequest;
  material: MaterialProfile;
  /** One sentence: how the model read the object + conditions. */
  interpretation: string;
  /** Assumptions it had to make about vague input. */
  assumptions: string[];
  /** Short chips summarising the conditions, e.g. "Up to 250 °C". */
  conditionTags: string[];
  criteria: Criterion[];
  overallScore: number;
  overallStatus: Status;
  stages: StageResult[];
  /** The single weakest criterion that matters, or null if there are none. */
  limiting: Criterion | null;
  /** The headline sentence, e.g. "Aluminum 6061 is lightweight, but…". */
  mainReason: string;
  /** Better (or comparable) materials, best first. */
  alternatives: Alternative[];
  /** Model id that produced this result, for transparency. */
  model: string;
}
