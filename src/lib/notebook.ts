"use client";

import { useSyncExternalStore } from "react";
import type { ScreeningResult } from "@/types/screening";
import type { Doodle } from "@/types/doodle";

/**
 * The lab notebook: every finished test, saved in this browser only (localStorage).
 * Each entry keeps the full result, so reopening one needs no new API call.
 * Storage can be missing or full (private windows, blocked site data), so every
 * read and write is guarded and the app works without it.
 */

export interface NotebookEntry {
  id: string;
  savedAt: number;
  result: ScreeningResult;
  doodle: Doodle | null;
}

const KEY = "wim.notebook.v1";
const MAX_ENTRIES = 40;
const EMPTY: NotebookEntry[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedEntries: NotebookEntry[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function snapshot(): NotebookEntry[] {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedEntries;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedEntries = Array.isArray(parsed) ? (parsed as NotebookEntry[]) : EMPTY;
  } catch {
    cachedEntries = EMPTY;
  }
  return cachedEntries;
}

function write(entries: NotebookEntry[]) {
  let list = entries.slice(0, MAX_ENTRIES);
  // If storage is full, drop the oldest entries until it fits.
  while (list.length) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
      break;
    } catch {
      list = list.slice(0, -1);
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useNotebook(): NotebookEntry[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export function getEntry(id: string): NotebookEntry | undefined {
  return snapshot().find((e) => e.id === id);
}

/** Saves a finished test, newest first. Returns its id. */
export function addEntry(result: ScreeningResult, doodle: Doodle | null): string {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  write([{ id, savedAt: Date.now(), result, doodle }, ...snapshot()]);
  return id;
}

/** The doodle often arrives after the result; attach it to entries for that object that lack one. */
export function attachDoodle(component: string, doodle: Doodle) {
  const key = component.trim().toLowerCase();
  const entries = snapshot();
  if (!entries.some((e) => !e.doodle && e.result.request.component.trim().toLowerCase() === key)) return;
  write(entries.map((e) => (!e.doodle && e.result.request.component.trim().toLowerCase() === key ? { ...e, doodle } : e)));
}

export function removeEntry(id: string) {
  write(snapshot().filter((e) => e.id !== id));
}

export function clearNotebook() {
  write([]);
}
