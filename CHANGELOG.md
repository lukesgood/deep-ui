# Changelog

Notable changes to Deep. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Because this is a copy-in template rather than a published package, **the changelog is
the only upgrade path**. Nobody can `npm update` a copy they took last month — they
read this file and apply what matters to them. So entries here say what to change in
your own copy, not just what moved in this repo.

Nothing has been tagged or released yet; everything below is on `main`.

## [Unreleased]

### Added

- **`templates/profile.tsx`** — the account screen the set had no version of: identity
  with a gradient initials avatar, a passkey list with per-device dates, active sessions
  with the current one named, and account deletion. Every destructive action goes through
  `useConfirm()`.
- **A user menu in the app shell.** `assistant-shell` had no sidebar footer at all;
  it now carries the avatar/name/email row and menu that every app shell has.
- **`sign-in` gained passkey and sign-in-link routes**, and was rebuilt to look like
  the rest of the system: the gradient runs under the card as a wash rather than
  appearing only on a 40px logo tile, the heading uses `.dp-gradient-text`, and the card
  sits on `.dp-elevated`. Five steps in one card, each of which moves focus to its own
  heading.
- **`templates/`** — three whole screens, copy-in like `src/`: `sign-in`,
  `settings`, `assistant-shell`. The gallery serves them at `#/t/<id>`.
  **In your copy:** additive, and optional — nothing in `src/` depends on them.
- **Component tests** (`npm test`, now Vitest + happy-dom): every overlay opens, `Field`
  associates label/hint/error, the composer respects IME composition, the reveal toggle
  cannot submit its form, pagination announces the current page. 48 tests total.
- **The gallery is deployed** to <https://lukesgood.github.io/deep-ui/> on every push to
  `main`.
- **Fifteen more primitives**, taking the set to 49: `slider`, `number-field`,
  `checkbox-group`, `otp-field`, `password-input`, `combobox`, `toggle`, `toggle-group`,
  `toolbar`, `meter`, `context-menu`, `preview-card`, `navigation-menu`, `menubar`,
  `pagination`. All but `pagination` wrap Base UI; `pagination` has no counterpart there
  because there is no behaviour to abstract, only semantics to get right.
  **In your copy:** additive.
- **An assistant panel's missing half.** `markdown.tsx` rendered model output and
  marked citations, but nothing held a conversation, took a prompt, or showed the
  sources a `[n]` pointed at. Now `conversation` (`Conversation`,
  `ConversationMessage`, `ConversationActions`, `ConversationPending`), `composer`
  (`Composer`, `ComposerInput`, `ComposerSubmit`) and `citations` (`Citations`,
  `Citation`), plus `hooks/use-stick-to-bottom.ts`. There is no panel shell — dock it
  with `Sidebar side="right"` or float it with `Sheet`.
  **In your copy:** additive.
- Tests moved from `node --test` to Vitest, so `.tsx` components can be tested at all —
  Node's native type stripping does not transform JSX. The supported Node range widened
  to 20.19+ as a result. **In your copy:** nothing; test tooling never leaves this repo.
- `Markdown` takes an optional `citationHref`. Omit it and `[n]` renders exactly as
  before; give it one and the marker becomes a same-page anchor.
  **In your copy:** no change unless you want the links.
- **Seven primitives**, taking the set from 24 to 31. All wrap Base UI rather than
  hand-rolling behaviour:
  - **`field`** — `Field`, `FieldLabel`, `FieldControl`, `FieldDescription`, `FieldError`,
    `Fieldset`, `FieldsetLegend`, `Form`. The biggest hole in the set: there was no way to
    associate a label, a hint and an error with a control, so every screen did it by hand.
  - **`popover`**, **`radio-group`**, **`avatar`**, **`progress`**, **`scroll-area`**,
    **`accordion`**.
  **In your copy:** additive — nothing existing changed. Copy the files you want.
- **A stacking ladder**: `--dp-z-raised` (10), `-sticky` (30), `-backdrop` (40), `-modal`
  (50), `-popover` (60), `-tooltip` (70), `-toast` (80).
  **In your copy:** if you wrote your own overlay at `z-50`, it now ties with dialogs.
  Put it on a rung.
- **`prefers-reduced-motion` support**, as a blanket rule in `tokens.css`. The motion
  comes from three places at once — Tailwind transitions, `tw-animate-css` enter/exit
  animations, and the `shake` keyframe — and none of them route through a variable that
  could simply be zeroed.
  **In your copy:** picked up with `tokens.css`; drop any per-component guard you added.
- **`text-2xs`** (11px), one step below Tailwind's floor, for dense UI.
- `scripts/check-tokens.mjs` (`npm run check:tokens`) — fails on literal palette colours,
  hex literals, raw z-index and one-off type sizes in `src/`, with a documented exception
  list.
- `--dp-good-text`, `--dp-warn-text`, `--dp-bad-text` — a second step for the status
  triad, for text. The existing `--dp-*` tokens keep their meaning as the solid step
  for fills, borders and icons.
  **In your copy:** anywhere you wrote status colour on *words*, switch to the
  `-text` token. `text-[var(--dp-warn)]` → `text-[var(--dp-warn-text)]`.
- `scripts/check-contrast.mjs` (`npm run check:contrast`) — measures 224
  foreground/background pairs across both themes, straight out of `tokens.css`.
- Tests for the Markdown parser (`npm test`), run by `node --test` with no transpile
  step. Requires Node 22.18+.
- GitHub Actions CI: typecheck, tests, contrast, demo build, on Node 22 and 24.
- `examples/demo` — a Vite gallery rendering every token and primitive, importing
  `../../src` directly so it cannot drift from the source.
