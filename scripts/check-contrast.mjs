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
 * The parsing lives in scripts/lib/tokens.mjs, shared with check-palette.mjs.
 *
 *   node scripts/check-contrast.mjs [--verbose]
 */

import { hex, over, readThemes } from "./lib/tokens.mjs"

const VERBOSE = process.argv.includes("--verbose")

/* ── colour ───────────────────────────────────────────────────────────────── */

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

/** Four palettes, not two: `prefers-contrast: more` is a palette too. See
 *  `readThemes` for how a conditional palette is merged onto its base. */
const themes = readThemes()

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
