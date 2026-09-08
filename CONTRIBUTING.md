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

Node **22.18 or newer**. The tests are `.ts` files run directly by `node --test`
using native type stripping; below that version they need a transpile step, and this
repo deliberately does not have one.

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

### Any colour change must survive the checker

```bash
npm run check:tokens                  # literal colours, raw z-index, one-off type sizes
npm run check:contrast                # summary
npm run check:contrast -- --verbose   # every pair, with its ratio
```

It reads the real values out of `src/styles/tokens.css` and measures 224 pairs across
both themes — every text token against all four surfaces and against its own 10%
tint, every foreground on the fill it sits on, and the solid status step, chart ramp
and focus ring at 3:1.

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

`src/lib/markdown.ts` is pure and has real tests. If you touch the parser, add a case
— especially for anything about what is *not* interpreted. Links are deliberately
never turned into anchors, and fence content is never parsed; both are security
properties, not style choices, and both should stay covered.

The React components have no tests yet. A PR that adds them is welcome; a PR that
changes a component is not blocked on it.

## Accessibility

`prefers-reduced-motion` is honoured globally in `tokens.css`, so you do not need to
guard individual animations — but do not fight it either.

The palette is measured. The components are not audited. Keyboard operability and
labelling are expected of anything new, but nobody has put this through a screen
reader, so please do not describe it as compliant. If you find a real a11y bug, that
is a very welcome issue.

## Commits and PRs

Explain **why** in the commit body, not just what — the diff already says what.
Small, focused PRs. If a change alters how something looks, say so plainly; visual
changes are the ones reviewers cannot infer from a diff.
