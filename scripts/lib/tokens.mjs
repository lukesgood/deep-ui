/**
 * Reads the palettes out of src/styles/tokens.css — the real values, not a copy.
 *
 * Shared by the two palette checkers, `check-contrast.mjs` and `check-palette.mjs`,
 * so they cannot disagree about what a token's value is. A second parser would be a
 * second place for "which block did that come from" to go wrong, and this one has
 * already gone wrong twice (see `readBlock` and `stripMedia`).
 *
 * Nothing here decides pass or fail. A token whose value it cannot read comes back
 * as `{ unparsed }`, and it is the checker's job to treat that as a failure.
 */

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

export const TOKENS = fileURLToPath(new URL("../../src/styles/tokens.css", import.meta.url))

/* ── colour ───────────────────────────────────────────────────────────────── */

/** #rgb / #rrggbb / rgb(r g b) / rgb(r g b / a) -> [r, g, b, a]. */
export function parseColor(raw) {
  const v = raw.trim()
  let m = v.match(/^#([0-9a-f]{3})$/i)
  if (m) return [...[...m[1]].map((c) => parseInt(c + c, 16)), 1]
  m = v.match(/^#([0-9a-f]{6})$/i)
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1)
  m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/i)
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])
    return [+m[1], +m[2], +m[3], a]
  }
  return null
}

/** Composite a possibly-translucent colour onto an opaque one. */
export function over(fg, bg) {
  const a = fg[3]
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)).concat(1)
}

export const hex = (c) =>
  "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")

/* ── tokens ───────────────────────────────────────────────────────────────── */

/** Custom properties for one selector, merged across every block that declares it.
 *  A stylesheet may open `:root` more than once — the palette in one place, the
 *  stacking ladder in another — and reading only the first block would measure
 *  whichever one happened to come first. */
export function readBlock(css, selector) {
  const blocks = []
  for (let i = css.indexOf(`${selector} {`); i !== -1; i = css.indexOf(`${selector} {`, i + 1)) {
    // Brace-counted, not "the next `}` at column 0": inside an `@media` the block's
    // own closing brace is indented, and stopping at the outer one would swallow
    // every sibling rule after it — silently measuring the wrong palette.
    let depth = 0
    let end = -1
    for (let j = css.indexOf("{", i); j < css.length; j++) {
      if (css[j] === "{") depth++
      else if (css[j] === "}" && --depth === 0) { end = j; break }
    }
    if (end === -1) throw new Error(`unterminated ${selector} block in tokens.css`)
    blocks.push(css.slice(i, end))
  }
  if (!blocks.length) throw new Error(`${selector} block not found in tokens.css`)
  const out = {}
  for (const line of blocks.join("\n").split("\n")) {
    const m = line.match(/^\s*(--[\w-]+)\s*:\s*([^;]+);/)
    if (!m) continue
    // Gradients, shadows and font stacks are not single colours; skip by shape.
    if (/gradient|,/.test(m[2]) && !/^rgba?\(/i.test(m[2].trim())) continue
    const color = parseColor(m[2])
    if (color) out[m[1]] = color
    else if (/^--(dp-)?(background|foreground|card|popover|primary|secondary|muted|accent|destructive|border|input|ring|sidebar|chart|good|warn|bad|managed|aqua)/.test(m[1]))
      out[m[1]] = { unparsed: m[2].trim() }
  }
  return out
}

/** The stylesheet region for one at-rule, or "" when it is not there.
 *  Brace-counted rather than regex-matched, because these blocks nest. */
export function atRule(source, prelude) {
  const start = source.indexOf(prelude)
  if (start === -1) return ""
  let depth = 0
  for (let i = source.indexOf("{", start); i < source.length; i++) {
    if (source[i] === "{") depth++
    else if (source[i] === "}" && --depth === 0) return source.slice(start, i + 1)
  }
  throw new Error(`unterminated ${prelude} in tokens.css`)
}

/** Every `@media` region removed, so the base palette is read on its own.
 *
 *  Without this the print block's `.dark { --background: #ffffff }` merges into the
 *  dark theme and the whole dark palette measures against paper. Conditional
 *  palettes are real palettes and get measured — but as themes of their own, below,
 *  not folded into the one they override. */
export function stripMedia(source) {
  let out = source
  for (let i = out.indexOf("@media"); i !== -1; i = out.indexOf("@media")) {
    const region = atRule(out.slice(i), "@media")
    out = out.slice(0, i) + out.slice(i + region.length)
  }
  return out
}

/** Every palette a reader can actually be shown, as `[name, tokens]` pairs: light,
 *  dark, and each one again under `prefers-contrast: more`.
 *
 *  A conditional palette inherits everything it does not restate, so it is measured
 *  as the base with the overrides applied — the same thing the browser computes.
 *  `@media print` is left out on purpose: it is a paper palette, and measuring it
 *  against screen rules would only produce noise. */
export function readThemes(css = readFileSync(TOKENS, "utf8")) {
  const base = stripMedia(css)
  const light = readBlock(base, ":root")
  const dark = readBlock(base, ".dark")

  const variant = (region, ground, selector) =>
    region ? { ...ground, ...readBlock(region, selector) } : null

  const moreContrast = atRule(css, "@media (prefers-contrast: more)")
  return [
    ["light", light],
    ["dark", dark],
    ["light, prefers-contrast: more", variant(moreContrast, light, ":root")],
    ["dark, prefers-contrast: more", variant(moreContrast, dark, ".dark")],
  ].filter(([, T]) => T)
}
