/** Do the selectors in tokens.css point at anything that exists?
 *
 *  A stylesheet can name a component that was never built, or one that has since
 *  been renamed, and nothing complains: the rule simply never matches and the styling
 *  quietly does not happen. That is how `@media print` shipped here hiding
 *  `[data-slot="toast"]` when the toast viewport carried no `data-slot` at all — the
 *  overlays would have printed on top of the page and the only symptom would have
 *  been a bad printout, months later, on somebody else's paper.
 *
 *  Print and `prefers-contrast` styles make this worse than usual, because almost
 *  nobody looks at them. So they get checked instead of looked at.
 *
 *  Both directions are wrong, and both are checked:
 *    - a selector in the stylesheet that no component emits  → dead rule
 *    - a `.dp-*` class the stylesheet defines that nothing uses → dead style
 */
import { readFileSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const TOKENS = join(ROOT, "src/styles/tokens.css")

/** Classes the stylesheet offers adopters but does not itself have to use.
 *  An entry here says "unused on purpose", and has to say why. */
const OFFERED = {
  ".dp-num":
    "tabular figures for anywhere an adopter renders numbers; the design system uses it in a few places but its reason to exist is their tables",
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

const css = readFileSync(TOKENS, "utf8")
const files = ["src", "templates"].map((d) => join(ROOT, d)).flatMap(walk)
const sources = new Map(files.map((f) => [relative(ROOT, f), readFileSync(f, "utf8")]))
const code = [...sources.values()].join("\n")

const problems = []

/* ── selectors the stylesheet names ───────────────────────────────────────── */

const slots = new Set([...css.matchAll(/\[data-slot="([\w-]+)"\]/g)].map((m) => m[1]))
for (const slot of [...slots].sort()) {
  if (!code.includes(`data-slot="${slot}"`)) {
    problems.push(`tokens.css styles [data-slot="${slot}"], which no component emits`)
  }
}

/* ── classes the stylesheet defines ───────────────────────────────────────── */

// A definition is a class at the head of a rule; a `.dp-x` inside `:is(...)` or as a
// second selector counts too, which is why this matches anywhere and dedupes.
const classes = new Set([...css.matchAll(/\.(dp-[\w-]+)/g)].map((m) => `.${m[1]}`))
for (const cls of [...classes].sort()) {
  if (cls in OFFERED) continue
  const bare = cls.slice(1)
  // In JSX the class arrives inside a className string, so a word-boundary match
  // over the source is the honest test — `dp-surface` must not match `dp-surfaced`.
  if (!new RegExp(`\\b${bare}\\b`).test(code)) {
    problems.push(`tokens.css defines ${cls}, which nothing in src/ or templates/ uses`)
  }
}

if (problems.length) {
  console.error(`\n${problems.length} dead selector(s):\n`)
  for (const p of problems) console.error(`  ${p}`)
  console.error()
  process.exit(1)
}

console.log(
  `${slots.size} data-slot selectors and ${classes.size} dp-* classes in tokens.css, ` +
    `all reaching real markup` +
    (Object.keys(OFFERED).length ? ` (${Object.keys(OFFERED).length} offered to adopters)` : "")
)
