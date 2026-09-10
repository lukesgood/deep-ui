#!/usr/bin/env node
/**
 * What copying a component actually costs, in bytes an adopter ships.
 *
 * Not a CI gate. The demo bundles all forty-nine primitives, so its size is not what
 * anybody pays — an adopter pays for what they copy. This exists so the numbers in
 * the README's "What it costs" section can be re-derived rather than trusted, and so
 * a dependency that quietly doubles is visible.
 *
 * Each figure is a real Vite build, minified, minus the react + react-dom floor that
 * every app pays anyway. Minified, not gzipped: gzip is roughly a third, but the
 * ratios are what the decision turns on.
 *
 *   npm run size            # the three cost tiers
 *   npm run size -- --all   # every primitive, largest first
 */

import { build } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"
import { readdirSync, writeFileSync, rmSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const TMP = join(ROOT, ".size-tmp")
const PRELUDE = `import * as R from "react";\nimport * as D from "react-dom/client";\n`
let n = 0

async function bytes(code) {
  const file = join(TMP, `e${n++}.tsx`)
  writeFileSync(file, code)
  const out = await build({
    root: ROOT,
    logLevel: "silent",
    configFile: false,
    plugins: [react()],
    resolve: { alias: { "@": fileURLToPath(new URL("../src/", import.meta.url)) } },
    build: { write: false, minify: "esbuild", lib: { entry: file, formats: ["es"], fileName: "b" } },
  })
  const chunks = (Array.isArray(out) ? out[0].output : out.output).filter((c) => c.type === "chunk")
  return chunks.reduce((total, c) => total + Buffer.byteLength(c.code), 0)
}

rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP)
try {
  const floor = await bytes(PRELUDE + "export default [R,D]")
  const kb = (b) => `${((b - floor) / 1024).toFixed(1)} kB`.padStart(9)

  console.log(`\nreact + react-dom floor, excluded from everything below: ${(floor / 1024).toFixed(0)} kB\n`)

  if (process.argv.includes("--all")) {
    const names = readdirSync(join(ROOT, "src/components/ui"))
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => f.slice(0, -4))
    const rows = []
    for (const name of names) {
      rows.push([name, await bytes(PRELUDE + `import * as C from "@/components/ui/${name}";export default [R,D,C]`)])
    }
    for (const [name, size] of rows.sort((a, b) => b[1] - a[1])) console.log(`${kb(size)}  ${name}`)
    console.log("\nThese overlap heavily — see the tiers below before adding them up.\n")
  }

  const tiers = [
    ["clsx", 'import c from "clsx";export default [R,D,c]'],
    ["class-variance-authority", 'import {cva} from "class-variance-authority";export default [R,D,cva]'],
    ["one lucide icon", 'import {X} from "lucide-react";export default [R,D,X]'],
    ["tailwind-merge", 'import {twMerge} from "tailwind-merge";export default [R,D,twMerge]'],
    ["cn() — clsx + tailwind-merge", 'import {cn} from "@/lib/utils";export default [R,D,cn]'],
    ["a Base UI control (Button)", 'import {Button} from "@base-ui/react/button";export default [R,D,Button]'],
    ["a Base UI popup (Popover)", 'import {Popover} from "@base-ui/react/popover";export default [R,D,Popover]'],
    ["two popups (Popover + Menu)", 'import {Popover} from "@base-ui/react/popover";import {Menu} from "@base-ui/react/menu";export default [R,D,Popover,Menu]'],
  ]
  for (const [label, code] of tiers) console.log(`${kb(await bytes(PRELUDE + code))}  ${label}`)
  console.log()
} finally {
  rmSync(TMP, { recursive: true, force: true })
}
