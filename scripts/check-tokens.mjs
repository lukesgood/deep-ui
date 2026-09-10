#!/usr/bin/env node
/**
 * Guards the rules that this system keeps breaking when nobody is looking, across
 * everything that gets copied into someone's project — `src/` and `templates/`.
 *
 * Three of the bugs in this repo's history were a component reaching past the
 * tokens for a literal colour, and each one was invisible in whichever theme the
 * author happened to be using. A reviewer will not reliably catch the fourth.
 *
 * Every rule carries an ALLOWED list with a reason per entry, so an exception is
 * as reviewable as a violation.
 *
 *   node scripts/check-tokens.mjs [--verbose]
 */

import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const VERBOSE = process.argv.includes("--verbose")

const TAILWIND_PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|" +
  "cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"

const RULES = [
  {
    id: "palette-literal",
    why: "colours must resolve through a token, or one theme silently breaks",
    pattern: new RegExp(
      String.raw`\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|shadow|accent|caret|divide|placeholder)-(?:${TAILWIND_PALETTE})-\d{2,3}\b`,
      "g"
    ),
    allowed: {},
  },
  {
    id: "hex-literal",
    why: "a hard-coded colour cannot follow the theme",
    pattern: /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/g,
    allowed: {},
  },
  {
    id: "raw-z-index",
    why: "stacking order belongs on the --dp-z-* ladder, or overlays fight by DOM order",
    pattern: /\bz-\d+\b/g,
    allowed: {
      "src/components/ui/tooltip.tsx":
        "lifts a <kbd> above its siblings inside the tooltip's own stacking context — local, not a rung on the ladder",
      "src/components/ui/select.tsx":
        "the scroll-up/down buttons inside the select popup — local to that popup",
    },
  },
  {
    id: "baked-in-string",
    why: "a word the component says itself has to be overridable — see src/lib/strings.tsx",
    // aria-label carries most of them, which is what makes this worth a rule: an
    // untranslated visible label is obvious, an untranslated aria-label is invisible
    // to everyone except the person relying on it.
    pattern: /(?:aria-label|title|placeholder)="[A-Za-z][^"]*"|sr-only">[A-Z][a-z]/g,
    allowed: {
      "templates/sign-in.tsx": "a template is example code — its words are meant to be rewritten, not translated",
      "templates/profile.tsx": "same",
      "templates/settings.tsx": "same",
      "templates/assistant-shell.tsx": "same",
    },
  },
  {
    id: "raw-html",
    why: "SECURITY.md promises no path from content to markup; this is that promise, enforced",
    pattern: /dangerouslySetInnerHTML|\.innerHTML\s*=/g,
    allowed: {},
  },
  {
    id: "arbitrary-font-size",
    why: "type sizes come from the scale; add a step to @theme rather than a one-off",
    pattern: /text-\[[0-9.]+(?:px|rem)\]/g,
    allowed: {},
  },
]

/** `text-[0.9em]` and friends are sized against their parent, which no fixed step
 *  can express, so em-relative values are outside the arbitrary-size rule. */

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

// Both trees are copy-in, so both answer to the same rules. Paths are reported
// relative to the repo root so an allowlist entry says which tree it is in.
const ROOTS = ["src", "templates"]
const files = ROOTS.flatMap((dir) => walk(join(ROOT, dir)))
const violations = []
let scanned = 0

for (const file of files) {
  const rel = relative(ROOT, file)
  const lines = readFileSync(file, "utf8").split("\n")
  scanned++

  for (const rule of RULES) {
    const excuse = rule.allowed[rel]
    lines.forEach((line, i) => {
      const hits = line.match(rule.pattern)
      if (!hits) return
      if (excuse) {
        if (VERBOSE) console.log(`  allow ${rel}:${i + 1} ${rule.id} — ${excuse}`)
        return
      }
      violations.push({ rel, line: i + 1, rule, hits: [...new Set(hits)] })
    })
  }
}

if (violations.length) {
  console.error(`\n${violations.length} violation(s):\n`)
  for (const v of violations) {
    console.error(`  ${v.rel}:${v.line}  ${v.rule.id}  ${v.hits.join(" ")}`)
    console.error(`     ${v.rule.why}\n`)
  }
  process.exit(1)
}

const exceptions = RULES.reduce((n, r) => n + Object.keys(r.allowed).length, 0)
console.log(
  `${scanned} files, ${RULES.length} rules, no violations` +
    (exceptions ? ` (${exceptions} documented exceptions)` : "")
)
