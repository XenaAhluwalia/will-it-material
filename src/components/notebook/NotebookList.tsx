"use client";

import Link from "next/link";
import { useState } from "react";
import { clearNotebook, removeEntry, useNotebook, type NotebookEntry } from "@/lib/notebook";
import { ObjectDoodle } from "@/components/doodle/ObjectDoodle";
import { Specimen } from "@/components/chamber/Specimen";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUS_STYLE } from "@/components/ui/status";

const MOOD = { PASS: "happy", WARNING: "worried", FAIL: "dizzy" } as const;
const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Every saved test, newest first. Lives in this browser only. */
export function NotebookList() {
  const entries = useNotebook();
  const [confirmClear, setConfirmClear] = useState(false);

  if (entries.length === 0) {
    return (
      <div className="card mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <Specimen color="#c4c1ef" finish="gloss" look={{ mood: "worried" }} size={88} />
        <p className="font-display text-2xl text-ink">Nothing in here yet</p>
        <p className="text-soft">Every test you run gets saved here automatically, so you can come back to it later.</p>
        <Link href="/explore" className="btn bg-iris px-6 py-2.5 text-lg text-paper-raised">
          Test something
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-soft">
          {entries.length} {entries.length === 1 ? "test" : "tests"} saved. Your notebook stays on this device.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirmClear) {
              clearNotebook();
              setConfirmClear(false);
            } else {
              setConfirmClear(true);
            }
          }}
          onBlur={() => setConfirmClear(false)}
          className={`btn px-4 py-1 text-base ${confirmClear ? "bg-fail text-paper-raised" : "bg-paper-raised text-ink"}`}
        >
          {confirmClear ? "Tap again to clear everything" : "Clear notebook"}
        </button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((e) => (
          <EntryCard key={e.id} entry={e} />
        ))}
      </ul>
    </div>
  );
}

function EntryCard({ entry }: { entry: NotebookEntry }) {
  const { result, doodle } = entry;
  const status = result.overallStatus;
  return (
    <li className="card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-20 shrink-0 place-items-center">
          {doodle ? (
            <ObjectDoodle doodle={doodle} name={result.request.component} mood={MOOD[status]} size={76} />
          ) : (
            <Specimen color={result.material.color} accent={result.material.accent} finish={result.material.finish} look={{ mood: MOOD[status] }} size={68} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl text-ink">{result.request.component}</p>
          <p className="truncate text-sm text-soft">{result.material.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={status} size="sm" />
            <span className={`font-display text-lg ${STATUS_STYLE[status].text}`}>{result.overallScore}</span>
          </div>
        </div>
      </div>
      <p className="line-clamp-2 text-sm text-muted">{result.mainReason}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted">{dateFormat.format(entry.savedAt)}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => removeEntry(entry.id)}
            aria-label={`Remove ${result.request.component} in ${result.material.name}`}
            className="rounded-full px-2 text-sm text-muted underline decoration-ink/30 underline-offset-2 hover:text-fail focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris"
          >
            Remove
          </button>
          <Link href={`/explore?entry=${encodeURIComponent(entry.id)}`} className="btn bg-iris px-4 py-1 text-base text-paper-raised">
            Open
          </Link>
        </div>
      </div>
    </li>
  );
}
