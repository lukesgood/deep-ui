// @vitest-environment node
// Plain maths and a file read; no DOM. happy-dom's own URL also cannot resolve the
// file: URL the token reader locates tokens.css with.
import { describe, expect, it } from "vitest"

import { parseColor, readThemes } from "../scripts/lib/tokens.mjs"
import {
  CVD_TYPES,
  MACHADO,
  assessRamp,
  cvdDeltaE,
  normalDeltaE,
  oklab,
  oklch,
  simulate,
} from "../scripts/lib/palette.mjs"

/** The maths behind `check:palette`. A checker built on a wrong formula passes the
 *  wrong palettes with complete confidence, and nothing downstream of it can tell. */

const rgb = (value: string) => {
  const c = parseColor(value)
  if (!c) throw new Error(`fixture is not a colour: ${value}`)
  return c
}

describe("OKLab", () => {
  it("puts white at L 1 with no colour", () => {
    const [L, a, b] = oklab(rgb("#ffffff"))
    expect(L).toBeCloseTo(1, 3)
    expect(a).toBeCloseTo(0, 3)
    expect(b).toBeCloseTo(0, 3)
  })

  it("gives sRGB red the value CSS Color 4 gives it, oklch(62.8% 0.2577 29.23)", () => {
    const { L, C, h } = oklch(rgb("#ff0000"))
    expect(L).toBeCloseTo(0.628, 3)
    expect(C).toBeCloseTo(0.2577, 3)
    expect(h).toBeCloseTo(29.23, 1)
  })
})

describe("colour-blindness simulation (Machado et al. 2009, severity 1)", () => {
  // The property the paper's model is built to keep — the grey axis is seen the same by
  // everybody — and the one a mistyped digit in a matrix breaks.
  it("has rows that sum to 1 in every matrix", () => {
    for (const type of CVD_TYPES) {
      for (const row of MACHADO[type]) {
        expect(row[0] + row[1] + row[2]).toBeCloseTo(1, 5)
      }
    }
  })

  it("leaves a neutral grey exactly where it was", () => {
    for (const grey of ["#000000", "#777777", "#ffffff"]) {
      const actual = oklab(rgb(grey))
      for (const type of CVD_TYPES) {
        simulate(rgb(grey), type).forEach((v, i) => expect(v).toBeCloseTo(actual[i], 4))
      }
    }
  })

  it("collapses red against green for a deutan, and not for a tritan", () => {
    const red = rgb("#d62728")
    const green = rgb("#2ca02c")
    expect(normalDeltaE(red, green)).toBeGreaterThan(15)
    expect(cvdDeltaE(red, green, "deutan")).toBeLessThan(8)
    expect(cvdDeltaE(red, green, "tritan")).toBeGreaterThan(15)
  })
})

// The ramp this check was written against, as it was then. Held as literals rather than
// read from tokens.css, so fixing the tokens does not break the test that says why they
// needed fixing. Each number was confirmed against an independent implementation to
// within 0.05 ΔE.
const LIGHT_BEFORE = ["#0995ad", "#5f58e4", "#d756b7", "#539924", "#d26d09"].map(rgb)
const DARK_BEFORE = ["#23bcd7", "#847ef7", "#e755c2", "#80cb4d", "#fbbd23"].map(rgb)

describe("the chart ramp before this check existed", () => {
  it("put green beside orange, which a deutan cannot tell apart", () => {
    const [, , , green, orange] = LIGHT_BEFORE
    expect(normalDeltaE(green, orange)).toBeCloseTo(20.95, 1)
    expect(cvdDeltaE(green, orange, "deutan")).toBeCloseTo(4.53, 1)
  })

  it("and in the dark theme, green beside amber, which a protan cannot", () => {
    const [, , , green, amber] = DARK_BEFORE
    expect(cvdDeltaE(green, amber, "protan")).toBeCloseTo(2.38, 1)
  })

  it("fails the gates on exactly those pairs, and on dark lightness", () => {
    const failing = (ramp: number[][], ground: string) =>
      assessRamp(ramp, [rgb(ground)])
        .filter((r) => r.status === "fail")
        .map((r) => `${r.gate}${r.type ? ` ${r.type}` : ""} ${r.slots.map((s) => s + 1).join("-")}`)

    expect(failing(LIGHT_BEFORE, "#ffffff")).toEqual(["cvd deutan 4-5"])
    expect(failing(DARK_BEFORE, "#0e1c21")).toEqual([
      "band 1", "band 3", "band 4", "band 5", "cvd protan 4-5",
    ])
  })

  it("passed with slot 5 left out, in the light theme", () => {
    const results = assessRamp(LIGHT_BEFORE.slice(0, 4), [rgb("#ffffff")])
    expect(results.filter((r) => r.status !== "pass")).toEqual([])
  })
})

describe("the gates", () => {
  it("warns between 6 and 8, fails below 6, passes from 8", () => {
    // Light slots 4 and 5 happen to land one of each: protan 6.09, deutan 4.53, tritan 25.
    const [, , , green, orange] = LIGHT_BEFORE
    const cvd = assessRamp([green, orange], [rgb("#ffffff")]).filter((r) => r.gate === "cvd")
    expect(cvd.map((r) => [r.type, r.status])).toEqual([
      ["protan", "warn"], ["deutan", "fail"], ["tritan", "pass"],
    ])
  })

  it("holds a ramp to both bands when its two grounds call for different ones", () => {
    const light = assessRamp([rgb("#d26d09")], [rgb("#ffffff")]).filter((r) => r.gate === "band")
    const both = assessRamp([rgb("#d26d09")], [rgb("#ffffff"), rgb("#081317")]).filter((r) => r.gate === "band")
    expect(light.map((r) => r.mode)).toEqual(["light"])
    expect(both.map((r) => r.mode)).toEqual(["light", "dark"])
  })
})

describe("reading the ramp out of tokens.css", () => {
  it("finds five opaque series in every palette it measures", () => {
    const themes = readThemes()
    expect(themes.map(([name]) => name)).toEqual([
      "light", "dark", "light, prefers-contrast: more", "dark, prefers-contrast: more",
    ])
    for (const [, T] of themes) {
      for (let i = 1; i <= 5; i++) {
        const value = T[`--chart-${i}`]
        expect(Array.isArray(value) && value[3] === 1).toBe(true)
      }
    }
  })

  it("reports a value it cannot read as unparsed, not as absent", () => {
    const css = ":root {\n  --card: #ffffff;\n  --chart-4: oklch(0.6 0.16 136);\n}\n.dark {\n  --card: #0e1c21;\n}\n"
    const [[, light]] = readThemes(css)
    expect(light["--chart-4"]).toEqual({ unparsed: "oklch(0.6 0.16 136)" })
  })
})
