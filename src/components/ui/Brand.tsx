import Link from "next/link";
import { Specimen } from "@/components/chamber/Specimen";

export const APP_NAME = "Will it Material?";

/** Small specimen mascot + name used in every page header. */
export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4">
      <Specimen color="#c97b4b" accent="#ffd2b0" finish="metallic" look={{ mood: "happy" }} size={34} />
      <span className="font-display text-xl italic text-ink">{APP_NAME}</span>
    </Link>
  );
}
