import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { ScreeningResult, TestRequest } from "@/types/screening";
import { ModelOutputSchema } from "./schema";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt";
import { assembleResult } from "./assemble";

/** Server-only: talks to the Claude API. Never import this from a client component. */

export const SCREENING_MODEL = "claude-sonnet-5-5";

/** An error whose message is safe and useful to show the user. */
export class ScreeningError extends Error {
  constructor(
    message: string,
    readonly status = 422,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
// Org-level API keys (not scoped to a workspace) must name the workspace on every request.
const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
const getClient = () =>
  (client ??= new Anthropic(workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {}));

export async function screenWithClaude(request: TestRequest): Promise<ScreeningResult> {
  const response = await getClient().beta.messages.parse({
    model: SCREENING_MODEL,
    max_tokens: 16000,
    // Scoring needs some judgement, but this is a single structured answer, not an agentic task.
    output_config: { effort: "medium", format: betaZodOutputFormat(ModelOutputSchema) },
    // On a safety decline, let the API retry on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildUserMessage(request) }],
  });

  if (response.stop_reason === "refusal") {
    throw new ScreeningError("The screening model declined this request. Try describing the object and conditions differently.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new ScreeningError("The screening ran long and got cut off. Try a shorter description.", 502);
  }
  const out = response.parsed_output;
  if (!out) throw new ScreeningError("The screening came back in an unexpected format. Please try again.", 502);
  if (!out.understood) {
    throw new ScreeningError(out.clarification || "We couldn't tell what object or material you meant. Could you rephrase?");
  }

  return assembleResult(request, out, response.model);
}
