import type { Status } from "@/types/screening";

export const STATUS_STYLE: Record<Status, { text: string; bg: string; ring: string; hex: string; icon: string; word: string }> = {
  PASS: { text: "text-pass", bg: "bg-pass/12", ring: "ring-pass/35", hex: "#336a4f", icon: "✓", word: "Pass" },
  WARNING: { text: "text-warn", bg: "bg-warn/12", ring: "ring-warn/35", hex: "#8a5e0e", icon: "!", word: "Warning" },
  FAIL: { text: "text-fail", bg: "bg-fail/12", ring: "ring-fail/35", hex: "#a13d2c", icon: "✕", word: "Fail" },
};
