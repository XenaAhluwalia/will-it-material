"use client";

import { motion } from "framer-motion";
import type { StageVisual, Status } from "@/types/screening";

/** Background colors for each stage of the chamber window. */
export const STAGE_BACKDROP: Record<StageVisual, string> = {
  cold: "radial-gradient(120% 90% at 50% 0%, #46627a 0%, #2f2b36 72%)",
  heat: "radial-gradient(120% 90% at 50% 100%, #7a4128 0%, #2f2b36 72%)",
  stress: "radial-gradient(120% 90% at 50% 0%, #4f4a5e 0%, #2f2b36 72%)",
  radiation: "radial-gradient(120% 90% at 50% 50%, #465a32 0%, #2f2b36 72%)",
  corrosion: "radial-gradient(120% 90% at 50% 100%, #2f5a52 0%, #2f2b36 72%)",
};

const seeded = (i: number, n: number) => ((Math.sin(i * 91.7 + n * 13.3) * 10000) % 1 + 1) % 1;

/** Decorative environment effects layered behind the specimen. Illustrative only. */
export function StageEffects({ stage, intensity }: { stage: StageVisual; intensity: 0 | 1 | 2 }) {
  // intensity: 0 = ramping in, 1 = full test, 2 = full test + failure drama
  switch (stage) {
    case "cold":
      return (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 18 }, (_, i) => (
            <motion.span
              key={i}
              className="absolute text-sky-100"
              style={{ left: `${seeded(i, 1) * 100}%`, fontSize: 10 + seeded(i, 2) * 14 }}
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 360, opacity: [0, 1, 1, 0], rotate: 180 }}
              transition={{ duration: 3 + seeded(i, 3) * 2, delay: seeded(i, 4) * 2, repeat: Infinity, ease: "linear" }}
            >
              ❄
            </motion.span>
          ))}
          <motion.div
            className="absolute inset-0 bg-sky-200/10"
            animate={{ opacity: intensity ? [0.2, 0.5, 0.2] : 0.1 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      );
    case "heat":
      return (
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-orange-500/50 to-transparent"
            animate={{ opacity: intensity === 2 ? [0.6, 1, 0.6] : [0.4, 0.7, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <div className="absolute inset-x-0 bottom-1 flex justify-around text-3xl">
            {Array.from({ length: 7 }, (_, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -10, 0], scale: intensity ? [1, 1.25, 1] : 0.8 }}
                transition={{ duration: 0.6 + seeded(i, 1) * 0.4, repeat: Infinity, delay: seeded(i, 2) * 0.4 }}
              >
                🔥
              </motion.span>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, i) => (
            <motion.span
              key={`w${i}`}
              className="absolute h-10 w-1 rounded-full bg-orange-200/30 blur-[1px]"
              style={{ left: `${10 + i * 16}%` }}
              initial={{ bottom: "10%", opacity: 0 }}
              animate={{ bottom: ["10%", "90%"], opacity: [0, 0.8, 0] }}
              transition={{ duration: 1.6, delay: i * 0.25, repeat: Infinity }}
            />
          ))}
        </div>
      );
    case "stress":
      return (
        <div className="absolute inset-0 overflow-hidden">
          {[20, 80].map((x) => (
            <motion.span
              key={x}
              className="absolute top-1/3 text-3xl text-violet-200/70"
              style={{ left: `${x}%` }}
              animate={{ y: intensity ? [0, 14, 0] : 0 }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              ⬇
            </motion.span>
          ))}
          {/* anvil base */}
          <div className="absolute inset-x-[30%] bottom-[14%] h-3 rounded-full bg-slate-400/60" />
        </div>
      );
    case "radiation":
      return (
        <div className="absolute inset-0 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-lime-300/60"
              animate={{ scale: [0.4, 4], opacity: [0.8, 0] }}
              transition={{ duration: 2, delay: i * 0.66, repeat: Infinity, ease: "easeOut" }}
            />
          ))}
          {intensity === 2 && (
            <motion.div className="absolute inset-0 bg-lime-300/20" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.35, repeat: Infinity }} />
          )}
        </div>
      );
    case "corrosion":
      return (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 16 }, (_, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full border-2 border-teal-200/60 bg-teal-200/10"
              style={{ left: `${seeded(i, 1) * 100}%`, width: 8 + seeded(i, 2) * 16, height: 8 + seeded(i, 2) * 16 }}
              initial={{ bottom: -20, opacity: 0 }}
              animate={{ bottom: ["-5%", "105%"], opacity: [0, 1, 0], x: [0, 8, -8, 0] }}
              transition={{ duration: 2.5 + seeded(i, 3) * 2, delay: seeded(i, 4) * 2, repeat: Infinity }}
            />
          ))}
        </div>
      );
  }
}

/** The verdict bubble that pops in above the specimen. */
export function VerdictBadge({ status }: { status: Status }) {
  const style =
    status === "PASS"
      ? { bg: "#9cc9ae", icon: "✓" }
      : status === "WARNING"
        ? { bg: "#e6c27a", icon: "!" }
        : { bg: "#e59a86", icon: "✕" };
  return (
    <motion.div
      initial={{ scale: 0, rotate: -40, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 14 }}
      className="grid size-14 place-items-center rounded-full text-2xl font-bold text-chamber-deep ring-4 ring-white/25"
      style={{ background: style.bg }}
      aria-hidden
    >
      {style.icon}
    </motion.div>
  );
}
