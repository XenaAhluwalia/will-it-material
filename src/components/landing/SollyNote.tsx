"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

/** "pick your solly!" with the word solly as a tap/hover target that explains where it comes from. */
export function SollyNote() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className="marker -rotate-3">
      pick your{" "}
      <span ref={wrapRef} className="relative" onPointerEnter={() => setOpen(true)} onPointerLeave={() => setOpen(false)}>
        <button
          type="button"
          aria-expanded={open}
          aria-describedby={open ? tipId : undefined}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="cursor-help rounded italic underline decoration-ink/50 decoration-dotted decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris"
        >
          solly
        </button>
        <AnimatePresence>
          {open && (
            <motion.span
              id={tipId}
              role="tooltip"
              initial={{ opacity: 0, y: -4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className="absolute left-1/2 top-full z-30 mt-3 block w-64 -translate-x-1/2 rotate-3 rounded-2xl border-2 border-ink bg-paper-raised px-3 py-2 text-left font-sans text-sm not-italic leading-snug text-ink shadow-[0_3px_0_var(--color-ink)]"
            >
              Named after <strong className="font-semibold">sol</strong>, the materials-science word for tiny solid particles floating in a
              liquid. It&apos;s the first step in making many glasses and ceramics.
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      !
    </span>
  );
}
