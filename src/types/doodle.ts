/** A tiny caricature of the object being tested, drawn by the model and sanitized on the server. */
export interface Doodle {
  /** Sanitized SVG shape markup in a 0-120 coordinate space. */
  svg: string;
  /** Where the app draws the cute face, in the same coordinates. */
  face: { x: number; y: number; size: number };
  /** A short funny line in the object's voice. */
  caption: string;
}
