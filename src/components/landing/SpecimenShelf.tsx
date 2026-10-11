"use client";

import { AnimatePresence, MotionConfig, motion, useAnimationControls } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Specimen, type SpecimenLook } from "@/components/chamber/Specimen";
import type { SurfaceFinish } from "@/types/material";

interface Sample {
  name: string;
  /** Material name to pre-fill on the explore page. */
  material: string;
  color: string;
  accent: string;
  finish: SurfaceFinish;
  look: SpecimenLook;
  /** What it says when poked, and how it looks while saying it. */
  poke: { line: string; look: SpecimenLook };
  show?: string;
}

const LINEUP: Sample[] = [
  {
    name: "Titanium",
    material: "Ti-6Al-4V",
    color: "#7f8b96",
    accent: "#d6dde3",
    finish: "metallic",
    look: { mood: "happy" },
    poke: { line: "Is that all you've got?", look: { mood: "happy" } },
    show: "hidden sm:flex",
  },
  {
    name: "Copper",
    material: "Copper C110",
    color: "#c97b4b",
    accent: "#ffd2b0",
    finish: "metallic",
    look: { mood: "happy" },
    poke: { line: "Ow! I conduct feelings too.", look: { mood: "worried" } },
  },
  {
    name: "Glass",
    material: "Borosilicate Glass",
    color: "#cbe6f2",
    accent: "#ffffff",
    finish: "gloss",
    look: { mood: "happy" },
    poke: { line: "GENTLY!! I'm brittle!!", look: { mood: "worried", cracks: true } },
  },
  {
    name: "Oak",
    material: "Oak",
    color: "#b7854f",
    accent: "#f3dcb8",
    finish: "matte",
    look: { mood: "happy" },
    poke: { line: "Knock knock. It's wood.", look: { mood: "happy" } },
    show: "hidden min-[400px]:flex",
  },
  {
    name: "PLA",
    material: "PLA (3D-printing plastic)",
    color: "#f472b6",
    accent: "#ffffff",
    finish: "gloss",
    look: { mood: "happy" },
    poke: { line: "Boing! Just don't leave me in a hot car.", look: { mood: "happy", sweat: true } },
    show: "hidden sm:flex",
  },
  {
    name: "Chocolate",
    material: "Milk chocolate",
    color: "#6b4430",
    accent: "#c79a7c",
    finish: "gloss",
    look: { mood: "worried", sweat: true },
    poke: { line: "Your finger is warm. I'm melting.", look: { mood: "dizzy", sweat: true, tint: "#3d2318", tintOpacity: 0.4 } },
  },
];

const TOO_MANY = { line: "Okay, that's enough poking.", look: { mood: "dizzy" } as SpecimenLook };

interface Speech {
  index: number;
  line: string;
  look: SpecimenLook;
}

/**
 * A row of material samples on a shelf. Their eyes follow the cursor; poke one and it reacts.
 * Only one bubble shows at a time: hovering or poking another sample, or tapping anywhere
 * else, closes the previous one straight away.
 */
export function SpecimenShelf() {
  const listRef = useRef<HTMLUListElement>(null);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [gazes, setGazes] = useState<{ x: number; y: number }[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [speech, setSpeech] = useState<Speech | null>(null);
  const pokes = useRef<number[]>([]);
  const timer = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setGazes(
          refs.current.map((el) => {
            if (!el) return { x: 0, y: 0 };
            const r = el.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            const d = Math.max(Math.hypot(dx, dy), 1);
            const reach = Math.min(d / 160, 1);
            return { x: (dx / d) * reach, y: (dy / d) * reach };
          }),
        );
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Tapping anywhere outside the shelf closes the bubble.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!listRef.current?.contains(e.target as Node)) setSpeech(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.clearTimeout(timer.current);
    };
  }, []);

  const hover = (i: number | null) => {
    setHovered(i);
    if (i !== null) setSpeech((sp) => (sp && sp.index !== i ? null : sp));
  };

  const poke = (i: number) => {
    const now = Date.now();
    // Rapid pokes on the same sample add up; switching samples starts a fresh count.
    const recent = speech?.index === i ? pokes.current.filter((t) => now - t < 4000) : [];
    pokes.current = [...recent, now];
    const said = pokes.current.length >= 4 ? TOO_MANY : LINEUP[i].poke;
    setSpeech({ index: i, ...said });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSpeech(null), 3200);
  };

  return (
    <MotionConfig reducedMotion="user">
      <ul ref={listRef} className="flex items-end justify-center gap-4 border-b-2 border-sand px-2 sm:gap-6" aria-label="Example materials. Poke one!">
        {LINEUP.map((m, i) => (
          <ShelfItem
            key={m.name}
            sample={m}
            index={i}
            gaze={gazes[i]}
            said={speech?.index === i ? speech : null}
            showPickMe={hovered === i && speech?.index !== i}
            onHover={(on) => hover(on ? i : hovered === i ? null : hovered)}
            onPoke={() => poke(i)}
            ref={(el) => void (refs.current[i] = el)}
          />
        ))}
      </ul>
    </MotionConfig>
  );
}

function ShelfItem({
  sample: m,
  index,
  gaze,
  said,
  showPickMe,
  onHover,
  onPoke,
  ref,
}: {
  sample: Sample;
  index: number;
  gaze?: { x: number; y: number };
  said: Speech | null;
  showPickMe: boolean;
  onHover: (on: boolean) => void;
  onPoke: () => void;
  ref: (el: HTMLLIElement | null) => void;
}) {
  const squish = useAnimationControls();

  const poke = () => {
    onPoke();
    squish.start({ scaleY: [1, 0.72, 1.12, 0.95, 1], scaleX: [1, 1.2, 0.92, 1.03, 1], transition: { duration: 0.55 } });
  };

  return (
    <motion.li
      ref={ref}
      className={`relative flex-col items-center ${m.show ?? "flex"}`}
      initial={{ y: -36, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.35 + index * 0.12, type: "spring", stiffness: 380, damping: 15 }}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      <AnimatePresence initial={false}>
        {(said || showPickMe) && (
          <motion.div
            key={said ? `said-${said.line}` : "pick"}
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            // Leave instantly, so a closing bubble never overlaps the next one.
            exit={{ opacity: 0, transition: { duration: 0 } }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute bottom-full left-1/2 z-20 mb-1 w-max max-w-[11rem] -translate-x-1/2 rounded-2xl border-2 border-ink bg-paper-raised px-2.5 py-1 text-center shadow-[0_3px_0_var(--color-ink)]"
          >
            {said ? (
              <>
                <span role="status" className="block font-display text-sm italic leading-snug text-ink">
                  {said.line}
                </span>
                <Link
                  href={`/explore?material=${encodeURIComponent(m.material)}`}
                  className="mt-0.5 inline-block text-xs font-semibold text-iris underline decoration-iris/40 underline-offset-2 hover:decoration-iris"
                >
                  Test me
                </Link>
              </>
            ) : (
              <span className="font-display text-sm italic text-ink">pick me!</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={poke}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        animate={squish}
        whileHover={{ y: -4, rotate: index % 2 ? 3 : -3 }}
        style={{ originY: 1 }}
        aria-label={`Poke ${m.name}`}
        className="w-16 cursor-pointer rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris sm:w-[5.5rem] lg:w-24 [&_svg]:h-auto [&_svg]:w-full"
      >
        <Specimen color={m.color} accent={m.accent} finish={m.finish} look={said?.look ?? m.look} gaze={gaze} size={96} />
      </motion.button>
      <span className="pb-2 font-display text-sm italic text-soft">{m.name}</span>
    </motion.li>
  );
}
