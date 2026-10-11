import type { Metadata } from "next";
import { EXAMPLES, MATERIAL_SUGGESTIONS } from "@/lib/screening/presets";
import { ExploreApp } from "@/components/explore/ExploreApp";

export const metadata: Metadata = { title: "Explore · Will it Material?" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ material?: string; entry?: string }> }) {
  // The landing page's specimens link here with ?material= to pre-pick themselves.
  const params = await searchParams;
  const material = params.material?.slice(0, 120);
  const initial = material ? { ...EXAMPLES[0], component: "", material, toggles: [], notes: "" } : EXAMPLES[0];
  // ?entry= reopens a saved test from the notebook.
  return <ExploreApp suggestions={MATERIAL_SUGGESTIONS} initial={initial} entryId={params.entry?.slice(0, 64)} />;
}
