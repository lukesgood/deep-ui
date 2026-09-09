#!/usr/bin/env node
/**
 * Verifies the contrast claims the README makes in its Accessibility section.
 *
 * Reads the real token values out of src/styles/tokens.css — not a copy — and
 * measures every pair the components can actually produce, in both themes:
 *
 *   - a text token against all four surfaces, and against its own 10% tint
 *     (the ground a tinted button or an inline error really renders on)   >= 4.5:1
 *   - a foreground token against the fill it is printed on                >= 4.5:1
 *   - the solid status step, the chart ramp and the focus ring            >= 3.0:1
 *
 * Anything it cannot parse is a failure, not a skip. A checker that quietly
 * ignores what it does not understand reports green for the wrong reason.
 *
 *   node scripts/check-contrast.mjs [--verbose]
 */

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const TOKENS = fileURLToPath(new URL("../src/styles/tokens.css", import.meta.url))
const VERBOSE = process.argv.includes("--verbose")

/* ── colour ───────────────────────────────────────────────────────────────── */

/** #rgb / #rrggbb / rgb(r g b) / rgb(r g b / a) -> [r, g, b, a]. */
function parseColor(raw) {
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
function over(fg, bg) {
  const a = fg[3]
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)).concat(1)
}

const channel = (c) => {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

const luminance = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

/** WCAG 2.1 contrast ratio. Both colours are composited onto `ground` first, so
 *  a translucent border is measured as it is actually seen. */
function contrast(fg, bg, ground = bg) {
  const a = luminance(over(fg, ground))
  const b = luminance(over(bg, ground))
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

const tint = (color, ground, alpha = 0.1) => over([...color.slice(0, 3), alpha], ground)

const hex = (c) =>
  "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")

/* ── tokens ───────────────────────────────────────────────────────────────── */

/** Custom properties for one selector, merged across every block that declares it.
 *  A stylesheet may open `:root` more than once — the palette in one place, the
 *  stacking ladder in another — and reading only the first block would measure
 *  whichever one happened to come first. */
function readBlock(css, selector) {
  const blocks = []
  for (let i = css.indexOf(`${selector} {`); i !== -1; i = css.indexOf(`${selector} {`, i + 1)) {
    const end = css.indexOf("\n}", i)
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

/* ── what gets measured ───────────────────────────────────────────────────── */

const SURFACES = ["--card", "--background", "--muted", "--sidebar"]

/** Tokens used as words. WCAG 2.1 AA, normal text. */
const TEXT = [
  "--foreground", "--muted-foreground", "--primary", "--destructive",
  "--dp-good-text", "--dp-warn-text", "--dp-bad-text", "--dp-managed",
]

/** Tokens used as shapes — fills, borders, icons, the focus ring. AA non-text.
 *  `--input` is in here because a field's edge is what identifies the field: WCAG
 *  1.4.11 covers it, where a decorative rule between sections is not covered. */
const SOLID = [
  "--dp-good", "--dp-warn", "--dp-bad", "--dp-aqua", "--ring", "--input",
  "--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5",
]

/** A foreground printed directly on its own fill. */
const ON_FILL = [
  ["--primary-foreground", "--primary"],
  ["--secondary-foreground", "--secondary"],
  ["--accent-foreground", "--accent"],
  ["--card-foreground", "--card"],
  ["--popover-foreground", "--popover"],
  ["--sidebar-foreground", "--sidebar"],
  ["--sidebar-primary-foreground", "--sidebar-primary"],
  ["--sidebar-accent-foreground", "--sidebar-accent"],
]

/** Deliberately not asserted. See the "What it does not guarantee" note in the
 *  README: raising these to 3:1 is a design change, not a value change. */
const EXCLUDED = {
  "--border": "draws structure between sections rather than identifying a control, so 1.4.11 does not reach it",
  "--sidebar-border": "same as --border",
  "--sidebar-ring": "duplicates --ring, which is asserted",
}

/* ── run ──────────────────────────────────────────────────────────────────── */

const css = readFileSync(TOKENS, "utf8")
const themes = [
  ["light", readBlock(css, ":root")],
  ["dark", readBlock(css, ".dark")],
]

let checks = 0
const failures = []
const unparsed = []

function check(theme, label, fg, bg, need, ground = bg) {
  checks++
  const ratio = contrast(fg, bg, ground)
  const ok = ratio + 1e-9 >= need
  if (!ok) failures.push({ theme, label, ratio, need })
  if (VERBOSE || !ok) {
    console.log(
      `  ${ok ? "pass" : "FAIL"} ${ratio.toFixed(2).padStart(5)} (>= ${need})  ${label}`
    )
  }
}

for (const [theme, T] of themes) {
  if (VERBOSE) console.log(`\n=== ${theme} ===`)

  for (const [name, value] of Object.entries(T)) {
    if (value.unparsed && !(name in EXCLUDED)) unparsed.push(`${theme} ${name}: ${value.unparsed}`)
  }

  const surfaces = SURFACES.map((s) => [s, T[s]]).filter(([, v]) => v && !v.unparsed)
  if (surfaces.length !== SURFACES.length) {
    throw new Error(`${theme}: could not resolve every surface token`)
  }

  for (const name of TEXT) {
    const fg = T[name]
    if (!fg || fg.unparsed) { unparsed.push(`${theme} ${name}`); continue }
    for (const [sn, sv] of surfaces) {
      check(theme, `${name} on ${sn}`, fg, sv, 4.5)
      check(theme, `${name} on ${name}/10 over ${sn}`, fg, tint(fg, sv), 4.5)
    }
  }

  for (const name of SOLID) {
    const fg = T[name]
    if (!fg || fg.unparsed) { unparsed.push(`${theme} ${name}`); continue }
    for (const [sn, sv] of surfaces) check(theme, `${name} on ${sn}`, fg, sv, 3.0)
  }

  for (const [fgName, bgName] of ON_FILL) {
    const fg = T[fgName], bg = T[bgName]
    if (!fg || !bg || fg.unparsed || bg.unparsed) {
      unparsed.push(`${theme} ${fgName} on ${bgName}`)
      continue
    }
    check(theme, `${fgName} on ${bgName} (${hex(bg)})`, fg, bg, 4.5)
  }
}

console.log()
for (const [name, why] of Object.entries(EXCLUDED)) {
  console.log(`  skip  ${name} — ${why}`)
}
console.log()

if (unparsed.length) {
  console.error("Could not resolve these tokens, so they went unmeasured:")
  for (const u of unparsed) console.error(`  - ${u}`)
  console.error()
}

if (failures.length || unparsed.length) {
  console.error(
    `${checks} checks, ${failures.length} failing, ${unparsed.length} unmeasured`
  )
  process.exit(1)
}

console.log(`${checks} checks, all passing.`)
