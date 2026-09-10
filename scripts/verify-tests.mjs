/** Does each test actually fail when the thing it covers is broken?
 *
 *  A test that keeps passing after you delete the behaviour is worse than no test,
 *  because it is also a claim. Three of them were found in this repo by hand: one
 *  asserted a guard that had already been removed, another used a negative regex over
 *  the whole document body and passed with the element it was looking for replaced by
 *  a literal string. Both had been green for weeks.
 *
 *  So the discipline is written down as a tool rather than as advice. Each entry below
 *  breaks exactly one behaviour in the source, runs the one test that covers it, and
 *  expects that test to fail. A `MISSED` line means the test is not holding what its
 *  name says it holds.
 *
 *  The injections are chosen to be regressions somebody could plausibly commit —
 *  a primitive swapped for a plain `<div>`, a prop that turns off the focus trap,
 *  an `aria-*` value hardcoded — not damage for its own sake.
 *
 *      npm run verify:tests
 *
 *  It edits files in `src/` and puts them back, including on Ctrl-C. It refuses to
 *  start if those files already have uncommitted changes, so an interrupted run is
 *  always recoverable with `git checkout src/`.
 */
import { execFileSync, execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const CASES = [
  {
    test: "an open dialog keeps Tab inside it",
    file: "src/components/ui/dialog.tsx",
    breaks: "the modal focus trap",
    from: '<DialogPrimitive.Root data-slot="dialog" {...props} />',
    to: '<DialogPrimitive.Root data-slot="dialog" modal={false} {...props} />',
  },
  {
    test: "Escape closes a dialog and gives focus back",
    file: "src/components/ui/dialog.tsx",
    breaks: "returning focus to the trigger on close",
    from: '      <DialogPrimitive.Popup\n        data-slot="dialog-content"',
    to: '      <DialogPrimitive.Popup\n        finalFocus={() => false}\n        data-slot="dialog-content"',
  },
  {
    test: "cancelling an alert dialog gives focus back",
    file: "src/components/ui/alert-dialog.tsx",
    breaks: "returning focus to the trigger on cancel",
    from: "      <DialogPrimitive.Popup\n",
    to: "      <DialogPrimitive.Popup\n        finalFocus={() => false}\n",
  },
  {
    test: "a sheet returns focus to its trigger",
    file: "src/components/ui/sheet.tsx",
    breaks: "returning focus to the trigger on close",
    from: "      <SheetPrimitive.Popup\n",
    to: "      <SheetPrimitive.Popup\n        finalFocus={() => false}\n",
  },
  {
    test: "a combobox moves its highlight",
    file: "src/components/ui/combobox.tsx",
    breaks: "naming the highlighted option through aria-activedescendant",
    from: '        data-slot="combobox-input"\n',
    to: '        data-slot="combobox-input"\n        aria-activedescendant={undefined}\n',
  },
  {
    test: "an accordion trigger reports expanded",
    file: "src/components/ui/accordion.tsx",
    breaks: "reporting the expanded state",
    from: "        {...props}\n      >\n        {children}",
    to: '        {...props}\n        aria-expanded="false"\n      >\n        {children}',
  },
  {
    test: "a collapsible trigger reports expanded",
    file: "src/components/ui/collapsible.tsx",
    breaks: "reporting the expanded state",
    from: '<CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />',
    to: '<CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} aria-expanded="false" />',
  },
  {
    test: "a toggle reports pressed, not checked",
    file: "src/components/ui/toggle.tsx",
    breaks: "reporting the pressed state",
    from: "      className={cn(toggleVariants({ variant, size, className }))}\n      {...props}\n    />",
    to: '      className={cn(toggleVariants({ variant, size, className }))}\n      {...props}\n      aria-pressed="false"\n    />',
  },
  {
    test: "a toggle group is one tab stop",
    file: "src/components/ui/toggle-group.tsx",
    breaks: "roving focus — the group becomes a plain div and the arrow keys do nothing",
    from: '<ToggleGroupPrimitive\n      data-slot="toggle-group"',
    to: '<div\n      data-slot="toggle-group"',
  },
  {
    test: "arrow keys move between tabs",
    file: "src/components/ui/tabs.tsx",
    breaks: "reporting which tab is selected",
    from: "    <TabsPrimitive.Tab\n",
    to: '    <TabsPrimitive.Tab\n      aria-selected="false"\n',
  },
  {
    test: "a field error is announced through the control",
    file: "src/components/ui/field.tsx",
    breaks: "the description registering itself — it stays visible, and stops being announced",
    from: "<FieldPrimitive.Description\n",
    to: "<p\n",
  },
  {
    test: "a password toggle says whether the password is showing",
    file: "src/components/ui/password-input.tsx",
    breaks: "the toggle's name changing with its state",
    from: 'aria-label={revealed ? strings["passwordInput.hide"] : strings["passwordInput.show"]}',
    to: 'aria-label={strings["passwordInput.show"]}',
  },
]

const SUITE = "test/keyboard.test.tsx"

/* ── refuse to start on top of uncommitted work ───────────────────────────── */

const touched = [...new Set(CASES.map((c) => c.file))]
const dirty = execSync(`git status --porcelain -- ${touched.join(" ")}`, { encoding: "utf8" }).trim()
if (dirty) {
  console.error(
    "This edits files in src/ and puts them back, so it will not run on top of\n" +
      "uncommitted changes to them — an interrupted run would take your work with it.\n\n" +
      dirty
  )
  process.exit(1)
}

/* ── run ──────────────────────────────────────────────────────────────────── */

const originals = new Map(touched.map((f) => [f, readFileSync(f, "utf8")]))
const restore = () => originals.forEach((text, file) => writeFileSync(file, text))
for (const signal of ["SIGINT", "SIGTERM", "uncaughtException"]) {
  process.on(signal, (err) => {
    restore()
    if (err) console.error(err)
    process.exit(1)
  })
}

let missed = 0
for (const c of CASES) {
  const original = originals.get(c.file)
  if (!original.includes(c.from)) {
    console.log(`  STALE   ${c.test}`)
    console.log(`          the injection site has moved in ${c.file}; fix this entry`)
    missed++
    continue
  }

  writeFileSync(c.file, original.replace(c.from, c.to))
  let caught = false
  try {
    execFileSync("npx", ["vitest", "run", SUITE, "-t", c.test], { stdio: "pipe" })
  } catch {
    caught = true
  }
  writeFileSync(c.file, original)

  console.log(`  ${caught ? "caught " : "MISSED "} ${c.test}`)
  console.log(`          broke: ${c.breaks}`)
  if (!caught) missed++
}

restore()
console.log()
if (missed) {
  console.error(
    `${missed} of ${CASES.length} injections went unnoticed. ` +
      `A test that passes with the behaviour removed is a claim, not a test.`
  )
  process.exit(1)
}
console.log(`${CASES.length} injections, every one caught by the test that names it.`)
