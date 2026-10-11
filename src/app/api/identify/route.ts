import * as z from "zod/v4";
import { ScreeningError } from "@/lib/screening/claude";
import { identify } from "@/lib/identify/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Either the on-device model's text description (the photo never leaves the device) or,
 * when the student turns that off, a downscaled JPEG used for this request only.
 */
const MAX_IMAGE_CHARS = 3_000_000;
const Correction = z.string().trim().max(200).optional();
const RequestSchema = z.union([
  z.object({ image: z.string().min(100).max(MAX_IMAGE_CHARS).regex(/^[A-Za-z0-9+/=]+$/), correction: Correction }),
  z.object({ description: z.string().trim().min(3).max(400), correction: Correction }),
]);

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "That photo didn't come through. Try another one." }, { status: 400 });
  try {
    return Response.json(await identify(parsed.data, parsed.data.correction));
  } catch (error) {
    if (error instanceof ScreeningError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[identify]", error);
    return Response.json({ error: "Couldn't reach the lab to identify it. Check your connection and try again." }, { status: 502 });
  }
}