- `LICENSE` (MIT), `CONTRIBUTING.md`, and a Credits section naming shadcn/ui, Base UI,
  Lucide, cva, Tailwind and tw-animate-css.

### Changed

- **Renamed from DataPond to Deep.** `--dp-*` and `.dp-*` are unchanged — `dp` is now
  short for *deep*. **In your copy:** nothing to do.
- **The light palette was retuned for WCAG AA**, holding hue and saturation and moving
  only lightness. **In your copy:** these are token values, so a copy of `tokens.css`
  picks them up wholesale.
  - `--primary` `#0894ac` → `#066c7d` (white label on the filled button was 3.59:1)
  - `--destructive` `#e11d48` → `#bd183c` (text on the tinted button was 4.00:1)
  - `--dp-warn` `#e08a00` → `#c17700`, `--dp-good` `#0f9d6c` → `#0f9b6b` (icons
    below 3:1)
  - `--dp-managed` `#0e7490` → `#0d6b85`
  - `--dp-aqua`, `--ring`, `--sidebar-primary`, `--sidebar-ring` follow `--primary`
- **The chart ramp was respaced by hue** in both themes. The old ramp had two teals
  three degrees apart — one series, as far as a reader is concerned — and two of the
  five fell below 3:1 in the light theme. The five are now at least 53 degrees apart
  and all clear 3:1.
  **In your copy:** if you hardcoded a series colour anywhere instead of reading
  `--chart-n`, re-check it.
- `Card` moved from `React.forwardRef` to the `data-slot` convention the other 23
  primitives use. Its markup and classes are unchanged.
  **In your copy:** drop-in, unless you were passing `ref` in a way that depended on
  `forwardRef` specifically.
- `Toast` now paints from tokens, announces (`role="alert"` for errors, `role="status"`
  otherwise), labels its close button, and clears its timers on unmount.
- Every overlay moved off `z-50` onto the ladder: dialog, alert dialog and sheet split
  into backdrop and modal rungs; dropdown and select onto popover, so a menu opened inside
  a dialog clears it; tooltip and toast above both.
- The five one-off type sizes (`text-[10px]`, `[11px]`, `[13px]`, `[0.8rem]`) collapsed
  onto `text-2xs` / `text-xs`. `text-[0.9em]` on inline code stays — it is sized against
  its parent.
- The Markdown parser's doc comment was rewritten — it carried internal product
  narrative that meant nothing outside the original codebase.

### Fixed

- **Four accessibility defects that did not need an audit to find.**
  - `Tooltip` content is now announced: the popup carries `role="tooltip"` and an id,
    and the trigger points at it with `aria-describedby` while open. Previously the
    text reached nobody using a screen reader.
  - `Markdown` renders `#` as a real heading (`<h3>`–`<h6>`, from the new
    `baseHeadingLevel`, default 3) instead of a styled `<p>`, so a long answer can be
    navigated by structure. Visuals are unchanged.
  - `Skeleton` is `aria-hidden` — a row of grey rectangles is a picture of loading,
    not information.
  - `TableHead` defaults to `scope="col"`.
  **In your copy:** re-copy those four files. `Markdown` gains an optional prop and
  changes the element it renders for headings; nothing else moves.
- **A menu label without a group no longer takes the page down.** `DropdownMenuLabel`
  and `ContextMenuLabel` are Base UI group labels, which throw outside a group — and a
  throw during render unmounts the whole React tree. They now supply their own group
  when they have none, so the mistake is not available to make. Previously this was
  only documented in a comment.
  **In your copy:** re-copy `dropdown-menu.tsx` and `context-menu.tsx`; existing
  `<DropdownMenuGroup>` wrapping stays correct and does not nest.
- **`--input` now clears 3:1** (light `#d3e0e3` → `#628f9a`, dark alpha `0.13` → `0.335`),
  and the contrast checker asserts it rather than excusing it. A field's border is what
  identifies the field, which is what WCAG 1.4.11 is about. `--border` is unchanged: it
  draws structure, not controls.
  **In your copy:** token values, so re-copying `tokens.css` is the whole change.
- The demo's Tailwind scan covered `src/` but not `templates/`, so a class used only
  in a template was tree-shaken: the sign-in card rendered with no padding at all.
  Both trees are scanned now, and `check-tokens` lints both too.

- **`DropdownMenuLabel` crashed the whole app when used without a `DropdownMenuGroup`.**
  It is Base UI's `Menu.GroupLabel`, which throws outside a group — and a throw during
  render unmounts the entire React tree, not just the menu. Present since the original
  extraction; found by opening every menu in the gallery rather than trusting that it
  rendered.
  **In your copy:** wrap the label and its items in `<DropdownMenuGroup>`. Both
  components now say so in a comment.
- `Collapsible` was a bare re-export with no `data-slot`, the last file outside the
  convention, so `has-data-[slot=…]` selectors missed it. Its panel now animates its
  height like `Accordion` does.
- `Skeleton` was filled with a hardcoded `bg-slate-800/50`, which rendered as a dark
  block in the light theme. Now `bg-foreground/10`, which reads on any surface in
  either theme.
- `ErrorBox` rendered in `--dp-warn` (amber). It is an error box; it now uses
  `--dp-bad` with `--dp-bad-text`.
- `Toast` leaked its `setTimeout` timers when the provider unmounted, and generated
  ids with `Math.random().toString(36).substring(7)`, which can collide.
- `tokens.css` documented its own import path as `./datapond/tokens.css` while the
  README said `./tokens.css`.
- `scripts/check-contrast.mjs` read only the first `:root` block, so a stylesheet that
  opens `:root` twice would have been measured against the wrong half.

## [1.0.0] — 2026-08-31

Initial extraction from [DataPond](https://github.com/lukesgood/datapond): theme
tokens plus 24 primitives, as a standalone copy-in template.
