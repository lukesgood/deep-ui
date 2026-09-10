# Contributing

Thanks for looking. This is a small project with a specific shape, so a short read
here will save you a round trip.

## What this repo is

A **copy-in source template**, not a package. Nobody installs `deep-ui` from a
registry — they copy `src/` into their app and own it from then on. That has two
consequences worth holding onto:

- **There is no public API to keep stable, but there is a copy-paste contract.**
  Anyone who took a copy last month cannot `npm update`. Renaming a prop or a token
  is not a breaking change you can ship behind a semver major — it is a change they
  will have to find and apply by hand. Prefer additive changes.
- **The code is meant to be edited.** Clever indirection that saves you ten lines
  costs every reader who has to understand the file before changing it. Optimise for
  the person editing their own copy at 4pm on a Friday.

## Getting set up

```bash
npm install     # workspace install — covers the template and the demo
npm run demo    # the gallery, at http://localhost:5173
```

Node **20.19 or newer**. The template itself still has no build step — that is the
point of it — but the repo has a test toolchain, which never reaches anyone who copies
`src/`.

## Before you open a PR

```bash
npm run check
```

That runs everything CI runs: typecheck of the template and the demo, the parser tests,
the token linter, the palette contrast check, and a demo build. CI runs the same steps on
Node 22 and 24.

## The rules that are actually enforced

### Colours come from tokens

No `bg-slate-800`, no `text-green-500`, no hex literals in a component. Every colour
resolves through a token so both themes and anyone's re-theme keep working. Two of
the bugs in this repo's history were exactly this, and both were invisible in the
theme the author happened to be using.

If you need a colour the tokens do not have, add the token.

### Status colours have two steps, and they are not interchangeable

- `--dp-good` / `--dp-warn` / `--dp-bad` — the **solid** step: fills, borders, icons.
  Non-text content, so 3:1.
- `--dp-good-text` / `--dp-warn-text` / `--dp-bad-text` — the **text** step: words.
  4.5:1.

Painting a shape? Solid. Writing a word? `-text`. Getting this backwards is the most
likely way to fail the contrast check.

### Stacking order comes off the ladder

`z-[var(--dp-z-modal)]`, not `z-50`. The tokens are `--dp-z-raised`, `-sticky`,
`-backdrop`, `-modal`, `-popover`, `-tooltip`, `-toast`, in that order. Everything used to
sit at `z-50`, and the result was that what covered what depended on DOM order.

A raw `z-N` is allowed only inside a component's *own* stacking context — the scroll
buttons within a select popup, say. `scripts/check-tokens.mjs` holds those exceptions with
a reason each; if you add one, add the reason in the same place.

### Type sizes come off the scale

Tailwind's steps plus `text-2xs` (11px). If you need a size that is not there, add a step
to `@theme` rather than reaching for `text-[13px]`. The one exception the linter allows is
`em`-relative sizing — `text-[0.9em]` on inline code is measured against its parent, which
no fixed step can express.

### Words the component says are not the component's to hardcode

If a component needs to say something on its own — a label on an icon button, an
`aria-label`, a default title — add a key to `src/lib/strings.tsx` and read it with
`useString()`. Take an override prop too where a one-off caller would want one.

`aria-label` is the case that matters. A visible English label in a Korean app is
noticed immediately; an English `aria-label` is noticed only by the person using a
screen reader, who has no way to report a bug nobody else can see.

`check:tokens` fails on a literal `aria-label`, `title` or `placeholder` in `src/`.
`templates/` is exempt — a template's words are example copy, meant to be rewritten.

### The linter covers what the scripts cannot

```bash
npm run lint
```

Two plugins and no style rules. There is no formatter here and no opinion about quotes
or semicolons — a contributor should be arguing about behaviour, not about commas.

- **`jsx-a11y`** — accessibility mistakes visible in the source. A design system that
  measures its own contrast and then ships a `<div onClick>` is being careful in one
  place. Warnings fail the build (`--max-warnings 0`) so they cannot pile up.
- **`react-hooks`** — a stale closure is invisible in review and invisible to `tsc`,
  and shows up months later as "sometimes it scrolls to the wrong place".

Two `jsx-a11y` rules are off in `eslint.config.mjs`, with the reason written there:
`anchor-has-content` and `heading-has-content` cannot see children arriving through
`{...props}` in a wrapper or through Base UI's `render` prop, which are the two idioms
this codebase is built out of, so they only ever fire falsely here. Everything else is
on. If you need a disable comment, put the reason next to it — `conversation.tsx` has
the one example: a scrollable region has to be focusable or a keyboard user cannot
scroll it at all, which is not something the rule can see.

### Any colour change must survive the checker

```bash
npm run check:tokens                  # literal colours, raw z-index, one-off type sizes
npm run check:contrast                # summary
npm run check:contrast -- --verbose   # every pair, with its ratio
npm run check:selectors               # rules in tokens.css that point at nothing
```

