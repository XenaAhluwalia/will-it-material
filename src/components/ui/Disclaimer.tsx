"use client";

import { useId, useState } from "react";

export const DISCLAIMER_TEXT =
  "Will it Material? gives a rough first look at materials, for learning and early ideas. It is not a substitute for real engineering analysis, testing, or certification.";

export const ANIMATION_NOTE =
  "The test chamber and doodles are playful illustrations of the results, not physical simulations.";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  if (compact) {
    return <p className="hidden font-display text-sm italic text-muted sm:block">For learning and early ideas, not real-world certification</p>;
  }

  // Slim footer row: the essential warning is always visible; Details adds the full text.
  return (
    <div role="note" aria-label="Disclaimer" className="border-t-2 border-sand pt-4 text-sm text-muted">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="min-w-0 flex-1">
          <span className="font-semibold text-soft">Just a first look.</span> Great for learning, but not a substitute for real engineering
          testing.
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((o) => !o)}
          className="rounded font-semibold text-iris underline decoration-iris/30 underline-offset-4 hover:decoration-iris focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {open ? "Hide details" : "Details"}
        </button>
      </div>
      <div id={detailsId} hidden={!open} className="mt-2 max-w-3xl space-y-1 text-soft">
        <p>{DISCLAIMER_TEXT}</p>
        <p>{ANIMATION_NOTE}</p>
      </div>
    </div>
  );
}
