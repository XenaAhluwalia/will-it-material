import type { Suggestions } from "@/types/suggest";

/** Client-side: ask for three material picks, from a described idea or an object with no material. */
export async function fetchSuggestions(
  input: { idea: string } | { component: string; conditions: string },
  signal?: AbortSignal,
): Promise<Suggestions> {
  const res = await fetch("/api/suggest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Couldn't get suggestions (${res.status}).`);
  return body as Suggestions;
}
