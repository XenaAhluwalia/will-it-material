import Anthropic from "@anthropic-ai/sdk";
import * as z from "zod/v4";
import { ScreeningError, screenWithClaude } from "@/lib/screening/claude";

export const runtime = "nodejs";
// Screening a scenario can take a while; give the model room.
export const maxDuration = 120;

const RequestSchema = z.object({
  component: z.string().trim().min(1, "Tell us what object you're testing.").max(120),
  material: z.string().trim().min(1, "Tell us which material to test.").max(120),
  conditions: z.string().max(1500).default(""),
  reuse: z
    .object({
      criteria: z.array(z.object({ id: z.string().max(60), label: z.string().max(80) })).max(6),
      properties: z.array(z.string().max(80)).max(6),
    })
    .optional(),
});

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  try {
    return Response.json(await screenWithClaude(parsed.data));
  } catch (error) {
    if (error instanceof ScreeningError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[screen]", error);
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "The server's Claude API key is missing or invalid." }, { status: 500 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "The test chamber is busy. Try again in a moment." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return Response.json({ error: "Couldn't reach the screening service. Check your connection and try again." }, { status: 502 });
    }
    // The SDK has no dedicated class for this setup mistake, so check the API's message.
    if (error instanceof Anthropic.BadRequestError && /workspace/i.test(error.message)) {
      return Response.json(
        { error: "The server's API key needs a workspace. Set ANTHROPIC_WORKSPACE_ID (it starts with wrkspc_) in .env.local, or use a workspace-scoped key." },
        { status: 500 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: "The screening service had a problem. Please try again." }, { status: 502 });
    }
    if (error instanceof Error && /api key|credentials/i.test(error.message)) {
      return Response.json({ error: "No Claude API key is configured. Set ANTHROPIC_API_KEY in .env.local." }, { status: 500 });
    }
    return Response.json({ error: "Something went wrong running the screening." }, { status: 500 });
  }
}