It reads the real values out of `src/styles/tokens.css` and measures 464 pairs across
four palettes — every text token against all four surfaces and against its own 10%
tint, every foreground on the fill it sits on, and the solid status step, chart ramp
and focus ring at 3:1.

Four palettes, not two, because `@media (prefers-contrast: more)` is a palette. It is
merged onto the theme it overrides exactly the way the browser computes it, then
measured whole. Conditional palettes are the ones nobody looks at, so they are the
ones most worth checking. `@media print` is excluded from this deliberately: it is a
paper palette, and measuring it against screen rules would only produce noise.

`check:selectors` is the other half of the same problem. A rule that names a
`data-slot` no component emits never matches and never complains — that is how the
print block here shipped hiding a `[data-slot="toast"]` that did not exist. It checks
both directions: selectors with no markup, and `.dp-*` classes nothing uses. A class
meant for adopters rather than for us goes in the script's `OFFERED` list, with a
reason.

Two things it will not let you do quietly: it fails on any token it cannot parse
rather than skipping it, and the handful of genuinely excluded tokens are listed in
the script with a reason. If you add an exclusion, say why in the same place.

For the chart ramp specifically: categorical series are told apart by **hue**, not
lightness. Keep the five at least ~50 degrees apart. An earlier ramp had two teals
three degrees apart, which is one series as far as a reader is concerned.

### Components follow the `data-slot` convention

Every primitive is a plain function component that sets `data-slot="…"`, in the
shadcn *base-nova* style, built on Base UI. Not `React.forwardRef` — React 19 passes
`ref` as an ordinary prop. The convention is what makes `has-data-[slot=…]` selectors
work across the set, so a file that opts out silently breaks them.

### Nothing imports from a framework

No `next/link`, no `next/image`. The template has to run the same under Vite, React
Router, Remix or Next. If a component needs something app-specific, take it as a
prop — that is how `ErrorBox` got its `hint`.

## Testing

`npm test` runs Vitest over `test/`, in a happy-dom environment, through the same `@/*`
alias a consuming app uses — so a broken internal import fails here rather than in
someone else's project.

The suite is aimed at the failures this repo has actually had, not at a coverage number:

- **every overlay opens.** A `DropdownMenuLabel` outside a group throws, and a throw
  during render unmounts the whole page. That shipped, because wiring a menu and opening
  one are different acts. If you add an overlay, add the test that opens it.
- **the wiring nobody can see.** `Field` associating its label, hint and error with the
  control; `aria-invalid` on a failed field; `aria-current` on the active page; a
  progress bar that reports no number when it has none.
- **the rules with a reason.** The composer not sending mid-IME-composition; the reveal
  toggle not submitting the form it sits in.
- **keyboard and focus.** `test/keyboard.test.tsx`: Tab stays inside an open dialog,
  Escape puts focus back on the trigger, a toolbar is one tab stop with arrow keys
  inside it, a combobox moves its highlight without moving focus off the input. These
  behaviours come from Base UI, which means they can regress on a version bump without
  a line of this repo changing — and nothing else here would notice.

`src/lib/markdown.ts` is pure and covered separately. If you touch the parser, add a case
— especially for what is *not* interpreted. Links are never turned into anchors and fence
content is never parsed; both are security properties, not style choices.

### A test that cannot fail is worth nothing

Break the thing it covers and watch it go red before you commit. This is not a figure of
speech — three tests in this repo were green with the behaviour deleted. One asserted a
guard that had already been removed (the assertion ran a microtask too early); another
used a negative regex over the whole document body and passed with the element it was
looking for replaced by a literal string.

So it is a script rather than advice:

```bash
npm run verify:tests
```

It breaks one behaviour in `src/` at a time — a primitive swapped for a plain `<div>`, a
prop that turns off the focus trap, an `aria-*` value hardcoded — runs the single test
that names it, and expects a failure. `MISSED` means the test is not holding what its
name says. It edits files and puts them back, including on Ctrl-C, and refuses to start
if those files already have uncommitted changes.

When you add a test to `test/keyboard.test.tsx`, add its injection to
`scripts/verify-tests.mjs`. Choose a regression somebody could plausibly commit, not
damage for its own sake — the injection is a claim about how the behaviour would really
be lost. If an injection stops applying because the source moved, the script says
`STALE` rather than passing quietly.

## Accessibility

`prefers-reduced-motion` is honoured globally in `tokens.css`, so you do not need to
guard individual animations — but do not fight it either.

The palette is measured and the semantics are asserted; what a screen reader actually says
is neither. The README's Accessibility section lists four findings that are already
confirmed from the source — the tooltip is not announced at all — and what an audit would
still have to cover. If you are touching one of those components, that list is the brief.

The palette is measured. The components are not audited. Keyboard operability and
labelling are expected of anything new, but nobody has put this through a screen
reader, so please do not describe it as compliant. If you find a real a11y bug, that
is a very welcome issue.

## Commits and PRs

Explain **why** in the commit body, not just what — the diff already says what.
Small, focused PRs. If a change alters how something looks, say so plainly; visual
changes are the ones reviewers cannot infer from a diff.
