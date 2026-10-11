"use client";

import { useEffect, useId, useState } from "react";

const EXAMPLES = [
  "a phone stand for my desk that looks cool",
  "a lunchbox that keeps food warm until lunch",
  "earrings that won't irritate my skin",
  "a birdhouse that survives a snowy winter",
  "a skateboard deck that won't snap",
  "a water bottle I can drop a hundred times",
];

/** "I have an idea" mode: describe what you want to make, get material picks. */
export function IdeaForm({ initial, error, onSubmit }: { initial: string; error?: string | null; onSubmit: (idea: string) => void }) {
  const [idea, setIdea] = useState(initial);
  const [hint, setHint] = useState(0);
  const id = useId();

  // Rotate the placeholder through examples while the box is empty.
  useEffect(() => {
    if (idea) return;
    const t = window.setInterval(() => setHint((h) => (h + 1) % EXAMPLES.length), 3000);
    return () => window.clearInterval(t);
  }, [idea]);

  const canSubmit = idea.trim().length >= 3;

  return (
    <form
      className="card mx-auto flex max-w-2xl flex-col gap-4 p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(idea.trim());
      }}
    >
      <label htmlFor={id} className="font-display text-2xl text-ink">
        What do you want to make?
      </label>
      <textarea
        id={id}
        rows={2}
        maxLength={600}
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && canSubmit) {
            e.preventDefault();
            onSubmit(idea.trim());
          }
        }}
        placeholder={`e.g. ${EXAMPLES[hint]}`}
        className="w-full resize-none rounded-2xl border-2 border-ink/20 bg-paper-raised/80 px-4 py-3 text-lg text-ink placeholder:text-muted focus:border-iris focus:outline-none"
      />
      <div>
        <p className="mb-2 font-display italic text-soft">Or borrow one:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.slice(0, 4).map((ex) => (
            <button key={ex} type="button" onClick={() => setIdea(ex)} className="btn bg-paper-raised px-3 py-1 text-sm text-ink">
              {ex}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-2xl bg-fail/10 px-4 py-3 text-sm text-soft ring-1 ring-fail/25">
          <span className="font-semibold text-fail">Couldn&apos;t get suggestions.</span> {error}
        </p>
      )}
      <button type="submit" disabled={!canSubmit} className="btn bg-iris px-6 py-3 text-xl text-paper-raised">
        Find me materials
      </button>
      <p className="-mt-2 text-center text-sm text-muted">You&apos;ll get 3 materials to try, and can test any of them.</p>
    </form>
  );
}
