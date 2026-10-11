import type { Identification } from "@/types/identify";

/** Client-side: send a downscaled photo for Claude to identify. */
export async function fetchIdentification(image: string, correction?: string, signal?: AbortSignal): Promise<Identification> {
  const res = await fetch("/api/identify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image, correction }),
    signal,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Couldn't identify it (${res.status}).`);
  return body as Identification;
}

/** Shrink a phone photo to a small JPEG and return it as base64 (no data: prefix). */
export async function photoToBase64(file: Blob, maxSide = 1024): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}
