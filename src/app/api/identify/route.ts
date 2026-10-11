import * as z from "zod/v4";
import { ScreeningError } from "@/lib/screening/claude";
import { identifyFromPhoto } from "@/lib/identify/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

/** A downscaled JPEG (~100-300 KB as base64). Used for this request only, never stored. */
const MAX_IMAGE_CHARS = 3_000_000;
const RequestSchema = z.object({
  image: z.string().min(100).max(MAX_IMAGE_CHARS).regex(/^[A-Za-z0-9+/=]+$/),
  /** What the student says it really is, if the first guess was off. */
  correction: z.string().trim().max(200).optional(),
});

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "That photo didn't come through. Try another one." }, { status: 400 });
  try {
    return Response.json(await identifyFromPhoto(parsed.data.image, parsed.data.correction));
  } catch (error) {
    if (error instanceof ScreeningError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[identify]", error);
    return Response.json({ error: "Couldn't reach the lab to identify it. Check your connection and try again." }, { status: 502 });
  }
}
