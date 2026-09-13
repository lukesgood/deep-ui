import { readdirSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, expect, test } from "vitest"
import { cleanup, render } from "@testing-library/react"

import { CASES, Providers, installBrowserStubs } from "./cases"

/** Every component in the directory, mounted once.
 *
 *  The cheap half of the suite, and it earns its keep: a `DropdownMenuLabel` outside a
 *  group throws, and a throw during render unmounts the whole page. That shipped here,
 *  because wiring a component and mounting one are different acts and only the first
 *  had been performed. */
afterEach(cleanup)
beforeEach(installBrowserStubs)


for (const [name, element] of Object.entries(CASES)) {
  test(`${name} mounts`, () => {
    const { container } = render(<Providers>{element}</Providers>)
    // A throw would have failed already; this catches the quieter failure of a
    // component that renders nothing at all.
    expect(container.firstChild).not.toBeNull()
  })
}

test("every component in the directory has a case here", () => {
  // cwd, not import.meta.url: under happy-dom the module URL is not a file: URL.
  const dir = join(process.cwd(), "src/components/ui")
  const onDisk = readdirSync(dir)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx$/, ""))
    .sort()
  expect(Object.keys(CASES).sort()).toEqual(onDisk)
})

