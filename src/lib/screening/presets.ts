import type { MaterialSuggestion } from "@/types/material";
import materialsData from "@/data/materials.json";

/** Quick picks for the material field. Users can type any material at all. */
export const MATERIAL_SUGGESTIONS: MaterialSuggestion[] = [
  ...(materialsData as { materials: MaterialSuggestion[] }).materials.map(({ name, family, color }) => ({ name, family, color })),
  { name: "PLA (3D-printing plastic)", family: "Thermoplastic", color: "#f472b6" },
  { name: "Acrylic (PMMA)", family: "Thermoplastic", color: "#f3c6d3" },
  { name: "EVA foam", family: "Polymer foam", color: "#e9e4dc" },
  { name: "Oak", family: "Hardwood", color: "#b7854f" },
  { name: "Silicone rubber", family: "Elastomer", color: "#fda4af" },
  { name: "Reinforced concrete", family: "Composite / masonry", color: "#a8a29e" },
  { name: "Cast iron", family: "Ferrous alloy", color: "#57534e" },
  { name: "Cotton canvas", family: "Natural fabric", color: "#e7dcc3" },
  { name: "Milk chocolate", family: "Food (very much not engineering)", color: "#6b4430" },
];

/** Everything the "set the conditions" controls capture. Turned into plain text for the model. */
export interface Setup {
  component: string;
  material: string;
  /** Coldest and hottest it gets, in °C. */
  tempMin: number;
  tempMax: number;
  load: LoadLevel;
  /** Ids from CONDITION_TOGGLES that are switched on. */
  toggles: string[];
  notes: string;
}

export const TEMP_RANGE = { min: -200, max: 1200, step: 5 } as const;

/** A relatable name for a temperature, shown under the sliders. */
export function tempVibe(c: number): string {
  if (c <= -150) return "deep space";
  if (c <= -60) return "colder than Antarctica";
  if (c <= -20) return "polar winter";
  if (c <= 4) return "freezer";
  if (c <= 30) return "room temp";
  if (c <= 60) return "hot car";
  if (c <= 100) return "boiling water";
  if (c <= 250) return "oven";
  if (c <= 500) return "pizza oven";
  if (c <= 900) return "jet engine";
  return "basically lava";
}

export type LoadLevel = "light" | "everyday" | "heavy" | "extreme";

export const LOAD_LEVELS: { id: LoadLevel; label: string; text: string }[] = [
  { id: "light", label: "Barely any", text: "It carries almost no load." },
  { id: "everyday", label: "Everyday", text: "It sees normal everyday handling and loads." },
  { id: "heavy", label: "Heavy", text: "It carries heavy loads and vibration." },
  { id: "extreme", label: "Extreme", text: "It faces extreme loads, impacts or pressure." },
];

export const CONDITION_TOGGLES: { id: string; label: string; text: string }[] = [
  { id: "wet", label: "Gets wet", text: "It gets wet regularly." },
  { id: "salt", label: "Salty water", text: "It is exposed to saltwater." },
  { id: "dishwasher", label: "Dishwasher", text: "It goes through the dishwasher." },
  { id: "food", label: "Touches food", text: "It touches food." },
  { id: "skin", label: "Touches skin", text: "It touches skin for long periods." },
  { id: "sun", label: "Lives in the sun", text: "It sits in direct sunlight for years (UV)." },
  { id: "chemicals", label: "Chemicals", text: "It contacts chemicals or solvents." },
  { id: "repeat", label: "Used over and over", text: "It is used thousands of times (fatigue and wear)." },
  { id: "drop", label: "Gets dropped", text: "It gets dropped or bumped a lot." },
  { id: "vacuum", label: "Space vacuum", text: "It operates in the vacuum of space." },
  { id: "radiation", label: "Radiation", text: "It is exposed to radiation." },
  { id: "light", label: "Must be light", text: "Weight is critical." },
  { id: "cheap", label: "Must be cheap", text: "It needs to be cheap to make." },
];

/** The sentence the screening model reads. */
export function describeConditions(s: Setup): string {
  const parts = [
    `Temperature ranges from ${s.tempMin} °C to ${s.tempMax} °C.`,
    LOAD_LEVELS.find((l) => l.id === s.load)?.text ?? "",
    ...CONDITION_TOGGLES.filter((t) => s.toggles.includes(t.id)).map((t) => t.text),
    s.notes.trim(),
  ];
  return parts.filter(Boolean).join(" ");
}

/** One-tap examples: a mix of everyday things and space hardware. */
export const EXAMPLES: (Setup & { id: string; title: string })[] = [
  {
    id: "nails",
    title: "Acrylic nails",
    component: "Acrylic nails",
    material: "Acrylic (PMMA)",
    tempMin: 15,
    tempMax: 60,
    load: "everyday",
    toggles: ["wet", "skin", "chemicals", "drop"],
    notes: "Has to survive typing, dish soap and nail polish remover.",
  },
  {
    id: "sneakers",
    title: "Sneakers",
    component: "Sneaker sole",
    material: "EVA foam",
    tempMin: -10,
    tempMax: 60,
    load: "heavy",
    toggles: ["wet", "repeat", "sun"],
    notes: "",
  },
  {
    id: "phone",
    title: "Phone case",
    component: "Phone case",
    material: "Silicone rubber",
    tempMin: -10,
    tempMax: 50,
    load: "everyday",
    toggles: ["drop", "skin", "sun"],
    notes: "",
  },
  {
    id: "bottle",
    title: "Water bottle",
    component: "Reusable water bottle",
    material: "Stainless Steel 316",
    tempMin: -5,
    tempMax: 95,
    load: "everyday",
    toggles: ["wet", "food", "dishwasher", "drop"],
    notes: "",
  },
  {
    id: "spatula",
    title: "Spatula",
    component: "Frying pan spatula",
    material: "PLA (3D-printing plastic)",
    tempMin: 20,
    tempMax: 200,
    load: "everyday",
    toggles: ["food", "dishwasher"],
    notes: "",
  },
  {
    id: "rover",
    title: "Mars rover wheel",
    component: "Mars rover wheel",
    material: "Aluminum 7075",
    tempMin: -125,
    tempMax: 30,
    load: "heavy",
    toggles: ["drop", "radiation", "light", "repeat"],
    notes: "",
  },
  {
    id: "satellite",
    title: "Satellite",
    component: "Satellite antenna bracket",
    material: "Aluminum 6061",
    tempMin: -150,
    tempMax: 250,
    load: "everyday",
    toggles: ["vacuum", "radiation", "light"],
    notes: "",
  },
  {
    id: "teapot",
    title: "Chocolate teapot",
    component: "Teapot",
    material: "Milk chocolate",
    tempMin: 20,
    tempMax: 100,
    load: "light",
    toggles: ["wet", "food"],
    notes: "Holds freshly boiled water.",
  },
];

export function sameSetup(a: Setup, b: Setup): boolean {
  return (
    a.component === b.component &&
    a.material === b.material &&
    a.tempMin === b.tempMin &&
    a.tempMax === b.tempMax &&
    a.load === b.load &&
    a.notes === b.notes &&
    a.toggles.length === b.toggles.length &&
    a.toggles.every((t) => b.toggles.includes(t))
  );
}
