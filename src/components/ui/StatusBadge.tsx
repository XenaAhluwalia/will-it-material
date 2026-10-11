import type { Status } from "@/types/screening";
import { STATUS_STYLE } from "./status";

export function StatusBadge({ status, size = "md" }: { status: Status; size?: "sm" | "md" | "lg" }) {
  const s = STATUS_STYLE[status];
  const sizing = size === "lg" ? "px-4 py-1 text-base" : size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-0.5 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ${s.bg} ${s.text} ${s.ring} ${sizing}`}>
      <span aria-hidden>{s.icon}</span>
      {s.word}
    </span>
  );
}
