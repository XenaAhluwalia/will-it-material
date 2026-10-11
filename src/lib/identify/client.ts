import type { Identification } from "@/types/identify";

/** Client-side: send the on-device description (text only) for a material read. */
export async function fetchIdentification(description: string, signal?: AbortSignal): Promise<Identification> {
  const res = await fetch("/api/identify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ description }),
    signal,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Couldn't identify it (${res.status}).`);
  return body as Identification;
}
