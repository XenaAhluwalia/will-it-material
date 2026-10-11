"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useState } from "react";
import type { Doodle } from "@/types/doodle";
import { Face, type Mood } from "@/components/chamber/Specimen";

interface Props {
  /** undefined while sketching, null if no sketch could be made. */
  doodle: Doodle | null | undefined;
  name: string;
  mood?: Mood;
  size?: number;
}

/** The model's caricature of the object, with the app's shared face. Tap it to make it talk. */
export function ObjectDoodle({ doodle, name, mood = "happy", size = 128 }: Props) {
  const wobble = useAnimationControls();
  const [talking, setTalking] = useState(false);

  if (doodle === null) return null;
  if (doodle === undefined) return <Sketching size={size} name={name} />;

  const { x, y, size: faceSize } = doodle.face;
  const scale = faceSize / 56;

  const poke = () => {
    wobble.start({ rotate: [0, -10, 8, -5, 3, 0], scale: [1, 0.92, 1.06, 1], transition: { duration: 0.6 } });
    setTalking(true);
    window.setTimeout(() => setTalking(false), 2600);
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <AnimatePresence>
        {talking && doodle.caption && (
          <motion.p
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            role="status"
            className="absolute -top-3 left-1/2 z-10 w-max max-w-[14rem] -translate-x-1/2 -translate-y-full rounded-2xl border-2 border-ink bg-paper-raised px-3 py-1.5 font-display text-sm italic text-ink shadow-[0_3px_0_var(--color-ink)]"
          >
            {doodle.caption}
          </motion.p>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={poke}
        animate={wobble}
        aria-label={`Cartoon of the ${name}. Tap it to hear what it has to say.`}
        className="cursor-pointer rounded-3xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-iris"
        whileHover={{ rotate: -3, y: -2 }}
      >
        <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden className="overflow-visible">
          <ellipse cx="60" cy="114" rx="36" ry="4.5" fill="#2d2a30" opacity="0.18" />
          <g dangerouslySetInnerHTML={{ __html: doodle.svg }} />
          <g transform={`translate(${x} ${y}) scale(${scale}) translate(-60 -68)`}>
            <Face mood={mood} />
          </g>
        </svg>
      </motion.button>
    </div>
  );
}

/** Placeholder while the doodle is being drawn: a pencil scribbling a loop. */
function Sketching({ size, name }: { size: number; name: string }) {
  return (
    <div className="flex flex-col items-center gap-1" role="status">
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
        <motion.path
          d="M30 70 C 25 40, 60 25, 80 40 S 95 85, 60 88 S 28 80, 40 58 S 75 45, 78 66"
          fill="none"
          stroke="#2d2a30"
          strokeOpacity="0.45"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="4 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
      <span className="font-display text-sm italic text-muted">Sketching your {name.toLowerCase()}…</span>
    </div>
  );
}
