"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { statusFromScore } from "@/lib/screening/scoring";
import { STATUS_STYLE } from "./status";

/** Count-up number that animates whenever `value` changes. */
export function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, value, duration]);
  return <motion.span>{rounded}</motion.span>;
}

/** Animated ring gauge for a 0–100 score. */
export function ScoreGauge({ score, size = 168, label = "out of 100" }: { score: number; size?: number; label?: string }) {
  const stroke = Math.max(6, size * 0.05);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = STATUS_STYLE[statusFromScore(score)].hex;

  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(37 48 45 / 0.1)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display leading-none" style={{ color, fontSize: size * 0.32 }}>
          <AnimatedNumber value={score} />
        </span>
        <span className="mt-1 font-display text-sm italic text-muted">{label}</span>
      </div>
    </div>
  );
}

/** Horizontal animated bar for a 0–100 score. */
export function ScoreBar({ score, delay = 0 }: { score: number; delay?: number }) {
  const color = STATUS_STYLE[statusFromScore(score)].hex;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(3, score)}%` }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
      />
    </div>
  );
}
