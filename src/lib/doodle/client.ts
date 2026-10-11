import type { Doodle } from "@/types/doodle";

/** Client-side: one sketch per object name, shared across re-tests. */
const cache = new Map<string, Promise<Doodle | null>>();

export function fetchDoodle(component: string, material: string): Promise<Doodle | null> {
  const key = component.trim().toLowerCase();
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch("/api/doodle", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ component, material }),
    })
      .then((res) => (res.status === 200 ? (res.json() as Promise<Doodle>) : null))
      .catch(() => null);
    // Don't cache failures, so the next test can try again.
    pending.then((d) => d ?? cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}
