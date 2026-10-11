"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useMemo, useState } from "react";
import type { MaterialSuggestion } from "@/types/material";

interface Props {
  suggestions: MaterialSuggestion[];
  value: string;
  onChange: (name: string) => void;
}

/** Free-text material field with keyboard-accessible suggestions. Any material is allowed. */
export function MaterialCombobox({ suggestions, value, onChange }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const results = useMemo(() => {
    const q = value.trim().toLowerCase();
    const hits = q ? suggestions.filter((m) => `${m.name} ${m.family}`.toLowerCase().includes(q)) : suggestions;
    // Hide the list once the text exactly matches a suggestion.
    return hits.length === 1 && hits[0].name.toLowerCase() === q ? [] : hits;
  }, [suggestions, value]);
  const known = suggestions.find((m) => m.name.toLowerCase() === value.trim().toLowerCase());
  const showList = open && results.length > 0;

  function choose(m: MaterialSuggestion) {
    onChange(m.name);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      if (showList && results[active]) {
        e.preventDefault();
        choose(results[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <div className="material-field flex items-center gap-3 rounded-2xl border-2 border-ink/20 bg-paper-raised/80 px-4 py-3 focus-within:border-iris">
        <span
          aria-hidden
          className="grid size-5 shrink-0 place-items-center rounded-md text-xs ring-1 ring-ink/25"
          style={{ background: known?.color ?? "transparent" }}
        >
          {known ? "" : "?"}
        </span>
        <input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${id}-opt-${active}` : undefined}
          className="w-full bg-transparent text-base font-medium text-ink placeholder:text-muted focus:outline-none"
          placeholder="oak, PLA, titanium, chocolate…"
          value={value}
          maxLength={120}
          onChange={(e) => {
            onChange(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
        />
        <span aria-hidden className="text-muted">⌄</span>
      </div>

      <AnimatePresence>
        {showList && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-sand bg-paper-raised p-1.5 shadow-[0_16px_40px_-16px_rgb(45_42_48/0.3)]"
          >
            <li className="px-3 pb-1 pt-1.5 font-display text-sm italic text-muted">Suggestions, or type your own</li>
            {results.map((m, i) => (
              <li
                key={m.name}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(m);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-ink/8" : ""}`}
              >
                <span aria-hidden className="size-4 shrink-0 rounded-md" style={{ background: m.color }} />
                <span className="flex-1">
                  <span className="block font-semibold text-ink">{m.name}</span>
                  <span className="block text-sm text-muted">{m.family}</span>
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <label htmlFor={id} className="sr-only">
        Material
      </label>
    </div>
  );
}
