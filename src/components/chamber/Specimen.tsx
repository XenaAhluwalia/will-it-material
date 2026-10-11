"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import type { SurfaceFinish } from "@/types/material";

export type Mood = "happy" | "worried" | "dizzy";

export interface SpecimenLook {
  mood: Mood;
  /** Overlay effects, all purely illustrative. */
  frost?: boolean;
  cracks?: boolean;
  rust?: boolean;
  sweat?: boolean;
  /** CSS color overlaid on the body (e.g. red when overheating). */
  tint?: string;
  tintOpacity?: number;
}

interface SpecimenProps {
  color: string;
  /** Highlight color for reflections and glints. */
  accent?: string;
  finish?: SurfaceFinish;
  look: SpecimenLook;
  size?: number;
  /** Where the eyes look, each axis -1 to 1. */
  gaze?: { x: number; y: number };
}

/** A cute cartoon "material sample" character with a material-inspired finish. */
export function Specimen({ color, accent = "#ffffff", finish = "gloss", look, size = 120, gaze }: SpecimenProps) {
  const { mood, frost, cracks, rust, sweat, tint, tintOpacity = 0 } = look;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ids = { shade: `shade-${uid}`, clip: `clip-${uid}`, gloss: `gloss-${uid}` };
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden className="overflow-visible">
      <defs>
        <clipPath id={ids.clip}>
          <rect x="12" y="22" width="96" height="82" rx="24" />
        </clipPath>
        {/* Light from top-left, shade toward bottom-right. Metals get more contrast. */}
        <linearGradient id={ids.shade} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="white" stopOpacity={finish === "metallic" ? 0.45 : finish === "gloss" ? 0.3 : 0.08} />
          <stop offset="0.5" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="black" stopOpacity={finish === "metallic" ? 0.35 : finish === "gloss" ? 0.22 : 0.12} />
        </linearGradient>
        <radialGradient id={ids.gloss} cx="0.3" cy="0.25" r="0.35">
          <stop offset="0" stopColor="white" stopOpacity="0.55" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* shadow */}
      <ellipse cx="60" cy="112" rx="38" ry="5" fill="black" opacity="0.3" />
      {/* body */}
      <rect x="12" y="22" width="96" height="82" rx="24" fill={color} />
      <rect x="12" y="22" width="96" height="82" rx="24" fill={`url(#${ids.shade})`} />

      {/* surface finish */}
      <g clipPath={`url(#${ids.clip})`}>
        {finish === "metallic" && (
          <>
            {/* brushed-metal reflection bands */}
            <path d="M44 22 L64 22 L24 104 L4 104 Z" fill={accent} opacity="0.45" />
            <path d="M72 22 L80 22 L40 104 L32 104 Z" fill={accent} opacity="0.3" />
            <path d="M12 92 Q60 84 108 92 L108 104 L12 104 Z" fill="black" opacity="0.12" />
          </>
        )}
        {finish === "gloss" && (
          <>
            <rect x="12" y="22" width="96" height="82" fill={`url(#${ids.gloss})`} />
            <ellipse cx="88" cy="92" rx="10" ry="4" fill={accent} opacity="0.35" />
          </>
        )}
      </g>

      <motion.rect
        x="12"
        y="22"
        width="96"
        height="82"
        rx="24"
        fill={tint ?? "transparent"}
        initial={false}
        animate={{ opacity: tint ? tintOpacity : 0 }}
        transition={{ duration: 0.5 }}
      />
      {/* outline: dark edge plus a soft light rim so dark metals stay visible on the dark chamber */}
      <rect x="12" y="22" width="96" height="82" rx="24" fill="none" stroke="rgb(0 0 0 / 0.3)" strokeWidth="3" />
      <rect x="15" y="25" width="90" height="76" rx="21" fill="none" stroke="white" strokeOpacity={finish === "matte" ? 0.12 : 0.22} strokeWidth="1.5" />
      {/* shine */}
      {finish === "matte" ? (
        <rect x="22" y="30" width="26" height="9" rx="4.5" fill="white" opacity="0.2" />
      ) : finish === "metallic" ? (
        <>
          <rect x="22" y="30" width="26" height="9" rx="4.5" fill="white" opacity="0.55" />
          <path d="M96 32 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" fill={accent} opacity="0.9" />
        </>
      ) : (
        <>
          <rect x="22" y="30" width="30" height="10" rx="5" fill="white" opacity="0.7" />
          <circle cx="58" cy="35" r="3" fill="white" opacity="0.7" />
        </>
      )}

      {/* frost cap */}
      {frost && (
        <motion.path
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          d="M18 34 Q20 20 36 22 L84 22 Q100 20 102 34 L96 30 L90 38 L82 30 L74 38 L66 30 L58 38 L50 30 L42 38 L34 30 L26 38 Z"
          fill="#e0f2fe"
          opacity="0.95"
        />
      )}

      {/* rust spots */}
      {rust && (
        <motion.g initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.9, scale: 1 }} style={{ originX: "60px", originY: "60px" }}>
          <circle cx="30" cy="86" r="8" fill="#9a3412" />
          <circle cx="92" cy="44" r="6" fill="#b45309" />
          <circle cx="84" cy="90" r="5" fill="#9a3412" />
          <circle cx="38" cy="44" r="4" fill="#c2410c" />
        </motion.g>
      )}

      {/* cracks */}
      {cracks && (
        <motion.path
          d="M70 22 L64 40 L74 50 L62 66 M64 40 L52 46 M28 104 L36 92 L30 84"
          fill="none"
          stroke="#2d2a30"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* face */}
      <Face mood={mood} gaze={gaze} />

      {sweat && (
        <motion.path
          d="M98 40 Q104 50 98 54 Q92 50 98 40 Z"
          fill="#7dd3fc"
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: [0, 8], opacity: [1, 0] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

/**
 * The shared cute face (eyes, mouth, blush), drawn for a 120-unit box centred near (60, 68).
 * Doodles reuse it so every character in the app has the same face.
 */
export function Face({ mood, gaze }: { mood: Mood; gaze?: { x: number; y: number } }) {
  return (
    <g>
      <Features mood={mood} gaze={gaze} />
      <circle cx="34" cy="76" r="6" fill="#fb7185" opacity="0.35" />
      <circle cx="86" cy="76" r="6" fill="#fb7185" opacity="0.35" />
    </g>
  );
}

function Features({ mood, gaze }: { mood: Mood; gaze?: { x: number; y: number } }) {
  const ink = "#2d2a30";
  const look = `translate(${(gaze?.x ?? 0) * 3} ${(gaze?.y ?? 0) * 2.5})`;
  if (mood === "dizzy") {
    return (
      <g stroke={ink} strokeWidth="4" strokeLinecap="round">
        <path d="M38 52 L50 64 M50 52 L38 64" />
        <path d="M70 52 L82 64 M82 52 L70 64" />
        <ellipse cx="60" cy="82" rx="7" ry="6" fill={ink} stroke="none" />
      </g>
    );
  }
  if (mood === "worried") {
    return (
      <g>
        <path d="M36 46 L50 50 M84 46 L70 50" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
        <g transform={look}>
          <circle cx="44" cy="59" r="6" fill={ink} />
          <circle cx="76" cy="59" r="6" fill={ink} />
          <circle cx="46" cy="57" r="2" fill="white" />
          <circle cx="78" cy="57" r="2" fill="white" />
        </g>
        <path d="M48 84 Q54 78 60 84 Q66 90 72 84" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <g transform={look}>
        <circle cx="44" cy="58" r="6.5" fill={ink} />
        <circle cx="76" cy="58" r="6.5" fill={ink} />
        <circle cx="46" cy="56" r="2.2" fill="white" />
        <circle cx="78" cy="56" r="2.2" fill="white" />
      </g>
      <path d="M48 76 Q60 90 72 76" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}
