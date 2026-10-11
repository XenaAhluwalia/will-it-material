"use client";

import Link from "next/link";
import { useNotebook } from "@/lib/notebook";

/** Header link to the lab notebook, with how many tests are saved. */
export function NotebookLink() {
  const count = useNotebook().length;
  return (
    <Link href="/notebook" className="btn shrink-0 bg-paper-raised px-4 py-1 text-base text-ink">
      Notebook
      {count > 0 && (
        <span className="grid min-w-6 place-items-center rounded-full bg-iris-soft px-1.5 font-sans text-xs font-semibold text-ink">
          {count}
        </span>
      )}
    </Link>
  );
}
