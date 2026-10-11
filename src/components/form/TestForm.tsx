"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState } from "react";
import type { MaterialSuggestion } from "@/types/material";
import {
  CONDITION_TOGGLES,
  EXAMPLES,
  LOAD_LEVELS,
  TEMP_RANGE,
  TOGGLE_GROUPS,
  TOGGLE_REACTIONS,
  sameSetup,
  tempVibe,
  type Setup,
} from "@/lib/screening/presets";
import { Specimen, type SpecimenLook } from "@/components/chamber/Specimen";
import { Segmented } from "@/components/ui/Segmented";
import { MaterialCombobox } from "./MaterialCombobox";

interface Props {
  suggestions: MaterialSuggestion[];
  initial: Setup;
  error?: string | null;
  onSubmit: (setup: Setup) => void;
  /** Called instead of onSubmit when the material is left blank. */
  onSuggest: (setup: Setup) => void;
}

const INPUT =
  "w-full rounded-2xl border-2 border-ink/20 bg-paper-raised/80 px-4 py-3 font-medium text-ink placeholder:text-muted focus:border-iris focus:outline-none";

const TOGGLE_LABEL = Object.fromEntries(CONDITION_TOGGLES.map((t) => [t.id, t.label]));

export function TestForm({ suggestions, initial, error, onSubmit, onSuggest }: Props) {
  const [setup, setSetup] = useState<Setup>(initial);
  // What the preview sample last reacted to, so it can say something about it.
  const [lastChange, setLastChange] = useState<{ key: number; line: string | null }>({ key: 0, line: null });
  const componentId = useId();
  const notesId = useId();

  const react = (line: string | null) => setLastChange((c) => ({ key: c.key + 1, line }));
  const set = <K extends keyof Setup>(key: K, value: Setup[K]) => setSetup((s) => ({ ...s, [key]: value }));

  const canSubmit = setup.component.trim().length > 0;
  // No material yet? The main button asks for suggestions instead.
  const wantsSuggestions = setup.material.trim().length === 0;
  const selectedExample = EXAMPLES.find((e) => sameSetup(e, setup))?.id;
  const known = suggestions.find((m) => m.name.toLowerCase() === setup.material.trim().toLowerCase());

  const toggle = (id: string) => {
    const on = !setup.toggles.includes(id);
    set("toggles", on ? [...setup.toggles, id] : setup.toggles.filter((t) => t !== id));
    react(on ? TOGGLE_REACTIONS[id] : "phew");
  };

  return (
    <form
      className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] lg:items-start"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        const clean = { ...setup, component: setup.component.trim(), material: setup.material.trim(), notes: setup.notes.trim() };
        (wantsSuggestions ? onSuggest : onSubmit)(clean);
      }}
    >
      {/* Left: what it is, and a live preview of it (sticks while you scroll on wide screens). */}
      <div className="flex flex-col gap-5 lg:sticky lg:top-6">
        <section className="card flex flex-col gap-4 p-4 sm:p-5">
          <StepTitle n={1} title="What are we testing?" />
          <div>
            <label htmlFor={componentId} className="mb-1.5 block text-sm font-semibold text-soft">
              The thing
            </label>
            <input
              id={componentId}
              className={INPUT}
              placeholder="sneakers, acrylic nails, a Mars rover…"
              value={setup.component}
              maxLength={120}
              onChange={(e) => set("component", e.target.value)}
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-soft">Made of</p>
            <MaterialCombobox
              suggestions={suggestions}
              value={setup.material}
              onChange={(v) => {
                set("material", v);
              }}
            />
            <p className="mt-2 text-sm text-muted">Not sure? Leave it blank and we&apos;ll suggest some.</p>
          </div>
          <div>
            <p className="mb-2 font-display text-sm italic text-muted">or start from an example</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => {
                const on = ex.id === selectedExample;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setSetup({ ...ex, toggles: [...ex.toggles] });
                      react(`hi, I'm ${ex.title.toLowerCase()}`);
                    }}
                    className={`rounded-full border-2 px-3 py-0.5 text-sm transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris ${
                      on ? "border-ink bg-iris-soft text-ink" : "border-ink/20 text-soft hover:border-ink/50 hover:text-ink"
                    }`}
                  >
                    {ex.title}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <SamplePreview setup={setup} color={known?.color} lastChange={lastChange} className="hidden lg:flex" />
      </div>

      {/* Right: how rough its life is. */}
      <section className="card flex flex-col gap-6 p-4 sm:p-5">
        <StepTitle n={2} title="How rough is its life?" />

        <TemperatureRange
          min={setup.tempMin}
          max={setup.tempMax}
          onChange={(lo, hi) => {
            setSetup((s) => ({ ...s, tempMin: lo, tempMax: hi }));
            react(null);
          }}
        />

        <div>
          <p className="mb-2 text-sm font-semibold text-soft">How much force?</p>
          <Segmented
            label="How much force?"
            options={LOAD_LEVELS}
            value={setup.load}
            onChange={(id) => {
              set("load", id);
              react(id === "extreme" ? "oh no" : id === "light" ? "easy day" : null);
            }}
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-soft">Flip on anything that applies</legend>
          <div className="flex flex-col gap-3">
            {TOGGLE_GROUPS.map((g) => (
              <div key={g.label} className="grid gap-1.5 sm:grid-cols-[8.5rem_1fr] sm:items-center sm:gap-3">
                <p className="font-display text-sm italic text-muted">{g.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.ids.map((id) => (
                    <Toggle key={id} label={TOGGLE_LABEL[id]} on={setup.toggles.includes(id)} onClick={() => toggle(id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={notesId} className="mb-1.5 block text-sm font-semibold text-soft">
            Anything else? <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={notesId}
            className={INPUT}
            placeholder="e.g. has to last 10 years"
            value={setup.notes}
            maxLength={300}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <SamplePreview setup={setup} color={known?.color} lastChange={lastChange} compact className="lg:hidden" />

        {error && (
          <p role="alert" className="rounded-2xl bg-fail/10 px-4 py-3 text-sm text-soft ring-1 ring-fail/25">
            <span className="font-semibold text-fail">Couldn&apos;t run the test.</span> {error}
          </p>
        )}

        <button type="submit" disabled={!canSubmit} className="btn bg-iris px-6 py-3.5 text-xl text-paper-raised">
          {wantsSuggestions ? "Suggest materials" : "Run the test"}
        </button>
        {!canSubmit && <p className="-mt-3 text-center text-sm text-muted">Name the thing you want to test to start.</p>}
      </section>
    </form>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <NumberSticker n={n} />
      <h2 className="font-display text-2xl text-ink">{title}</h2>
    </div>
  );
}

/** A little hand-placed periwinkle sticker with a number on it. */
export function NumberSticker({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center rounded-[45%_55%_50%_50%] border-2 border-ink bg-iris-soft font-display text-lg text-ink shadow-[0_2px_0_var(--color-ink)]"
      style={{ rotate: `${n % 2 ? -7 : 6}deg` }}
    >
      {n}
    </span>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border-2 py-1 pl-1.5 pr-3 text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris ${
        on ? "border-ink bg-iris-soft text-ink shadow-[0_2px_0_var(--color-ink)]" : "border-ink/20 text-soft hover:border-ink/50"
      }`}
    >
      <span className={`relative h-5 w-9 rounded-full border-2 border-ink transition-colors ${on ? "bg-iris" : "bg-paper-raised"}`}>
        <motion.span
          className="absolute top-0.5 size-3 rounded-full border-[1.5px] border-ink bg-paper-raised"
          animate={{ left: on ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 600, damping: 28 }}
        />
      </span>
      {label}
    </button>
  );
}

/**
 * Slider positions map to these temperatures: fine steps where everyday life happens,
 * big jumps out at the extremes, so a 15 to 60 °C range isn't a tiny sliver of track.
 */
const TEMP_STOPS = (() => {
  const stops: number[] = [];
  const add = (from: number, to: number, step: number) => {
    for (let t = from; t <= to; t += step) if (stops.at(-1) !== t) stops.push(t);
  };
  add(TEMP_RANGE.min, -50, 10);
  add(-50, 150, 5);
  add(150, 400, 10);
  add(400, TEMP_RANGE.max, 25);
  return stops;
})();
const LAST_STOP = TEMP_STOPS.length - 1;

const stopFor = (t: number) => {
  let best = 0;
  TEMP_STOPS.forEach((s, i) => {
    if (Math.abs(s - t) < Math.abs(TEMP_STOPS[best] - t)) best = i;
  });
  return best;
};

/** One track, two handles: coldest and hottest. The chosen range is lit up. */
function TemperatureRange({ min, max, onChange }: { min: number; max: number; onChange: (lo: number, hi: number) => void }) {
  const loId = useId();
  const lo = stopFor(min);
  const hi = stopFor(max);
  const pct = (i: number) => (i / LAST_STOP) * 100;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={loId} className="text-sm font-semibold text-soft">
          Temperature
        </label>
        <p className="text-sm text-ink" aria-hidden>
          <span className="font-display text-lg">{min} °C</span> <span className="marker font-display italic">{tempVibe(min)}</span>
          <span className="mx-2 text-muted">to</span>
          <span className="font-display text-lg">{max} °C</span> <span className="marker font-display italic">{tempVibe(max)}</span>
        </p>
      </div>
      <div className="relative h-8">
        {/* Track: the full cold-to-hot gradient, dimmed outside the chosen range. */}
        <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full border-2 border-ink bg-[linear-gradient(90deg,#a9c3e6,#c4c1ef_22%,#efe9de_40%,#e6c27a_62%,#e59a86_82%,#c9583f)]">
          <div className="absolute inset-y-0 left-0 bg-paper-raised/60" style={{ width: `${pct(lo)}%` }} />
          <div className="absolute inset-y-0 right-0 bg-paper-raised/60" style={{ width: `${100 - pct(hi)}%` }} />
        </div>
        <input
          id={loId}
          type="range"
          className="temp-dual"
          min={0}
          max={LAST_STOP}
          step={1}
          value={lo}
          aria-label="Coldest temperature"
          aria-valuetext={`${min} degrees Celsius, ${tempVibe(min)}`}
          onChange={(e) => onChange(TEMP_STOPS[Math.min(Number(e.target.value), hi)], max)}
        />
        <input
          type="range"
          className="temp-dual"
          min={0}
          max={LAST_STOP}
          step={1}
          value={hi}
          aria-label="Hottest temperature"
          aria-valuetext={`${max} degrees Celsius, ${tempVibe(max)}`}
          onChange={(e) => onChange(min, TEMP_STOPS[Math.max(Number(e.target.value), lo)])}
        />
      </div>
    </div>
  );
}

const PASTELS = ["#c4c1ef", "#a9c3e6", "#9cc9ae", "#e6c27a", "#f2c4a8", "#e59a86"];

/** A stable pastel for materials we don't have a color for. */
function colorFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PASTELS[h % PASTELS.length];
}

/** The sample, reacting live to the conditions, with a plain-language summary of the setup. */
function SamplePreview({
  setup,
  color,
  lastChange,
  compact = false,
  className = "",
}: {
  setup: Setup;
  color?: string;
  lastChange: { key: number; line: string | null };
  compact?: boolean;
  className?: string;
}) {
  const look = reactionTo(setup);
  const line = lastChange.line ?? look.line;
  const name = setup.material.trim();
  const load = LOAD_LEVELS.find((l) => l.id === setup.load)?.label.toLowerCase() ?? "";
  const extras = setup.toggles.map((t) => TOGGLE_LABEL[t]?.toLowerCase()).filter(Boolean);
  const summary = `${setup.component.trim() || "Your thing"}${name ? ` made of ${name}` : ""}, from ${setup.tempMin} to ${setup.tempMax} °C, ${load} force${
    extras.length ? `, ${extras.join(", ")}` : ""
  }.`;

  return (
    <section aria-label="Preview of your sample" className={`card flex-col items-center gap-3 p-5 text-center ${compact ? "flex-row text-left" : ""} ${className}`}>
      <div className="relative flex shrink-0 flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={`${lastChange.key}-${line}`}
            initial={{ opacity: 0, y: 6, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            className="mb-1 rounded-2xl border-2 border-ink bg-paper-raised px-3 py-0.5 font-display text-sm italic text-ink shadow-[0_2px_0_var(--color-ink)]"
            aria-hidden
          >
            {line}
          </motion.p>
        </AnimatePresence>
        <motion.div
          key={lastChange.key}
          initial={{ scaleY: 0.85, scaleX: 1.1 }}
          animate={{ scaleY: 1, scaleX: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 12 }}
          style={{ originY: 1 }}
        >
          <Specimen color={color ?? colorFor(name || setup.component)} finish="gloss" look={look} size={compact ? 84 : 150} />
        </motion.div>
      </div>
      <div className="min-w-0">
        {!compact && <p className="font-display text-sm italic text-muted">your sample</p>}
        <p className="text-sm leading-relaxed text-soft">{summary}</p>
      </div>
    </section>
  );
}

function reactionTo(s: Setup): SpecimenLook & { line: string } {
  const wet = s.toggles.some((t) => t === "wet" || t === "salt" || t === "dishwasher");
  const rough = s.toggles.includes("drop") && (s.load === "heavy" || s.load === "extreme");
  const glow = s.toggles.includes("radiation") ? { tint: "#a3e635", tintOpacity: 0.25 } : {};
  if (s.tempMax >= 900) return { mood: "dizzy", sweat: true, tint: "#c9583f", tintOpacity: 0.55, cracks: rough, line: "too hot!!" };
  if (s.tempMax >= 250) return { mood: "worried", sweat: true, tint: "#e59a86", tintOpacity: 0.45, cracks: rough, line: "sweating" };
  if (s.tempMin <= -150) return { mood: "dizzy", frost: true, tint: "#a9c3e6", tintOpacity: 0.4, cracks: rough, line: "frozen solid" };
  if (s.tempMin <= -20) return { mood: "worried", frost: true, sweat: wet, cracks: rough, ...glow, line: "brrr" };
  if (s.load === "extreme" || rough) return { mood: "worried", sweat: wet, cracks: rough, ...glow, line: "this is a lot" };
  if (s.tempMax >= 80) return { mood: "happy", sweat: true, ...glow, line: "toasty" };
  return { mood: "happy", sweat: wet, ...glow, line: "comfy" };
}
