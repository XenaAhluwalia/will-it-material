"use client";

import { motion } from "framer-motion";
import type { Suggestions, MaterialPick } from "@/types/suggest";
import type { Doodle } from "@/types/doodle";
import { Specimen } from "@/components/chamber/Specimen";
import { ObjectDoodle } from "@/components/doodle/ObjectDoodle";
import { tempVibe } from "@/lib/screening/presets";

const COST: Record<MaterialPick["cost"], string> = { cheap: "$ cheap", moderate: "$$ moderate", pricey: "$$$ pricey" };

interface Props {
  suggestions: Suggestions;
  doodle: Doodle | null | undefined;
  onTest: (pick: MaterialPick) => void;
  onEdit: () => void;
  onStartOver: () => void;
}

/** Three material picks for the user's idea, each one tap away from a full test. */
export function SuggestionsView({ suggestions: s, doodle, onTest, onEdit, onStartOver }: Props) {
  const { tempMin, tempMax } = s.conditions;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {doodle !== null && <ObjectDoodle doodle={doodle} name={s.component} size={110} />}
        <div className="min-w-0 flex-1">
          <h1 className="ink-texture font-display text-4xl sm:text-5xl">Ideas for your {s.component.toLowerCase()}</h1>
          <p className="mt-2 max-w-2xl text-lg text-soft">{s.summary}</p>
          <p className="mt-2 text-sm text-muted">
            Assuming <span className="marker font-display italic text-ink">{tempVibe(tempMin)}</span> to{" "}
            <span className="marker font-display italic text-ink">{tempVibe(tempMax)}</span> ({tempMin} to {tempMax} °C).
          </p>
        </div>
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {s.picks.map((p, i) => (
          <motion.li
            key={p.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 300, damping: 22 }}
            className="card flex flex-col gap-3 p-5"
          >
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ rotate: -6, y: -3 }} className="shrink-0">
                <Specimen color={p.color} accent={p.accent} finish={p.finish} look={{ mood: "happy" }} size={72} />
              </motion.div>
              <div className="min-w-0">
                {i === 0 && <span className="marker font-display text-sm italic text-ink">top pick</span>}
                <h2 className="font-display text-2xl leading-tight text-ink">{p.name}</h2>
                <p className="text-sm text-muted">{p.family}</p>
              </div>
            </div>
            <p className="text-soft">{p.why}</p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-soft">Trade-off:</span> {p.tradeoff}
            </p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-1">
              <span className="rounded-full border border-sand px-2.5 py-0.5 text-sm text-soft">{COST[p.cost]}</span>
              <button type="button" onClick={() => onTest(p)} className="btn bg-iris px-4 py-1.5 text-base text-paper-raised">
                Test this one
              </button>
            </div>
          </motion.li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onEdit} className="btn bg-paper-raised px-5 py-2 text-base text-ink">
          Tweak the conditions
        </button>
        <button type="button" onClick={onStartOver} className="btn bg-paper-raised px-5 py-2 text-base text-ink">
          Start over
        </button>
      </div>
    </div>
  );
}

/** Loading state: three little specimens taking turns hopping while Claude thinks. */
export function Thinking({ text }: { text: string }) {
  const colors = ["#c4c1ef", "#e6c27a", "#9cc9ae"];
  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center gap-5 p-8 text-center" aria-live="polite">
      <div className="flex gap-4" aria-hidden>
        {colors.map((c, i) => (
          <motion.div key={c} animate={{ y: [0, -14, 0] }} transition={{ duration: 0.7, delay: i * 0.18, repeat: Infinity, repeatDelay: 0.5 }}>
            <Specimen color={c} finish="gloss" look={{ mood: i === 1 ? "worried" : "happy" }} size={56} />
          </motion.div>
        ))}
      </div>
      <p className="ink-texture font-display text-3xl">{text}</p>
      <p className="text-sm text-muted">Usually takes about 10 seconds.</p>
    </div>
  );
}
