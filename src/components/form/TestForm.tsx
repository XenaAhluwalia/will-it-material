"use client";

import { motion } from "framer-motion";
import { useId, useState } from "react";
import type { MaterialSuggestion } from "@/types/material";
import {
  CONDITION_TOGGLES,
  EXAMPLES,
  LOAD_LEVELS,
  TEMP_RANGE,
  sameSetup,
  tempVibe,
  type Setup,
} from "@/lib/screening/presets";
import { Specimen, type SpecimenLook } from "@/components/chamber/Specimen";
import { MaterialCombobox } from "./MaterialCombobox";

interface Props {
  suggestions: MaterialSuggestion[];
  initial: Setup;
  error?: string | null;
  onSubmit: (setup: Setup) => void;
}

const INPUT =
  "worksheet-input w-full rounded-2xl border-2 border-ink/20 bg-paper-raised/80 px-4 py-3 font-medium text-ink placeholder:text-muted focus:border-iris focus:outline-none";

export function TestForm({ suggestions, initial, error, onSubmit }: Props) {
  const [setup, setSetup] = useState<Setup>(initial);
  const set = <K extends keyof Setup>(key: K, value: Setup[K]) => setSetup((s) => ({ ...s, [key]: value }));
  const componentId = useId();
  const notesId = useId();

  const canSubmit = setup.component.trim().length > 0 && setup.material.trim().length > 0;
  const selectedExample = EXAMPLES.find((e) => sameSetup(e, setup))?.id;
  const known = suggestions.find((m) => m.name.toLowerCase() === setup.material.trim().toLowerCase());

  const toggle = (id: string) =>
    set("toggles", setup.toggles.includes(id) ? setup.toggles.filter((t) => t !== id) : [...setup.toggles, id]);

  return (
    <form
      className="test-worksheet flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ ...setup, component: setup.component.trim(), material: setup.material.trim(), notes: setup.notes.trim() });
      }}
    >
      <section className="example-shelf" aria-labelledby="examples-heading">
        <h2 id="examples-heading" className="mb-2 font-display text-lg italic text-soft">
          A little inspiration
        </h2>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => {
            const on = ex.id === selectedExample;
            return (
              <button
                key={ex.id}
                type="button"
                aria-pressed={on}
                onClick={() => setSetup({ ...ex, toggles: [...ex.toggles] })}
                className={`example-chip px-4 py-1.5 text-base ${on ? "bg-iris-soft text-ink" : "bg-paper-raised text-ink"}`}
              >
                {ex.title}
              </button>
            );
          })}
        </div>
      </section>

      <div className="worksheet-grid">
        <section className="card specimen-card flex flex-col gap-5">
          <StepTitle n={1} title="Meet your specimen" />
          <div className="specimen-preview">
            <span className="worksheet-eyebrow">MATERIAL SAMPLE / 01</span>
            <div className="specimen-preview-art"><Specimen color={known?.color ?? "#c4c1ef"} finish="gloss" look={reactionTo(setup.tempMin, setup.tempMax)} size={132} /></div>
            <span className="font-display text-lg italic">A small thing. A big experiment.</span>
          </div>
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
            <MaterialCombobox suggestions={suggestions} value={setup.material} onChange={(v) => set("material", v)} />
            <p className="mt-2 text-sm text-muted">Anything works, even &ldquo;cheese&rdquo;.</p>
          </div>
        </section>

        <section className="card conditions-card flex flex-col gap-6">
          <StepTitle n={2} title="Give it a little real life" />

          <TemperaturePicker
            min={setup.tempMin}
            max={setup.tempMax}
            onChange={(lo, hi) => setSetup((s) => ({ ...s, tempMin: lo, tempMax: hi }))}
            name={setup.material.trim() || "your material"}
          />

          <fieldset className="worksheet-section">
            <legend className="mb-2 text-sm font-semibold text-soft">How much force?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LOAD_LEVELS.map((l) => {
                const on = setup.load === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("load", l.id)}
                    title={l.text}
                    className={`force-option px-3 py-2 text-base ${on ? "bg-iris text-paper-raised" : "bg-paper-raised text-ink"}`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="worksheet-section">
            <legend className="mb-1 text-sm font-semibold text-soft">What will it encounter?</legend>
            <p className="mb-4 text-xs text-muted">Pick everything that belongs in its day-to-day.</p>
            {[
              { name: "Everyday encounters", ids: ["wet", "salt", "dishwasher", "food", "skin", "sun", "chemicals"] },
              { name: "Wear & tear", ids: ["repeat", "drop"] },
              { name: "Special missions", ids: ["vacuum", "radiation", "light", "cheap"] },
            ].map((group) => (
              <div className="condition-group" key={group.name}>
                <p className="condition-group-label">{group.name}</p>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_TOGGLES.filter((t) => group.ids.includes(t.id)).map((t) => (
                    <Toggle key={t.id} label={t.label} on={setup.toggles.includes(t.id)} onClick={() => toggle(t.id)} />
                  ))}
                </div>
              </div>
            ))}
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

          {error && (
            <p role="alert" className="rounded-2xl bg-fail/10 px-4 py-3 text-sm text-soft ring-1 ring-fail/25">
              <span className="font-semibold text-fail">Couldn&apos;t run the test.</span> {error}
            </p>
          )}

          <button type="submit" disabled={!canSubmit} className="btn run-test bg-iris px-6 py-3.5 text-xl text-paper-raised">
            Run the test <span aria-hidden>↗</span>
          </button>
          {!canSubmit && <p className="-mt-3 text-center text-sm text-muted">Name a thing and a material to start.</p>}
        </section>
      </div>
    </form>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="step-heading flex items-center gap-3">
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
      className={`condition-toggle group inline-flex items-center gap-2 rounded-full border-2 py-1 pl-1.5 pr-3 text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris ${
        on ? "border-ink bg-iris-soft text-ink shadow-[0_2px_0_var(--color-ink)]" : "border-ink/25 text-soft hover:border-ink/60"
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

/** Coldest/hottest sliders, with a little preview of the material reacting to the extremes. */
function TemperaturePicker({
  min,
  max,
  onChange,
  name,
}: {
  min: number;
  max: number;
  onChange: (lo: number, hi: number) => void;
  name: string;
}) {
  const look = reactionTo(min, max);
  return (
    <div className="temperature-panel">
      <div className="temperature-heading"><span className="text-sm font-semibold">Temperature range</span><span className="font-display text-sm italic text-muted">From brrr to sizzling.</span></div>
      <div className="flex-1 space-y-3">
        <TempSlider label="Coldest" value={min} onChange={(v) => onChange(v, Math.max(v, max))} />
        <TempSlider label="Hottest" value={max} onChange={(v) => onChange(Math.min(v, min), v)} />
      </div>
      <p className="temperature-caption">{name} <span aria-hidden>·</span> {look.line} at these temperatures</p>
    </div>
  );
}

function TempSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-soft">
          {label}
        </label>
        <span className="text-sm">
          <span className="font-display text-lg text-ink">{value} °C</span>{" "}
          <span className="marker font-display italic text-ink">{tempVibe(value)}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="temp-range"
        min={TEMP_RANGE.min}
        max={TEMP_RANGE.max}
        step={TEMP_RANGE.step}
        value={value}
        aria-valuetext={`${value} degrees Celsius, ${tempVibe(value)}`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function reactionTo(min: number, max: number): SpecimenLook & { line: string } {
  if (max >= 900) return { mood: "dizzy", sweat: true, tint: "#c9583f", tintOpacity: 0.55, line: "too hot!!" };
  if (max >= 250) return { mood: "worried", sweat: true, tint: "#e59a86", tintOpacity: 0.45, line: "sweating" };
  if (min <= -150) return { mood: "dizzy", frost: true, tint: "#a9c3e6", tintOpacity: 0.4, line: "frozen solid" };
  if (min <= -20) return { mood: "worried", frost: true, line: "brrr" };
  if (max >= 80) return { mood: "happy", sweat: true, line: "toasty" };
  return { mood: "happy", line: "comfy" };
}
