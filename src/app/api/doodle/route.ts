import Anthropic from "@anthropic-ai/sdk";
import * as z from "zod/v4";
import { drawDoodle } from "@/lib/doodle/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  component: z.string().trim().min(1).max(120),
  material: z.string().trim().max(120).default(""),
});

/** The doodle is decoration: any failure returns 204 and the page simply skips it. */
export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  try {
    const doodle = await drawDoodle(parsed.data.component, parsed.data.material);
    return doodle ? Response.json(doodle) : new Response(null, { status: 204 });
  } catch (error) {
    console.error("[doodle]", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
    return new Response(null, { status: 204 });
  }
}
