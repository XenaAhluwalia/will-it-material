"use client";

import type { VoiceRequest, VoiceResponse } from "./voice.worker";

/**
 * Client-side voice input: records from the microphone, converts to 16 kHz mono, and
 * asks the on-device Whisper worker for text. Nothing is uploaded.
 */

export interface VoiceStatus {
  /** 0-100 while the model downloads (first use only). */
  percent: number | null;
  ready: boolean;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (t: string) => void; reject: (e: Error) => void }>();
const listeners = new Set<(s: VoiceStatus) => void>();
let status: VoiceStatus = { percent: null, ready: false };

function setStatus(next: Partial<VoiceStatus>) {
  status = { ...status, ...next };
  listeners.forEach((l) => l(status));
}

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./voice.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent<VoiceResponse>) => {
    const msg = e.data;
    if (msg.type === "progress") setStatus({ percent: msg.percent });
    else if (msg.type === "ready") setStatus({ ready: true, percent: 100 });
    else if (msg.type === "result") {
      pending.get(msg.id)?.resolve(msg.text);
      pending.delete(msg.id);
    } else {
      const err = new Error(msg.message);
      if (msg.id !== undefined) {
        pending.get(msg.id)?.reject(err);
        pending.delete(msg.id);
      } else {
        pending.forEach((p) => p.reject(err));
        pending.clear();
      }
    }
  };
  return worker;
}

export function onVoiceStatus(listener: (s: VoiceStatus) => void): () => void {
  listeners.add(listener);
  listener(status);
  return () => listeners.delete(listener);
}

/** Start downloading the model while the user is still talking. */
export function warmUpVoice() {
  getWorker().postMessage({ type: "load" } satisfies VoiceRequest);
}

/** Whisper expects 16 kHz mono samples. */
async function toMono16k(blob: Blob): Promise<Float32Array> {
  const ctx = new AudioContext({ sampleRate: 16000 });
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    if (decoded.numberOfChannels === 1) return decoded.getChannelData(0);
    const a = decoded.getChannelData(0);
    const b = decoded.getChannelData(1);
    return a.map((v, i) => (v + b[i]) / 2);
  } finally {
    void ctx.close();
  }
}

export async function transcribe(recording: Blob): Promise<string> {
  const audio = await toMono16k(recording);
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ type: "transcribe", id, audio } satisfies VoiceRequest, [audio.buffer]);
  });
}

/** Whisper writes these when it hears nothing useful. */
export function isEmptyTranscript(text: string): boolean {
  const t = text.trim().toLowerCase();
  return !t || /^\[.*\]$/.test(t) || /^\(.*\)$/.test(t) || t === "you" || t === "thank you.";
}
