/// <reference lib="webworker" />
/**
 * On-device speech to text: Whisper (base, English) running in this browser with
 * Transformers.js. Audio is transcribed here and never sent anywhere. The model
 * (~77 MB, 8-bit) downloads once from the Hugging Face Hub and is then cached.
 * It runs on the CPU (WebAssembly), so it works in every browser, phones included.
 */
import * as transformers from "@huggingface/transformers";
import type { ProgressInfo } from "@huggingface/transformers";

export type VoiceRequest = { type: "load" } | { type: "transcribe"; id: number; audio: Float32Array };
export type VoiceResponse =
  | { type: "progress"; percent: number }
  | { type: "ready" }
  | { type: "result"; id: number; text: string }
  | { type: "error"; id?: number; message: string };

const MODEL = "onnx-community/whisper-base.en";

type Transcriber = (audio: Float32Array, options?: Record<string, unknown>) => Promise<{ text: string } | { text: string }[]>;
// pipeline()'s full generic types make the TypeScript checker crawl; this narrow signature is all we use.
const { pipeline: createPipeline } = transformers as unknown as {
  pipeline: (task: string, model: string, options: object) => Promise<Transcriber>;
};
let loading: Promise<Transcriber> | null = null;

const post = (msg: VoiceResponse) => self.postMessage(msg);

function load(): Promise<Transcriber> {
  loading ??= (async () => {
    const files = new Map<string, { loaded: number; total: number }>();
    const onProgress = (p: ProgressInfo) => {
      if (p.status !== "progress") return;
      files.set(p.file, { loaded: p.loaded, total: p.total });
      let loaded = 0;
      let total = 0;
      files.forEach((f) => {
        loaded += f.loaded;
        total += f.total;
      });
      if (total) post({ type: "progress", percent: Math.min(99, Math.round((loaded / total) * 100)) });
    };
    const asr = await createPipeline("automatic-speech-recognition", MODEL, { dtype: "q8", device: "wasm", progress_callback: onProgress });
    post({ type: "ready" });
    return asr;
  })().catch((err) => {
    loading = null;
    throw err;
  });
  return loading;
}

async function transcribe(id: number, audio: Float32Array) {
  const asr = await load();
  const out = await asr(audio, { chunk_length_s: 30 });
  const text = (Array.isArray(out) ? out.map((o) => o.text).join(" ") : out.text).trim();
  post({ type: "result", id, text });
}

self.onmessage = (e: MessageEvent<VoiceRequest>) => {
  const msg = e.data;
  const fail = (err: unknown, id?: number) => post({ type: "error", id, message: err instanceof Error ? err.message : String(err) });
  if (msg.type === "load") load().catch((err) => fail(err));
  else transcribe(msg.id, msg.audio).catch((err) => fail(err, msg.id));
};
