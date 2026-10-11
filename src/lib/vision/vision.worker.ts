/// <reference lib="webworker" />
/**
 * On-device vision: runs a small vision-language model (SmolVLM) in this browser with
 * Transformers.js, on WebGPU when available and on the CPU (WebAssembly) otherwise.
 * The photo is processed here and never sent anywhere. Model files download once from
 * the Hugging Face Hub and are then cached by the browser.
 */
import { AutoModelForVision2Seq, AutoProcessor, RawImage, type ProgressInfo } from "@huggingface/transformers";

export type VisionRequest = { type: "load" } | { type: "describe"; id: number; image: Blob };
export type VisionResponse =
  | { type: "progress"; percent: number }
  | { type: "ready"; device: "webgpu" | "wasm"; model: string }
  | { type: "result"; id: number; text: string }
  | { type: "error"; id?: number; message: string };

// Small vision models give vague one-liners unless asked for concrete visual details.
const PROMPT =
  "Describe the main object in this photo in two sentences: what it is, its color, its surface (shiny, matte, see-through, textured), and what material it looks like it is made of.";

type Loaded = {
  processor: Awaited<ReturnType<typeof AutoProcessor.from_pretrained>>;
  model: Awaited<ReturnType<typeof AutoModelForVision2Seq.from_pretrained>>;
};
let loading: Promise<Loaded> | null = null;

const post = (msg: VisionResponse) => self.postMessage(msg);

async function pickSetup() {
  const gpu = (self.navigator as Navigator & { gpu?: { requestAdapter(): Promise<{ features: Set<string> } | null> } }).gpu;
  const adapter = await gpu?.requestAdapter().catch(() => null);
  if (adapter) {
    // 4-bit weights; f16 math only where the GPU supports it.
    const q = adapter.features.has("shader-f16") ? "q4f16" : "q4";
    return {
      device: "webgpu" as const,
      model: "HuggingFaceTB/SmolVLM-500M-Instruct",
      dtype: { embed_tokens: q, vision_encoder: q, decoder_model_merged: q } as const,
    };
  }
  // No WebGPU: a smaller model with 8-bit weights on the CPU. Slower, but still fully on-device.
  return {
    device: "wasm" as const,
    model: "HuggingFaceTB/SmolVLM-256M-Instruct",
    dtype: { embed_tokens: "q8", vision_encoder: "q8", decoder_model_merged: "q8" } as const,
  };
}

function load(): Promise<Loaded> {
  loading ??= (async () => {
    const setup = await pickSetup();
    // Sum progress over every file so the bar moves smoothly from 0 to 100.
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
    const processor = await AutoProcessor.from_pretrained(setup.model, { progress_callback: onProgress });
    const model = await AutoModelForVision2Seq.from_pretrained(setup.model, {
      dtype: setup.dtype,
      device: setup.device,
      progress_callback: onProgress,
    });
    post({ type: "ready", device: setup.device, model: setup.model });
    return { processor, model };
  })().catch((err) => {
    loading = null;
    throw err;
  });
  return loading;
}

async function describe(id: number, blob: Blob) {
  const { processor, model } = await load();
  const image = await RawImage.fromBlob(blob);
  const messages = [{ role: "user", content: [{ type: "image" }, { type: "text", text: PROMPT }] }];
  const prompt = processor.apply_chat_template(messages as never, { add_generation_prompt: true });
  const inputs = await processor(prompt, [image]);
  const output = (await model.generate({ ...inputs, max_new_tokens: 96, do_sample: false, repetition_penalty: 1.1 })) as {
    slice: (...args: unknown[]) => unknown;
  };
  const promptLength = inputs.input_ids.dims.at(-1);
  const [text] = processor.batch_decode(output.slice(null, [promptLength, null]) as never, { skip_special_tokens: true });
  post({ type: "result", id, text: String(text ?? "").trim() });
}

self.onmessage = (e: MessageEvent<VisionRequest>) => {
  const msg = e.data;
  const fail = (err: unknown, id?: number) => post({ type: "error", id, message: err instanceof Error ? err.message : String(err) });
  if (msg.type === "load") load().catch((err) => fail(err));
  else describe(msg.id, msg.image).catch((err) => fail(err, msg.id));
};
