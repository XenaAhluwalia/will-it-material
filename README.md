# Will it Material?

> Pick anything, choose what it's made of, and see if it holds up.

A playful materials-science app for high school and first-year college students. Test **any material** for **any object** (acrylic nails, sneakers, a Mars rover wheel, a chocolate teapot) by sliding the temperature, picking how much force it takes and flipping on conditions like water, sun or space. Claude (Sonnet 5.5) works out which tests actually matter for that object, scores each one, explains the main limitation in plain language, suggests better materials and the app plays the result in a cartoon test chamber. A second Claude call (Opus 5.5, low effort) draws a tiny caricature of the object.

Three ways to start:

- **I know what I'm testing:** name the object and material, set the conditions.
- **I have an idea:** describe what you want to make ("a lunchbox that keeps food warm") and get three material picks, each one tap away from a full test. Leaving the material blank in the form does the same.
- **Snap a photo:** a small vision model running **on your device** looks at the photo, then Claude names the likely material and whether something else would do better.

Every finished test is saved to a **lab notebook** in the browser (no account, no server storage) and can be reopened instantly.

**Will it Material? gives a rough first look at materials, for learning and early ideas. It is not a substitute for engineering analysis, testing, or certification.** Scores are AI estimates from approximate textbook properties and can be wrong. The chamber animations and doodles illustrate the verdicts; they are not physical simulations.

## Run it

Requires Node 20+ and an Anthropic API key.

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck && npm run lint
```

> The project folder name contains a `?`, which breaks webpack's path handling, so the `dev` and `build` scripts use Turbopack (`--turbopack`).

## On-device AI

The photo feature runs a vision-language model entirely in the browser:

- **Model:** [SmolVLM](https://huggingface.co/HuggingFaceTB/SmolVLM-500M-Instruct) via [Transformers.js](https://huggingface.co/docs/transformers.js) 4.3, in a Web Worker so the page never freezes. With WebGPU it runs SmolVLM-500M with 4-bit weights (~360 MB); without WebGPU it falls back to SmolVLM-256M on the CPU (WebAssembly).
- **One-time download:** model files come from the Hugging Face Hub on first use and are cached by the browser. After that the on-device step works offline.
- **Privacy:** the photo never leaves the device. Only the model's short text description ("a white ceramic mug with a handle…") is sent to Claude, which combines it with what such objects are usually made of.

Code: `src/lib/vision/` (worker + client) and `src/components/photo/PhotoPanel.tsx`.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Anthropic TypeScript SDK (`claude-sonnet-5-5`, structured outputs) · no auth.

## How the decision is made

Nothing about the input is fixed. The user types:

| Field | Examples |
| --- | --- |
| Object | "satellite antenna bracket", "frying pan spatula", "guitar pick", "pacemaker lead" |
| Material | "Inconel 718", "oak", "PLA", "steel" (vague is fine), "milk chocolate" |
| Conditions | free text: temperatures, loads, water/chemicals, food contact, lifetime, budget… (blank = typical use) |

`POST /api/screen` sends that to Claude Sonnet 5.5 with a fixed system prompt and a Zod schema (structured outputs). The model:

1. **Interprets** the request: resolves vague materials to a likely grade, infers conditions the object normally faces, and lists its assumptions.
2. **Chooses 3–6 criteria** that decide success for *this* object (creep and oxidation for a turbine disk; knife scarring and food safety for a cutting board), each marked critical / important / minor.
3. **Scores each criterion 0–100** against a shared rubric (90+ big margin, 75+ meets, 50+ marginal, 25+ likely fails, below that certain failure).
4. **Picks a chamber effect** per criterion (cold, heat, stress, radiation, corrosion, or none).
5. **Suggests 1–3 alternative materials** with reasons, a trade-off and an estimated score.

The app then derives the verdict deterministically in `src/lib/screening/assemble.ts`, so the headline always agrees with the per-criterion scores:

- Each criterion: **PASS** ≥ 75, **WARNING** 50–74, **FAIL** < 50.
- Overall score: importance-weighted average (critical 3, important 2, minor 1), capped to match the overall verdict.
- Overall verdict: the worst criterion, except a *minor* criterion can only pull it down to WARNING.
- **Primary limiting property**: the criterion that most hurts the verdict (then lowest score).

**Re-testing an alternative** sends the original criteria and property labels along, so the model scores the same things and the side-by-side comparison lines up. If the input isn't a physical object/material at all, the model asks for clarification instead of guessing. Safety declines are retried server-side via `fallbacks: "default"`.

## Architecture

```
src/
  app/api/screen/route.ts      POST endpoint: validates input, calls Claude, maps errors
  app/api/doodle/route.ts      POST endpoint: object caricature (returns 204 on any failure)
  app/api/suggest/route.ts     POST endpoint: idea (or object without material) → 3 material picks
  app/api/identify/route.ts    POST endpoint: on-device photo description (text only) → likely material
  lib/anthropic.ts             the shared Claude client
  lib/vision/                  on-device vision model (Web Worker) and its client
  lib/suggest/, lib/identify/  Claude calls and client helpers for those two endpoints
  lib/notebook.ts              lab notebook: saved tests in localStorage
  lib/doodle/                  doodle Claude call, allowlist SVG sanitizer, client cache
  lib/screening/
    claude.ts                  server-only Claude call (Sonnet 5.5, structured output)
    prompt.ts                  system prompt + per-request message
    schema.ts                  Zod schema the model must fill
    assemble.ts                model output → ScreeningResult (statuses, overall, headline)
    scoring.ts                 PASS/WARNING/FAIL thresholds
    presets.ts                 examples, temperature/force/toggle options → conditions text
    index.ts                   client helpers: runScreening(), retestRequest()
  data/materials.json          quick-pick suggestions for the material field (not a limit)
  types/                       MaterialProfile + screening domain types
  components/
    form/                      object field, material combobox, sliders, force picker, toggles
    chamber/                   cartoon specimen, stage effects, reactions, timeline
    results/                   summary, criterion cards, alternatives, comparison
    doodle/ObjectDoodle.tsx    renders the caricature with the shared cute face
    landing/SpecimenShelf.tsx  pokeable specimens whose eyes follow the cursor
    suggest/                   idea box, material picks, thinking state
    photo/PhotoPanel.tsx       snap a photo → on-device description → likely material
    notebook/                  notebook link and saved-test list
    explore/ExploreApp.tsx     flow state: form / idea / photo → chamber → results → re-test
  app/                         `/` landing, `/explore` app, `/notebook`
```
