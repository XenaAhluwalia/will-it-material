import Anthropic from "@anthropic-ai/sdk";

/** Server-only: the one shared Claude client. Never import this from a client component. */

let client: Anthropic | null = null;
// Org-level API keys (not scoped to a workspace) must name the workspace on every request.
const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();

export const getClient = () =>
  (client ??= new Anthropic(workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {}));
