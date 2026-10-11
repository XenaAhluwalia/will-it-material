"use client";

import { motion } from "framer-motion";
import { useId } from "react";

/** A slim joined button bar with a sliding highlight behind the chosen option. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  size?: "md" | "lg";
}) {
  const layoutId = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex w-full flex-wrap gap-1 rounded-[1.4rem] border-2 border-ink bg-paper-raised p-1 shadow-[0_3px_0_var(--color-ink)] sm:w-auto sm:flex-nowrap"
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={`relative flex-1 rounded-full px-4 font-display transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris sm:flex-none ${
              size === "lg" ? "py-2 text-lg" : "py-1.5 text-base"
            } ${on ? "text-paper-raised" : "text-ink hover:bg-ink/5"}`}
          >
            {on && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-iris"
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
              />
            )}
            <span className="relative whitespace-nowrap">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
