import * as z from "zod/v4";
import { ScreeningError } from "@/lib/screening/claude";
import { identifyFromDescription } from "@/lib/identify/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Takes the on-device model's text description only. Photos are never uploaded. */
const RequestSchema = z.object({ description: z.string().trim().min(3).max(400) });

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Describe the object first." }, { status: 400 });
  try {
    return Response.json(await identifyFromDescription(parsed.data.description));
  } catch (error) {
    if (error instanceof ScreeningError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[identify]", error);
    return Response.json({ error: "Couldn't reach the lab to identify it. Check your connection and try again." }, { status: 502 });
  }
}
