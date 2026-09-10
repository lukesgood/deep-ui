#!/usr/bin/env node
/**
 * The copy-in contract: everything under `src/` has to work after being copied into
 * somebody else's project, where nothing of this repo exists except the files they
 * took and the dependencies the README told them to install.
 *
 * That contract was broken and nobody noticed, because the only thing ever checked
 * was whether the files compiled *here*. Four of them did not compile in a stock Vite
 * app — a `ReactNode` imported as a value, a stray `import * as React` — and the
 * repo's own tsconfig was too lenient to say so. It now uses the same options Vite's
 * react-ts template does, which covers that half.
 *
 * This covers the other half: every import has to be either a `@/` path that lands
 * inside the copied tree, or a package the README actually tells people to install.
 * A relative import climbing out of `src/`, or a devDependency that happens to be
 * present here, would resolve in this repo and fail in theirs.
 *
 *   node scripts/check-portable.mjs
 */

import { readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve, dirname } from "node:path"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const SRC = join(ROOT, "src")

/** Exactly what the README's "1. Dependencies" step installs, plus React itself. */
const ALLOWED_PACKAGES = new Set([
  "react",
  "react-dom",
  "@base-ui/react",
  "class-variance-authority",
  "clsx",
  "tailwind-merge",
  "lucide-react",
  "tw-animate-css",
  "shadcn",
])

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name)
    return e.isDirectory() ? walk(full) : /\.tsx?$/.test(e.name) ? [full] : []
  })
}

/** `@base-ui/react/select` → `@base-ui/react`; `lucide-react` → `lucide-react`. */
function packageOf(specifier) {
  const parts = specifier.split("/")
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]
}

const problems = []

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file)
  const text = readFileSync(file, "utf8")

  for (const match of text.matchAll(/(?:from|import)\s+"([^"]+)"/g)) {
    const spec = match[1]

    if (spec.startsWith("@/")) {
      // Must land on a real file inside the copied tree.
      const target = join(SRC, spec.slice(2))
      const found = [".ts", ".tsx", ".css", "/index.ts", "/index.tsx", ""].some((ext) =>
        existsSync(target + ext)
      )
      if (!found) problems.push(`${rel}: "${spec}" does not resolve inside src/`)
      continue
    }

    if (spec.startsWith(".")) {
      const target = resolve(dirname(file), spec)
      if (!target.startsWith(SRC)) {
        problems.push(
          `${rel}: "${spec}" climbs out of src/. It resolves here and will not in a copy.`
        )
      }
      continue
    }

    const pkg = packageOf(spec)
    if (!ALLOWED_PACKAGES.has(pkg)) {
      problems.push(
        `${rel}: imports "${pkg}", which the README does not tell anyone to install.`
      )
    }
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`)
  for (const p of problems) console.error(`  ${p}\n`)
  process.exit(1)
}

console.log(
  `src/ is portable: every import resolves inside the copied tree or to one of the ` +
    `${ALLOWED_PACKAGES.size} packages the README lists`
)
