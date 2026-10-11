"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import type { Identification } from "@/types/identify";
import { fetchIdentification, photoToBase64, type IdentifyInput } from "@/lib/identify/client";
import { describePhoto, onVisionStatus, shrinkPhoto, warmUpVision, type VisionStatus } from "@/lib/vision/client";
import { Specimen } from "@/components/chamber/Specimen";

type Stage = "idle" | "looking" | "asking" | "done" | "error";

const ON_DEVICE_KEY = "wim:photo-on-device";

interface Props {
  onTest: (id: Identification) => void;
  onSuggestBetter: (id: Identification) => void;
}

/**
 * "Snap a photo", two modes:
 * - On-device (default): a small vision model in this browser describes the photo and
 *   Claude only gets that text. The photo never leaves the device.
 * - Fast: the photo is shrunk and sent to Claude, used for that one request and not stored.
 */
export function PhotoPanel({ onTest, onSuggestBetter }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  /** What we sent to Claude for the current photo, reused for corrections. */
  const [input, setInput] = useState<IdentifyInput | null>(null);
  const [result, setResult] = useState<Identification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [onDevice, setOnDevice] = useState(true);
  const [vision, setVision] = useState<VisionStatus>({ percent: null, ready: false, device: null });

  useEffect(() => () => void (photoUrl && URL.revokeObjectURL(photoUrl)), [photoUrl]);
  useEffect(() => onVisionStatus(setVision), []);
  useEffect(() => {
    try {
      if (localStorage.getItem(ON_DEVICE_KEY) === "off") setOnDevice(false);
    } catch {
      // Storage blocked: keep the default.
    }
  }, []);
  // Start the one-time model download as soon as on-device mode is showing, so it's
  // (partly) ready by the time a photo is chosen.
  useEffect(() => {
    if (onDevice) warmUpVision();
  }, [onDevice]);

  const chooseMode = (next: boolean) => {
    setOnDevice(next);
    try {
      localStorage.setItem(ON_DEVICE_KEY, next ? "on" : "off");
    } catch {
      // Storage blocked: the choice lasts until the page reloads.
    }
  };

  const ask = async (what: IdentifyInput, correction?: string) => {
    setStage("asking");
    setError(null);
    try {
      setResult(await fetchIdentification(what, correction));
      setStage("done");
    } catch (e) {
      setStage("error");
      setError(e instanceof Error ? e.message : "Couldn't identify it.");
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPhotoUrl(URL.createObjectURL(file));
    setResult(null);
    setInput(null);
    setError(null);
    setStage("looking");
    let what: IdentifyInput;
    try {
      if (onDevice) {
        const description = await describePhoto(await shrinkPhoto(file));
        if (!description) throw new Error("empty");
        what = { description };
      } else {
        what = { image: await photoToBase64(file) };
      }
    } catch {
      setStage("error");
      setError(
        onDevice
          ? "The on-device model couldn't read that photo. Try another one, with one object filling the frame."
          : "We couldn't open that photo. Try a JPEG or PNG.",
      );
      return;
    }
    setInput(what);
    await ask(what);
  };

  /** Ask again with the student's own correction ("it's a metal water bottle"). */
  const correct = (correction: string) => input && ask(input, correction);

  /** Swap in one of the runner-up materials as the main guess. */
  const pickAlternative = (name: string) =>
    setResult((r) => (r ? { ...r, material: name, alternatives: [r.material, ...r.alternatives.filter((a) => a !== name)].slice(0, 2) } : r));

  const reset = () => {
    setPhotoUrl(null);
    setStage("idle");
    setResult(null);
    setError(null);
    setInput(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const deviceRun = input ? "description" in input : onDevice;
  const downloading = stage === "looking" && deviceRun && !vision.ready;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {stage === "idle" ? (
        <>
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`card flex cursor-pointer flex-col items-center gap-4 border-2 border-dashed p-10 text-center transition-colors ${
              dragging ? "border-iris bg-iris-soft/40" : "border-ink/30 hover:border-ink/60"
            }`}
          >
            <CameraIcon />
            <span className="font-display text-3xl text-ink">Snap or drop a photo</span>
            <span className="max-w-md text-soft">
              One object, filling most of the frame, works best. We&apos;ll guess what it&apos;s made of and whether something else would do better.
            </span>
            <span className="btn mt-1 bg-iris px-6 py-2.5 text-lg text-paper-raised">Choose a photo</span>
            <span className="text-sm text-muted">
              {onDevice ? (
                <>
                  <span className="marker font-display italic text-ink">stays on your device</span> A tiny AI model looks at it right here in
                  your browser.
                </>
              ) : (
                "Your photo is shrunk, checked by Claude and not saved."
              )}
            </span>
          </label>
          <ModeSwitch onDevice={onDevice} onChange={chooseMode} vision={vision} />
        </>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,15rem)_1fr]">
          {photoUrl && (
            <motion.figure
              initial={{ rotate: -8, scale: 0.9, opacity: 0 }}
              animate={{ rotate: -3, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="mx-auto w-full max-w-60 rounded-md border-2 border-ink bg-paper-raised p-2.5 pb-8 shadow-[0_4px_0_var(--color-ink)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={photoUrl} alt="Your photo" className="aspect-square w-full rounded-sm object-cover" />
              <figcaption className="mt-2 text-center font-display text-sm italic text-soft">your photo</figcaption>
            </motion.figure>
          )}

          <div className="flex min-w-0 flex-col gap-3" aria-live="polite">
            {deviceRun ? (
              <>
                <Step
                  done={stage !== "looking"}
                  active={stage === "looking"}
                  label={downloading ? "Waking up the on-device model" : stage === "looking" ? "Your device is looking at your photo" : "Your device saw:"}
                >
                  {downloading && (
                    <div className="mt-2">
                      <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-paper-raised">
                        <motion.div className="h-full bg-iris" animate={{ width: `${vision.percent ?? 2}%` }} />
                      </div>
                      <p className="mt-1 text-sm text-muted">One-time download ({vision.percent ?? 0}%). After this it works much faster.</p>
                    </div>
                  )}
                  {input && "description" in input && (
                    <>
                      <p className="mt-1 font-display text-lg italic text-ink">&ldquo;{input.description}&rdquo;</p>
                      <p className="mt-1 text-xs text-muted">
                        Seen on this device{vision.device === "wasm" ? " (CPU mode, a bit slower)" : ""}. The photo wasn&apos;t uploaded.
                      </p>
                    </>
                  )}
                </Step>
                {(stage === "asking" || stage === "done") && (
                  <Step done={stage === "done"} active={stage === "asking"} label={stage === "asking" ? "Working out the material" : "Best guess"} />
                )}
              </>
            ) : (
              <Step done={stage === "done"} active={stage === "looking" || stage === "asking"} label={stage === "done" ? "Looked at your photo" : "Looking at your photo"}>
                {result && <p className="mt-1 font-display text-lg italic text-ink">&ldquo;{result.seen}&rdquo;</p>}
              </Step>
            )}

            <AnimatePresence>
              {result && stage === "done" && (
                <ResultCard key="result" result={result} onTest={onTest} onSuggestBetter={onSuggestBetter} onPick={pickAlternative} onCorrect={correct} />
              )}
            </AnimatePresence>

            {error && (
              <p role="alert" className="rounded-2xl bg-fail/10 px-4 py-3 text-sm text-soft ring-1 ring-fail/25">
                <span className="font-semibold text-fail">Hmm.</span> {error}
              </p>
            )}

            {(stage === "done" || stage === "error") && (
              <button type="button" onClick={reset} className="btn self-start bg-paper-raised px-5 py-1.5 text-base text-ink">
                Try another photo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModeSwitch({ onDevice, onChange, vision }: { onDevice: boolean; onChange: (v: boolean) => void; vision: VisionStatus }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={onDevice}
        onClick={() => onChange(!onDevice)}
        className="flex items-center gap-2.5 rounded-full border-2 border-ink/20 bg-paper-raised/80 px-3 py-1.5 font-semibold text-ink transition-colors hover:border-ink/50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris"
      >
        <span aria-hidden className={`relative h-5 w-9 rounded-full border-2 border-ink transition-colors ${onDevice ? "bg-iris" : "bg-paper"}`}>
          <motion.span className="absolute top-0.5 size-3 rounded-full bg-ink" animate={{ left: onDevice ? 18 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
        </span>
        Keep my photo on this device
      </button>
      <span className="text-muted">
        {onDevice
          ? vision.ready
            ? "Model ready."
            : vision.percent !== null
              ? `Getting the model ready… ${vision.percent}%`
              : "Private, slower the first time."
          : "Faster: the photo is sent to Claude."}
      </span>
    </div>
  );
}

function Step({ done, active, label, children }: { done: boolean; active: boolean; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 border-ink text-xs font-bold ${
          done ? "bg-iris-soft text-ink" : "bg-paper-raised"
        }`}
      >
        {done ? "✓" : active ? <motion.span className="size-2 rounded-full bg-iris" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} /> : ""}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-soft">{label}</p>
        {children}
      </div>
    </div>
  );
}

const CONFIDENCE = { low: "a rough guess", medium: "fairly sure", high: "pretty confident" } as const;

function ResultCard({
  result: r,
  onTest,
  onSuggestBetter,
  onPick,
  onCorrect,
}: {
  result: Identification;
  onTest: (id: Identification) => void;
  onSuggestBetter: (id: Identification) => void;
  onPick: (material: string) => void;
  onCorrect: (correction: string) => void;
}) {
  const [fix, setFix] = useState("");
  const fixId = useId();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 14 }}>
          <Specimen color="#c4c1ef" finish="gloss" look={{ mood: "happy" }} size={56} />
        </motion.div>
        <div className="min-w-0">
          <p className="text-sm text-muted">{r.component}, probably made of</p>
          <p className="font-display text-3xl leading-tight text-ink">{r.material}</p>
          <span className="marker font-display text-sm italic text-ink">{CONFIDENCE[r.confidence]}</span>
        </div>
      </div>
      {r.alternatives.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-muted">Could also be</span>
          {r.alternatives.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onPick(a)}
              className="rounded-full border-2 border-ink/20 px-2.5 py-0.5 text-soft transition-colors hover:border-ink/50 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris"
            >
              {a}
            </button>
          ))}
        </div>
      )}
      <p className="text-soft">{r.reasoning}</p>
      <p className="text-sm text-soft">
        <span className="font-semibold">Check it yourself:</span> {r.checkTip}
      </p>
      {r.better && (
        <p className="rounded-2xl border-2 border-dashed border-iris/50 bg-iris-soft/25 px-3 py-2 text-sm text-soft">
          <span className="font-display text-base italic text-ink">Could be better as {r.better.name}.</span> {r.better.why}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={() => onTest(r)} className="btn bg-iris px-5 py-2 text-lg text-paper-raised">
          Test it
        </button>
        <button type="button" onClick={() => onSuggestBetter(r)} className="btn bg-paper-raised px-5 py-2 text-lg text-ink">
          Suggest better materials
        </button>
      </div>
      <form
        className="mt-1 border-t-2 border-dashed border-sand pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (fix.trim()) onCorrect(fix.trim());
        }}
      >
        <label htmlFor={fixId} className="mb-1.5 block font-display text-sm italic text-muted">
          Not quite right? Tell us what it really is
        </label>
        <div className="flex gap-2">
          <input
            id={fixId}
            value={fix}
            maxLength={200}
            onChange={(e) => setFix(e.target.value)}
            placeholder="e.g. it's a metal water bottle"
            className="min-w-0 flex-1 rounded-full border-2 border-ink/20 bg-paper-raised/80 px-4 py-1.5 text-ink placeholder:text-muted focus:border-iris focus:outline-none"
          />
          <button type="submit" disabled={!fix.trim()} className="btn shrink-0 bg-paper-raised px-4 py-1 text-base text-ink">
            Fix it
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function CameraIcon() {
  return (
    <svg aria-hidden width="72" height="60" viewBox="0 0 72 60" className="-rotate-6">
      <rect x="4" y="14" width="64" height="42" rx="10" fill="#c4c1ef" stroke="#2d2a30" strokeWidth="3" />
      <path d="M24 14 L28 6 H44 L48 14" fill="#efe9de" stroke="#2d2a30" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="36" cy="35" r="12" fill="#efe9de" stroke="#2d2a30" strokeWidth="3" />
      <circle cx="36" cy="35" r="5" fill="#2d2a30" />
      <circle cx="38" cy="33" r="1.6" fill="#ffffff" />
      <circle cx="57" cy="23" r="2.5" fill="#2d2a30" />
    </svg>
  );
}
