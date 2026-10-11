import type { Suggestions } from "./suggest";

/** Claude's read on a photo, based only on the on-device model's text description of it. */
export interface Identification {
  component: string;
  /** Most likely specific material, e.g. "Stoneware ceramic". */
  material: string;
  confidence: "low" | "medium" | "high";
  /** Why it thinks so, in plain words. */
  reasoning: string;
  /** A fun, safe way to check at home. */
  checkTip: string;
  /** A material that would do the job better, if there clearly is one. */
  better: { name: string; why: string } | null;
  conditions: Suggestions["conditions"];
}
