#!/usr/bin/env node
/**
 * Verifies that the chart ramp can be told apart by a colour-blind reader.
 *
 * The README says `--chart-1` … `--chart-5` are spaced apart in hue. That is true and
 * not enough: distance in hue says nothing about what a protan or deutan reader sees,
 * and green beside orange — slots 4 and 5 — is the textbook deutan confusion. So this
 * measures the colours as they are seen rather than as they are written, in every
 * palette check-contrast measures:
 *
 *   - neighbouring series under protan, deutan and tritan simulation
 *     (Machado et al. 2009, severity 1)            ΔE >= 8 pass, 6–8 warn, < 6 fail
 *   - neighbouring series with normal vision       ΔE >= 15
 *   - each series' OKLCH lightness, in the band its ground calls for
 *                                                  light 0.43–0.77, dark 0.48–0.67
 *   - each series' OKLCH chroma                     >= 0.1
 *
 * ΔE is Euclidean distance in OKLab, ×100. Neighbours are adjacent slots, because a
 * chart library hands series out in slot order and a legend or a stacked bar shows
 * them that way. The ground is `--card` and `--background` from the same palette; a
 * ramp drawn on both has to suit both. Contrast against the ground is check-contrast's
 * job and is not repeated here.
 *
 * A warn does not fail the run. It is printed, because it is only legal where the
 * chart separates its series some other way too — direct labels, gaps, texture.
 *
 * Anything it cannot parse is a failure, not a skip. The parsing is shared with
 * check-contrast (scripts/lib/tokens.mjs); the maths is in scripts/lib/palette.mjs and
 * is held still by test/palette.test.ts.
 *
 *   node scripts/check-palette.mjs [--verbose]
 *
 * --verbose adds every measurement, each series' OKLCH, the colour-blind distance of
 * every pair rather than just neighbours, and the series nearest each status colour.
 * Those last three are information, not gates.
 */

import { hex, readThemes } from "./lib/tokens.mjs"
import { GATES, allPairs, assessRamp, normalDeltaE, oklch } from "./lib/palette.mjs"

const VERBOSE = process.argv.includes("--verbose")

const RAMP = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"]
const GROUNDS = ["--card", "--background"]

/** A series should not be mistakable for a status. Reported with --verbose. */
const STATUS = ["--dp-good", "--dp-warn", "--dp-bad"]

const pairName = (slots) => slots.map((i) => RAMP[i]).join(" / ")

function describe(r) {
  if (r.gate === "cvd") return `${pairName(r.slots)}, ${r.type}`
  if (r.gate === "normal") return `${pairName(r.slots)}, normal vision`
  if (r.gate === "band") return `${pairName(r.slots)} lightness, ${r.mode} ground`
  return `${pairName(r.slots)} chroma`
}

const LABEL = { pass: "pass", warn: "WARN", fail: "FAIL" }

let checks = 0
let warnings = 0
const failures = []
const unparsed = []

for (const [theme, T] of readThemes()) {
  function resolve(name) {
    const v = T[name]
    if (!v || v.unparsed) {
      unparsed.push(`${theme} ${name}${v ? `: ${v.unparsed}` : " (not declared)"}`)
      return null
    }
    // A translucent colour takes its value from whatever is under it, so it has no
    // single colour to measure. Say so rather than guess a ground.
    if (v[3] !== 1) {
      unparsed.push(`${theme} ${name}: translucent, so it has no colour of its own`)
      return null
    }
    return v
  }

  const ramp = RAMP.map(resolve)
  const grounds = GROUNDS.map(resolve)
  if (ramp.includes(null) || grounds.includes(null)) continue

  const lines = []
  for (const r of assessRamp(ramp, grounds)) {
    checks++
    if (r.status === "fail") failures.push(r)
    if (r.status === "warn") warnings++
    if (VERBOSE || r.status !== "pass") {
      const value = r.gate === "band" || r.gate === "chroma" ? r.value.toFixed(3) : r.value.toFixed(2)
      lines.push(`  ${LABEL[r.status]} ${value.padStart(6)} (${r.need})  ${describe(r)}`)
    }
  }

  if (VERBOSE) {
    lines.push("")
    ramp.forEach((c, i) => {
      const { L, C, h } = oklch(c)
      lines.push(`  info  ${RAMP[i]} ${hex(c)}  L ${L.toFixed(3)}  C ${C.toFixed(3)}  h ${h.toFixed(1)}`)
    })

    lines.push("")
    const pairs = allPairs(ramp).sort((a, b) => a.worst.deltaE - b.worst.deltaE)
    for (const p of pairs) {
      lines.push(
        `  info  ${p.worst.deltaE.toFixed(2).padStart(6)} ${p.worst.type.padEnd(6)} ` +
          `normal ${p.normal.toFixed(2).padStart(6)}  ${pairName(p.slots)}`
      )
    }
    lines.push(
      `  info  worst of all ${pairs.length} pairs is ${pairs[0].worst.deltaE.toFixed(2)} ` +
        `(${pairs[0].worst.type}) — neighbours in a scatter plot, not in slot order`
    )

    lines.push("")
    for (const s of STATUS) {
      const sv = T[s]
      if (!Array.isArray(sv)) { lines.push(`  info  ${s} not resolved`); continue }
      const nearest = ramp
        .map((c, i) => ({ i, d: normalDeltaE(c, sv) }))
        .sort((a, b) => a.d - b.d)[0]
      lines.push(
        `  info  nearest series to ${s} ${hex(sv)} is ${RAMP[nearest.i]}, ` +
          `normal-vision ΔE ${nearest.d.toFixed(2)}`
      )
    }
  }

  if (lines.length) {
    console.log(`\n=== ${theme} ===`)
    for (const line of lines) console.log(line)
  }
}

console.log()

if (unparsed.length) {
  console.error("Could not resolve these tokens, so the ramp went unmeasured:")
  for (const u of unparsed) console.error(`  - ${u}`)
  console.error()
}

const summary =
  `${checks} checks, ${failures.length} failing, ` +
  `${warnings} warning${warnings === 1 ? "" : "s"}, ${unparsed.length} unmeasured`

if (failures.length || unparsed.length) {
  console.error(summary)
  if (failures.length) {
    console.error(
      `\nNeighbouring series need ΔE >= ${GATES.cvd.pass} under every simulated deficiency ` +
        `(${GATES.cvd.warn}–${GATES.cvd.pass} only with labels or gaps), >= ${GATES.normal} ` +
        `with normal vision, and lightness inside the band. --verbose shows every measurement.`
    )
  }
  process.exit(1)
}

if (warnings) {
  console.log(`${summary}. A warning is legal only with a second encoding: labels, gaps or texture.`)
} else {
  console.log(`${checks} checks, all passing.`)
}
