/**
 * Rebuilds model-drawn SVG markup from an allowlist. Only plain shapes survive, and
 * every attribute value must match a strict pattern, so nothing that can run script,
 * load a resource or reference another element (href, style, url(), on*) gets through.
 */

const SHAPES = new Set(["path", "rect", "circle", "ellipse", "line", "polygon", "polyline"]);

const NUM = /^-?\d*\.?\d+$/;
const COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|none)$/i;

const ATTRS: Record<string, RegExp> = {
  d: /^[MmLlHhVvCcSsQqTtAaZz0-9\s,.\-+eE]+$/,
  points: /^[0-9\s,.\-+eE]+$/,
  fill: COLOR,
  stroke: COLOR,
  "stroke-linecap": /^(round|butt|square)$/,
  "stroke-linejoin": /^(round|miter|bevel)$/,
  transform: /^(\s*(translate|rotate|scale)\(\s*-?[\d.]+(\s*[\s,]\s*-?[\d.]+){0,2}\s*\)\s*)+$/,
};
for (const n of ["x", "y", "width", "height", "rx", "ry", "cx", "cy", "r", "x1", "y1", "x2", "y2", "stroke-width", "opacity", "fill-opacity"]) {
  ATTRS[n] = NUM;
}

const MAX_ELEMENTS = 60;
const MAX_LENGTH = 20_000;

export function sanitizeDoodle(markup: string): string {
  const out: string[] = [];
  let depth = 0;
  let count = 0;
  const tagRe = /<\s*(\/?)\s*([a-zA-Z]+)([^<>]*?)(\/?)\s*>/g;

  for (const m of markup.slice(0, MAX_LENGTH).matchAll(tagRe)) {
    const [, closing, rawTag, rawAttrs, selfClosing] = m;
    const tag = rawTag.toLowerCase();
    if (closing) {
      if (tag === "g" && depth > 0) {
        out.push("</g>");
        depth--;
      }
      continue;
    }
    if (tag !== "g" && !SHAPES.has(tag)) continue;
    if (++count > MAX_ELEMENTS) break;

    const attrs: string[] = [];
    for (const [, name, value] of rawAttrs.matchAll(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/g)) {
      const key = name.toLowerCase();
      const v = value.trim();
      if (ATTRS[key]?.test(v)) attrs.push(`${key}="${v}"`);
    }
    const attrText = attrs.length ? ` ${attrs.join(" ")}` : "";

    if (tag === "g") {
      if (selfClosing) continue;
      out.push(`<g${attrText}>`);
      depth++;
    } else {
      out.push(`<${tag}${attrText}/>`);
    }
  }
  while (depth-- > 0) out.push("</g>");
  return out.join("");
}
