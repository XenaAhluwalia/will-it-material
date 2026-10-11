import Anthropic from "@anthropic-ai/sdk";
import * as z from "zod/v4";
import { ScreeningError } from "@/lib/screening/claude";
import { suggestMaterials } from "@/lib/suggest/claude";

export const runtime = "nodejs";
export const maxDuration = 90;

const RequestSchema = z
  .object({
    idea: z.string().trim().max(600).optional(),
    component: z.string().trim().max(120).optional(),
    conditions: z.string().max(1500).optional(),
  })
  .refine((r) => Boolean(r.idea || r.component), { message: "Tell us what you want to make." });

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  try {
    return Response.json(await suggestMaterials(parsed.data));
  } catch (error) {
    if (error instanceof ScreeningError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[suggest]", error);
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "The lab is busy. Try again in a moment." }, { status: 429 });
    }
    return Response.json({ error: "Couldn't get suggestions right now. Please try again." }, { status: 502 });
  }
}
