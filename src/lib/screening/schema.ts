import * as z from "zod/v4";

/**
 * Shape the model must return (enforced via structured outputs).
 *
 * Kept free of numeric bounds and min/max item counts, which structured outputs
 * don't enforce; `assemble.ts` clamps and trims instead.
 */
export const VISUALS = ["cold", "heat", "stress", "radiation", "corrosion", "none"] as const;

const CriterionSchema = z.object({
  id: z.string().describe("kebab-case id, e.g. heat-resistance"),
  label: z.string().describe("Short name, 2-4 words"),
  property: z.string().describe("Material property this is about"),
  importance: z.enum(["critical", "important", "minor"]),
  score: z.number().describe("0-100 per the rubric"),
  issue: z.string().describe("Lowercase clause that reads naturally after 'but', describing the risk. No trailing period."),
  ok: z.string().describe("Full sentence for when this is fine"),
  visual: z.enum(VISUALS),
  caption: z.string().describe("Playful chamber caption, max 6 words, matching the score"),
});

export const ModelOutputSchema = z.object({
  understood: z.boolean().describe("false only if the input is too garbled to evaluate at all"),
  clarification: z.string().describe("If not understood: one friendly sentence asking for what's missing. Else empty."),
  material: z.object({
    name: z.string(),
    family: z.string(),
    summary: z.string(),
    goodAt: z.string().describe("Lowercase phrase that completes 'X is ...', e.g. 'lightweight and easy to machine'"),
    color: z.string().describe("#rrggbb base color resembling the material"),
    accent: z.string().describe("#rrggbb lighter highlight color"),
    finish: z.enum(["metallic", "gloss", "matte"]),
    keyProperties: z.array(z.object({ label: z.string(), value: z.string() })),
  }),
  interpretation: z.string(),
  assumptions: z.array(z.string()),
  conditionTags: z.array(z.string().describe("Short plain-text chip with no emoji, e.g. 'Up to 250 °C'")),
  criteria: z.array(CriterionSchema),
  alternatives: z.array(
    z.object({
      name: z.string(),
      family: z.string(),
      color: z.string(),
      reasons: z.array(z.string()),
      tradeoff: z.string(),
      estimatedScore: z.number(),
    }),
  ),
});

export type ModelOutput = z.infer<typeof ModelOutputSchema>;
