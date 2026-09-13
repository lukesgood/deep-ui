/** Does every control the system renders have a name?
 *
 *  This is the "Naming" line of the README's audit list, taken as far as a machine can
 *  take it. Whether a name is a *good* name — whether "Show options" is what somebody
 *  wants read to them at that moment — needs a person. Whether a name exists at all
 *  does not, and that is the failure that actually ships: an icon-only button is a
 *  blank to a screen reader and looks perfectly fine to everyone else, so nobody who
 *  can see it is able to report it.
 *
 *  The name is computed the way a browser computes it (`dom-accessibility-api`, the
 *  same implementation Testing Library's `getByRole({ name })` uses), not by looking
 *  for an `aria-label`. `aria-labelledby`, a wrapping `<label>`, a `<title>` in an
 *  SVG and plain text content all count, because they all work.
 *
 *  It runs over `test/cases.tsx`, so a new primitive is covered the moment it gets an
 *  entry there — which the directory check in `smoke.test.tsx` makes compulsory.
 */
import { computeAccessibleName } from "dom-accessibility-api"
import { afterEach, beforeEach, expect, test } from "vitest"
import { cleanup, render } from "@testing-library/react"

import { CASES, Providers, installBrowserStubs } from "./cases"

afterEach(cleanup)
beforeEach(installBrowserStubs)

/** Roles whose name comes from the content they wrap rather than from the author, and
 *  which are allowed to be anonymous because something else names the group. */
const NAMED_BY_CONTEXT = new Set(["presentation", "none", "generic"])

const INTERACTIVE = [
  "button",
  "a[href]",
  "input:not([type=hidden])",
  "select",
  "textarea",
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  '[role="combobox"]',
  '[role="slider"]',
  '[role="spinbutton"]',
].join(",")

/** Anything inside an `aria-hidden` subtree is not in the accessibility tree at all,
 *  so it has no name to have. */
function hiddenFromAssistiveTech(el: Element) {
  for (let n: Element | null = el; n; n = n.parentElement) {
    if (n.getAttribute("aria-hidden") === "true") return true
    if (n.hasAttribute("hidden")) return true
  }
  return false
}

function describe(el: Element) {
  const slot = el.getAttribute("data-slot")
  const role = el.getAttribute("role")
  return `<${el.tagName.toLowerCase()}${role ? ` role="${role}"` : ""}${
    slot ? ` data-slot="${slot}"` : ""
  }>`
}

for (const [name, element] of Object.entries(CASES)) {
  test(`${name} names every control it renders`, () => {
    render(<Providers>{element}</Providers>)

    // Portalled content lands outside the container, and overlays are exactly where
    // unnamed close buttons live — so search the document, not the render root.
    const controls = [...document.body.querySelectorAll(INTERACTIVE)].filter(
      (el) => !hiddenFromAssistiveTech(el) && !NAMED_BY_CONTEXT.has(el.getAttribute("role") ?? "")
    )

    const anonymous = controls
      .filter((el) => !computeAccessibleName(el).trim())
      .map(describe)

    expect(anonymous).toEqual([])
  })
}

/** Having a name and being told apart are different properties, and for a row of
 *  identical boxes only the second one helps.
 *
 *  Base UI falls back to the field's own label on every box that has no `aria-label`,
 *  so deleting the position labels leaves six inputs all called "Verification code" —
 *  six names, one of them useless six times. The test above passes on that, which is
 *  exactly why this one exists. */
test("the boxes of an OTP field are told apart, not just named", () => {
  render(<Providers>{CASES["otp-field"]}</Providers>)

  const boxes = [...document.querySelectorAll('[data-slot="otp-field-input"]')]
  expect(boxes).toHaveLength(6)

  const names = boxes.map((b) => computeAccessibleName(b).trim())
  expect(new Set(names).size).toBe(names.length)
})
