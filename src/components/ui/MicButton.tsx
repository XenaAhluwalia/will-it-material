"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { isEmptyTranscript, onVoiceStatus, transcribe, warmUpVoice, type VoiceStatus } from "@/lib/voice/client";

type State = "idle" | "recording" | "working";

const MAX_SECONDS = 30;

/**
 * Tap to talk, tap again to stop. Uses the browser's built-in speech recognition when it
 * has one (instant, words appear as you speak); otherwise records and transcribes with a
 * Whisper model running in this browser.
 */
export function MicButton({ onText, label }: { onText: (text: string) => void; label: string }) {
  const [state, setState] = useState<State>("idle");
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [voice, setVoice] = useState<VoiceStatus>({ percent: null, ready: false });
  const [live, setLive] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const speech = useRef<SpeechRecognitionLike | null>(null);
  const timer = useRef<number>(0);

  useEffect(() => onVoiceStatus(setVoice), []);
  useEffect(
    () => () => {
      window.clearInterval(timer.current);
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
      speech.current?.abort();
    },
    [],
  );

  const flash = (text: string) => {
    setNote(text);
    window.setTimeout(() => setNote(null), 3500);
  };

  const startTimer = (stopNow: () => void) => {
    setSeconds(0);
    timer.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) stopNow();
        return s + 1;
      });
    }, 1000);
  };

  /** Browser speech recognition: returns false if this browser doesn't have it. */
  const startBrowserSpeech = (): boolean => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return false;
    const rec = new Recognition();
    rec.lang = navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = "";
    let failed = false;
    rec.onresult = (e) => {
      let interim = "";
      finalText = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setLive((finalText + interim).trim());
    };
    rec.onerror = (e) => {
      failed = true;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") flash("Mic blocked. Allow it in your browser to talk.");
      else if (e.error === "no-speech") flash("Didn't catch that. Try again?");
      else if (e.error === "network") {
        // Some browsers' speech service needs the internet; use the on-device model next time.
        browserSpeechBroken = true;
        flash("Voice service unavailable. Tap again to use on-device voice.");
      } else if (e.error !== "aborted") flash("Couldn't hear that. Try again?");
    };
    rec.onend = () => {
      window.clearInterval(timer.current);
      speech.current = null;
      setLive("");
      setState("idle");
      if (!failed && finalText.trim()) onText(finalText.trim());
      else if (!failed) flash("Didn't catch that. Try again?");
    };
    speech.current = rec;
    rec.start();
    setLive("");
    setState("recording");
    startTimer(() => rec.stop());
    return true;
  };

  const start = async () => {
    if (!browserSpeechBroken && startBrowserSpeech()) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      flash("Voice needs a secure (https) page.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      flash("Mic blocked. Allow it in your browser to talk.");
      return;
    }
    warmUpVoice();
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      window.clearInterval(timer.current);
      setState("working");
      try {
        const text = await transcribe(new Blob(chunks, { type: rec.mimeType }));
        if (isEmptyTranscript(text)) flash("Didn't catch that. Try again?");
        else onText(text.trim());
      } catch {
        flash("Couldn't turn that into text. Try again?");
      } finally {
        setState("idle");
      }
    };
    recorder.current = rec;
    rec.start();
    setState("recording");
    startTimer(() => rec.state === "recording" && rec.stop());
  };

  const stop = () => {
    if (speech.current) speech.current.stop();
    else if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const busyText = state === "working" ? (voice.ready ? "writing…" : `getting ears ready ${voice.percent ?? 0}%`) : null;

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={state === "recording" ? stop : start}
        disabled={state === "working"}
        aria-label={state === "recording" ? `Stop recording ${label}` : `Say ${label} out loud`}
        aria-pressed={state === "recording"}
        title={state === "recording" ? "Tap to stop" : "Tap to talk"}
        className={`grid size-9 place-items-center rounded-full border-2 border-ink shadow-[0_2px_0_var(--color-ink)] transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris disabled:cursor-wait ${
          state === "recording" ? "bg-fail text-paper-raised" : "bg-iris-soft text-ink hover:bg-iris hover:text-paper-raised"
        }`}
      >
        {state === "recording" ? (
          <motion.span className="size-3 rounded-[3px] bg-paper-raised" animate={{ scale: [1, 0.8, 1] }} transition={{ duration: 1, repeat: Infinity }} />
        ) : state === "working" ? (
          <motion.span
            className="size-4 rounded-full border-2 border-ink/30 border-t-ink"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <MicIcon />
        )}
      </button>
      <AnimatePresence>
        {(state === "recording" || busyText || note) && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className="absolute bottom-full right-0 z-20 mb-2 w-max max-w-[14rem] rounded-xl border-2 border-ink bg-paper-raised px-2.5 py-1 text-xs font-medium text-ink shadow-[0_2px_0_var(--color-ink)]"
          >
            {note ?? busyText ?? (live ? `“${live}”` : `listening… ${seconds}s, tap to stop`)}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/** Set after the browser's speech service fails with a network error; then we use Whisper. */
let browserSpeechBroken = false;

/** The bits of the Web Speech API we use (not in TypeScript's DOM types). */
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Add dictated text after whatever is already typed. */
export const appendSpoken = (current: string, text: string) => (current.trim() ? `${current.trim()} ${text.trim()}` : text.trim());

function MicIcon() {
  return (
    <svg aria-hidden width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="5" y="1" width="6" height="10" rx="3" fill="currentColor" stroke="none" />
      <path d="M2 8a6 6 0 0 0 12 0M8 14v3" />
    </svg>
  );
}
