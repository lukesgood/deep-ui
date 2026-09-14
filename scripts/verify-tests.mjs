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
import { createRequire } from "node:module"
import { dirname, join } from "node:path"

/** Vitest is a devDependency here, not a global — resolve its own CLI entry from
 *  its package.json rather than shelling out to `npx`. `execFileSync("npx", …)`
 *  has no shell behind it, and on Windows `npx` only exists as `npx.cmd`, which
 *  CreateProcess cannot resolve without one — it fails with ENOENT before a
 *  single test runs, and every case below gets falsely marked `caught` because
 *  that throw lands in the same catch block a real test failure would. */
function vitestBin() {
  const require = createRequire(import.meta.url)
  const pkgPath = require.resolve("vitest/package.json")
  return join(dirname(pkgPath), require(pkgPath).bin.vitest)
}

/** There is no `.gitattributes` pinning line endings, so a Windows checkout with
 *  the common `core.autocrlf=true` setting has `\r\n` in `src/` where these
 *  injection strings — written with a plain `\n` — expect it. Matched literally,
 *  that turns a correct entry into a false `STALE`: a real injection site reads
 *  as moved when it has only been re-lined. Match the file's own ending instead of
 *  assuming LF; on a POSIX checkout, already LF, this is a no-op. */
function forFile(text, str) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n"
  return str.replace(/\n/g, eol)
}

/** `suite` defaults to the keyboard tests; naming injections point at their own file. */
const KEYBOARD = "test/keyboard.test.tsx"
const NAMING = "test/accessible-name.test.tsx"
const TABLE = "test/data-table.test.tsx"

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

  /* ── names on the controls the system renders itself ──────────────────────── */

  {
    suite: NAMING,
    test: "the boxes of an OTP field are told apart",
    file: "src/components/ui/otp-field.tsx",
    breaks: "the per-box position label — six boxes all called \"Verification code\"",
    from: "      aria-label={\n        index === 0 ? ariaLabel : ariaLabel ?? format(digit, { position: index + 1, length })\n      }\n",
    to: "",
  },
  // Not injectable here: Base UI supplies its own English "Decrease"/"Increase" when
  // ours is absent, so deleting the label leaves the button named and the naming test
  // rightly green. What our label actually buys is translation, not a name — and that
  // is check:tokens' job, not this one's.
  {
    suite: NAMING,
    test: "sidebar names every control it renders",
    file: "src/components/ui/sidebar.tsx",
    breaks: "the sidebar trigger's name — an icon button with nothing else in it",
    from: '      <span className="sr-only">{toggleLabel}</span>\n',
    to: "",
  },
  {
    suite: NAMING,
    test: "composer names every control it renders",
    file: "src/components/ui/composer.tsx",
    breaks: "the send button's name, which changes with its state",
    from: '      aria-label={busy ? strings["composer.stop"] : strings["composer.send"]}\n',
    to: "",
  },

  // The other half of that change — dimming hung off `data-disabled` so it covers the
  // aria-disabled case — is not injectable here. Tailwind's stylesheet is not loaded
  // under happy-dom, so no test in this repo can see which pseudo-class an opacity
  // came from. That one was checked in a browser instead, the way the print styles
  // were. Claiming the test covers it is the exact thing this script exists to stop.
  {
    suite: "test/templates.test.tsx",
    test: "the sign-in link step names the address it went to",
    file: "templates/sign-in.tsx",
    breaks: "reachability of the resend button while it counts down",
    from: "        focusableWhenDisabled\n",
    to: "",
  },

  /* ── the table template's details, which are the ones a screenshot cannot show ── */

  {
    suite: TABLE,
    test: "a sortable column is sorted by a button",
    file: "templates/data-table.tsx",
    breaks: "aria-sort — the column stops saying which way it is sorted",
    from: "    <TableHead aria-sort={active ? sort.direction : undefined} className={className}>",
    to: "    <TableHead className={className}>",
  },
  {
    suite: TABLE,
    test: "the filter says how many rows are left",
    file: "templates/data-table.tsx",
    breaks: "the live region — the table rewrites itself and nothing says so",
    from: '      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">',
    to: '      <p className="text-xs text-muted-foreground">',
  },
  {
    suite: TABLE,
    test: "each row's action button names its row",
    file: "templates/data-table.tsx",
    breaks: "the row name in the menu button's label — every row's menu becomes \"Actions\"",
    from: "                        aria-label={`Actions for ${d.name}`}",
    to: '                        aria-label="Actions"',
  },
  {
    suite: TABLE,
    test: "pages are buttons",
    file: "templates/data-table.tsx",
    breaks: "the render prop on the page numbers — they fall back to anchors going nowhere",
    from: "                      render={<button type=\"button\" />}\n                      isActive={n === current}",
    to: "                      isActive={n === current}",
  },
  {
    suite: TABLE,
    test: "the row's own name is a header for the row",
    file: "templates/data-table.tsx",
    breaks: "scope=\"row\" — the name cell defaults back to being a column header",
    from: '                  <TableHead scope="row" className="font-mono font-normal">',
    to: '                  <TableHead className="font-mono font-normal">',
  },
  {
    suite: TABLE,
    test: "filtering goes back to page one",
    file: "templates/data-table.tsx",
    breaks: "the page reset, so a filter can land you past the end of its own results",
    from: "            onChange={(e) => refine(setQuery)(e.target.value)}",
    to: "            onChange={(e) => setQuery(e.target.value)}",
  },
]

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
  const from = forFile(original, c.from)
  const to = forFile(original, c.to)
  if (!original.includes(from)) {
    console.log(`  STALE   ${c.test}`)
    console.log(`          the injection site has moved in ${c.file}; fix this entry`)
    missed++
    continue
  }

  writeFileSync(c.file, original.replace(from, to))
  let caught = false
  try {
    execFileSync(process.execPath, [vitestBin(), "run", c.suite ?? KEYBOARD, "-t", c.test], {
      stdio: "pipe",
    })
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
