#!/usr/bin/env node
/**
 * The README makes countable claims — how many primitives, how many tests, how many
 * contrast pairs. Three of them had already drifted by the time anyone looked, which
 * is the normal fate of a number written in prose next to code that keeps moving.
 *
 * So the numbers are checked too. Each rule finds the claim in the file and compares
 * it against the thing it is describing.
 *
 *   node scripts/check-docs.mjs
 */

import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const read = (file) => readFileSync(join(ROOT, file), "utf8")

/** Ask the tools themselves rather than trusting a second copy of the number. */
function countTests() {
  const out = execFileSync("npx", ["vitest", "run", "--reporter=json"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: { ...process.env, CI: "1" },
  })
  return JSON.parse(out.slice(out.indexOf("{"))).numTotalTests
}

function countContrastPairs() {
  const out = execFileSync("node", ["scripts/check-contrast.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
  })
  return Number(out.match(/(\d+) checks/)?.[1])
}

const primitives = readdirSync(join(ROOT, "src/components/ui")).filter((f) =>
  f.endsWith(".tsx")
).length

const RULES = [
  {
    what: "primitives",
    actual: primitives,
    claims: [["README.md", /(\d+) UI primitives/g], ["README.md", /(\d+) primitives \(shadcn/g]],
  },
  {
    what: "contrast pairs",
    actual: countContrastPairs(),
    claims: [["README.md", /That is (\d+) pairs/g], ["CONTRIBUTING.md", /measures (\d+) pairs/g]],
  },
  {
    what: "tests",
    actual: countTests(),
    claims: [["README.md", /npm test\s+# (\d+) tests/g]],
  },
]

const problems = []

for (const rule of RULES) {
  let found = 0
  for (const [file, pattern] of rule.claims) {
    const text = read(file)
    for (const match of text.matchAll(pattern)) {
      found++
      const claimed = Number(match[1])
      if (claimed !== rule.actual) {
        problems.push(
          `${file}: claims ${claimed} ${rule.what}, but there are ${rule.actual}` +
            `\n     …${match[0]}…`
        )
      }
    }
  }
  if (found === 0) {
    // A claim that has been reworded out of existence is not a pass — the rule is
    // now watching nothing, and would keep reporting green forever.
    problems.push(
      `no claim about ${rule.what} matched. Either the wording moved, or the rule in ` +
        `scripts/check-docs.mjs needs updating to follow it.`
    )
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`)
  for (const p of problems) console.error(`  ${p}\n`)
  process.exit(1)
}

console.log(
  `docs agree with the code: ${primitives} primitives, ` +
    `${RULES[1].actual} contrast pairs, ${RULES[2].actual} tests`
)
