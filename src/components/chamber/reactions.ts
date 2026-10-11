import type { TargetAndTransition } from "framer-motion";
import type { StageVisual, Status } from "@/types/screening";
import type { SpecimenLook } from "./Specimen";

/**
 * Maps a stage + verdict to a cartoon reaction. These are playful
 * illustrations of the screening result, NOT physical simulations.
 */
export interface Reaction {
  look: SpecimenLook;
  animate: TargetAndTransition;
}

const IDLE: Reaction = { look: { mood: "happy" }, animate: { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1, skewX: 0 } };

const WARNING_TINT: Record<StageVisual, Partial<SpecimenLook>> = {
  cold: { tint: "#7dd3fc", tintOpacity: 0.3 },
  heat: { tint: "#fb923c", tintOpacity: 0.3, sweat: true },
  stress: {},
  radiation: { tint: "#a3e635", tintOpacity: 0.25 },
  corrosion: { tint: "#b45309", tintOpacity: 0.2 },
};

const shake = (amp: number, repeat = 2): TargetAndTransition => ({
  x: [0, -amp, amp, -amp, amp, 0],
  transition: { duration: 0.45, repeat, ease: "easeInOut" },
});

function failReaction(stage: StageVisual): Reaction {
  switch (stage) {
    case "cold":
      return {
        look: { mood: "dizzy", frost: true, cracks: true, tint: "#7dd3fc", tintOpacity: 0.5 },
        animate: { x: [0, -3, 3, -3, 3, 0], rotate: [0, 0, -6], transition: { duration: 0.6, repeat: 1 } },
      };
    case "heat":
      return {
        look: { mood: "dizzy", sweat: true, tint: "#ef4444", tintOpacity: 0.6 },
        animate: { scaleY: [1, 0.78], scaleX: [1, 1.15], skewX: [0, 10], y: [0, 12], transition: { duration: 1.1, ease: "easeIn" } },
      };
    case "stress":
      return {
        look: { mood: "dizzy", cracks: true },
        animate: { scaleY: [1, 0.68], scaleX: [1, 1.18], rotate: [0, 8], y: [0, 16], transition: { duration: 0.6, ease: "easeOut" } },
      };
    case "radiation":
      return {
        look: { mood: "dizzy", tint: "#a3e635", tintOpacity: 0.55 },
        animate: { opacity: [1, 0.4, 1, 0.4, 1], scale: [1, 1.05, 0.95, 1.05, 1], transition: { duration: 1.1 } },
      };
    case "corrosion":
      return {
        look: { mood: "dizzy", rust: true, tint: "#92400e", tintOpacity: 0.4 },
        animate: { scale: [1, 0.9], rotate: [0, -4], y: [0, 6], transition: { duration: 1 } },
      };
  }
}

export function getReaction(stage: StageVisual, status: Status, reacting: boolean): Reaction {
  if (!reacting) return IDLE;
  if (status === "PASS") {
    return { look: { mood: "happy" }, animate: { y: [0, -16, 0, -8, 0], transition: { duration: 0.9 } } };
  }
  if (status === "WARNING") {
    return {
      look: { mood: "worried", ...WARNING_TINT[stage], cracks: false },
      animate: stage === "stress" ? { scaleY: [1, 0.88, 0.92], ...shake(4, 1) } : shake(5),
    };
  }
  return failReaction(stage);
}

/** How far the hydraulic press travels (px) for the stress stage. */
export function pressDepth(status: Status): number {
  return status === "FAIL" ? 52 : status === "WARNING" ? 10 : 2;
}
