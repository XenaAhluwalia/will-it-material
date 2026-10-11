"use client";

import type { VisionRequest, VisionResponse } from "./vision.worker";

/**
 * Client-side handle on the on-device vision worker. One worker per tab, created on
 * first use so the model only downloads when someone actually snaps a photo.
 */

export interface VisionStatus {
  /** 0-100 while model files download (first use only). */
  percent: number | null;
  ready: boolean;
  device: "webgpu" | "wasm" | null;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (t: string) => void; reject: (e: Error) => void }>();
const statusListeners = new Set<(s: VisionStatus) => void>();
let status: VisionStatus = { percent: null, ready: false, device: null };

function setStatus(next: Partial<VisionStatus>) {
  status = { ...status, ...next };
  statusListeners.forEach((l) => l(status));
}

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./vision.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent<VisionResponse>) => {
    const msg = e.data;
    if (msg.type === "progress") setStatus({ percent: msg.percent });
    else if (msg.type === "ready") setStatus({ ready: true, percent: 100, device: msg.device });
    else if (msg.type === "result") {
      pending.get(msg.id)?.resolve(msg.text);
      pending.delete(msg.id);
    } else if (msg.type === "error") {
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

export function onVisionStatus(listener: (s: VisionStatus) => void): () => void {
  statusListeners.add(listener);
  listener(status);
  return () => statusListeners.delete(listener);
}

/** Start downloading the model early (e.g. when the photo tab opens). */
export function warmUpVision() {
  getWorker().postMessage({ type: "load" } satisfies VisionRequest);
}

/** Describe a photo entirely on this device. */
export function describePhoto(image: Blob): Promise<string> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ type: "describe", id, image } satisfies VisionRequest);
  });
}

/** Shrink big phone photos before handing them to the model (it downsizes anyway). */
export async function shrinkPhoto(file: Blob, maxSide = 768): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? file), "image/jpeg", 0.9));
  } catch {
    return file;
  }
}
