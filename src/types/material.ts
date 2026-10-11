/**
 * Material profile, as described by the screening model for whatever the user
 * typed (an alloy, a polymer, wood, glass, food, fabric…).
 *
 * Values are approximate, textbook-style figures intended for conceptual
 * screening only.
 */
export interface MaterialProfile {
  /** Canonical name, e.g. "Aluminum 6061-T6" for input "6061". */
  name: string;
  family: string;
  /** Short plain-language description. */
  summary: string;
  /** What the material is good at, used in sentences like "X is {goodAt}, but…". */
  goodAt: string;
  /** Cartoon base color for the test chamber specimen. */
  color: string;
  /** Highlight color for reflections/glints on the specimen. */
  accent: string;
  /** Cartoon surface finish: metals reflect, polymers shine, ceramics/wood are matte. */
  finish: SurfaceFinish;
  /** The handful of properties that matter for this object, with units. */
  keyProperties: KeyProperty[];
}

export type SurfaceFinish = "metallic" | "gloss" | "matte";

export interface KeyProperty {
  label: string;
  /** Display value with units, e.g. "~276 MPa" or "Poor above 60 °C". */
  value: string;
}

/** A quick-pick suggestion in the material field. Users can still type anything. */
export interface MaterialSuggestion {
  name: string;
  family: string;
  color: string;
}
