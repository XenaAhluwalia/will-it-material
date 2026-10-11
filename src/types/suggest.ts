import type { SurfaceFinish } from "./material";
import type { LoadLevel } from "@/lib/screening/presets";

/** One suggested material for the user's idea. */
export interface MaterialPick {
  name: string;
  family: string;
  /** Cartoon colors for its specimen. */
  color: string;
  accent: string;
  finish: SurfaceFinish;
  /** Why it suits this idea, in one or two friendly sentences. */
  why: string;
  /** What you give up by choosing it. */
  tradeoff: string;
  cost: "cheap" | "moderate" | "pricey";
}

/** What the suggestion step returns: the idea, understood as a setup, plus three picks. */
export interface Suggestions {
  component: string;
  /** One sentence: how the idea was understood. */
  summary: string;
  conditions: { tempMin: number; tempMax: number; load: LoadLevel; toggles: string[]; notes: string };
  picks: MaterialPick[];
  model: string;
}
