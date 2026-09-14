/**
 * Colour-vision maths for the chart ramp: OKLab / OKLCH, colour-blindness
 * simulation, and the distance between two colours as a reader sees them.
 *
 * Written from the published formulas, and nothing else:
 *
 *   - OKLab: Björn Ottosson, "A perceptual color space for image processing"
 *     (2020), https://bottosson.github.io/posts/oklab/
 *   - CVD simulation: Machado, Oliveira & Fernandes, "A Physiologically-based
 *     Model for Simulation of Color Vision Deficiency", IEEE TVCG 15(6), 2009.
 *     The severity 1.0 matrices from the paper's table, applied to linear sRGB.
 *
 * Pure: no file access, no output. check-palette.mjs decides what passes, and
 * test/palette.test.ts holds these numbers still.
 */

/* ── sRGB ↔ linear ────────────────────────────────────────────────────────── */

/** One 0–255 sRGB channel to linear light (IEC 61966-2-1). */
export const toLinear = (c) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/* ── OKLab ────────────────────────────────────────────────────────────────── */

/** Linear sRGB [r, g, b] (0–1) -> OKLab [L, a, b]. */
export function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** 0–255 sRGB [r, g, b, …] -> OKLab. Any alpha is ignored; the caller decides
 *  what a translucent series colour means before it gets here. */
export const oklab = (rgb) => linearToOklab(rgb.slice(0, 3).map(toLinear))

/** 0–255 sRGB -> OKLCH { L, C, h }, hue in degrees 0–360. */
export function oklch(rgb) {
  const [L, a, b] = oklab(rgb)
  const h = (Math.atan2(b, a) * 180) / Math.PI
  return { L, C: Math.hypot(a, b), h: h < 0 ? h + 360 : h }
}

/* ── colour-vision deficiency ─────────────────────────────────────────────── */

/** Machado et al. 2009, severity 1.0 — full dichromacy, the worst case. Each row
 *  sums to 1, so a neutral grey is seen as itself by everyone. */
export const MACHADO = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
}

export const CVD_TYPES = /** @type {const} */ (["protan", "deutan", "tritan"])

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/** How a 0–255 sRGB colour appears under one deficiency, as OKLab. The matrix
 *  can push a saturated colour slightly outside [0, 1]; a screen cannot show that,
 *  so it is clamped before the colour is measured. */
export function simulate(rgb, type) {
  const M = MACHADO[type]
  if (!M) throw new Error(`unknown colour-vision deficiency: ${type}`)
  const lin = rgb.slice(0, 3).map(toLinear)
  const out = M.map((row) => clamp01(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]))
  return linearToOklab(out)
}

/* ── distance ─────────────────────────────────────────────────────────────── */

/** Euclidean OKLab distance, ×100 so the thresholds read as whole numbers. */
export const deltaE = (p, q) => 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])

/** Distance between two sRGB colours with normal vision. */
export const normalDeltaE = (x, y) => deltaE(oklab(x), oklab(y))

/** Distance between two sRGB colours as seen with one deficiency. */
export const cvdDeltaE = (x, y, type) => deltaE(simulate(x, type), simulate(y, type))

/** The closest the two colours get across all three deficiencies. */
export function worstCvd(x, y) {
  let worst = { deltaE: Infinity, type: "" }
  for (const type of CVD_TYPES) {
    const d = cvdDeltaE(x, y, type)
    if (d < worst.deltaE) worst = { deltaE: d, type }
  }
  return worst
}

/* ── the gates for a categorical ramp ─────────────────────────────────────── */

/** What a chart ramp owes a reader, in its fixed slot order.
 *
 *  - cvd:    neighbouring series under each simulated deficiency. Between `warn` and
 *            `pass` is legal only where the chart separates series some other way as
 *            well — direct labels, gaps, texture.
 *  - normal: neighbouring series with normal vision. Closer than this, two series are
 *            one series to everybody.
 *  - band:   OKLCH lightness, by the ground the series sit on. Too light on a light
 *            ground and a thin line washes out; too light on a dark ground and the
 *            brightest series shouts over the rest.
 *  - chroma: below this a series reads as grey, and grey reads as "disabled". */
export const GATES = {
  cvd: { pass: 8, warn: 6 },
  normal: 15,
  band: { light: [0.43, 0.77], dark: [0.48, 0.67] },
  chroma: 0.1,
}

/** Which lightness band a ground calls for. */
export const groundMode = (rgb) => (oklab(rgb)[0] >= 0.5 ? "light" : "dark")

const EPS = 1e-9

/**
 * @typedef {object} Measurement
 * @property {"band" | "chroma" | "normal" | "cvd"} gate
 * @property {number[]} slots   0-based; one slot, or two neighbours
 * @property {number} value
 * @property {string} need
 * @property {"pass" | "warn" | "fail"} status
 * @property {string} [type]    cvd only: protan, deutan or tritan
 * @property {string} [mode]    band only: the ground it was measured for
 */

/** Every gate, for one ramp against the grounds it is drawn on. A ramp shown on two
 *  grounds that call for different bands has to sit inside both.
 *
 *  @param {number[][]} ramp     0–255 sRGB, in slot order
 *  @param {number[][]} grounds  0–255 sRGB
 *  @returns {Measurement[]} */
export function assessRamp(ramp, grounds) {
  /** @type {Measurement[]} */
  const results = []
  const modes = [...new Set(grounds.map(groundMode))]

  ramp.forEach((color, i) => {
    const { L, C } = oklch(color)
    for (const mode of modes) {
      const [lo, hi] = GATES.band[mode]
      const ok = L >= lo - EPS && L <= hi + EPS
      results.push({ gate: "band", mode, slots: [i], value: L, need: `${lo}–${hi}`, status: ok ? "pass" : "fail" })
    }
    const ok = C + EPS >= GATES.chroma
    results.push({ gate: "chroma", slots: [i], value: C, need: `>= ${GATES.chroma}`, status: ok ? "pass" : "fail" })
  })

  for (let i = 0; i + 1 < ramp.length; i++) {
    const slots = [i, i + 1]
    const n = normalDeltaE(ramp[i], ramp[i + 1])
    results.push({ gate: "normal", slots, value: n, need: `>= ${GATES.normal}`, status: n + EPS >= GATES.normal ? "pass" : "fail" })
    for (const type of CVD_TYPES) {
      const d = cvdDeltaE(ramp[i], ramp[i + 1], type)
      const status = d + EPS >= GATES.cvd.pass ? "pass" : d + EPS >= GATES.cvd.warn ? "warn" : "fail"
      results.push({ gate: "cvd", type, slots, value: d, need: `>= ${GATES.cvd.pass}`, status })
    }
  }

  return results
}

/** Every pair, not just neighbours: five series in a scatter plot can all end up next
 *  to each other. Information, not a gate — the slot order is the contract. */
export function allPairs(ramp) {
  const out = []
  for (let i = 0; i < ramp.length; i++) {
    for (let j = i + 1; j < ramp.length; j++) {
      out.push({ slots: [i, j], normal: normalDeltaE(ramp[i], ramp[j]), worst: worstCvd(ramp[i], ramp[j]) })
    }
  }
  return out
}
