# DataPond Design System

The design system extracted from DataPond — theme tokens plus 24 UI primitives —
packaged as a **copy-in source template** you can drop into any React app.

MIT licensed. Copy it, edit it, ship it.

There is no build step and nothing to `npm install` from a registry. You copy `src/` into
your project, install the peer dependencies, and own the code from then on. That is the
same model shadcn/ui uses, and it is deliberate: these components are meant to be edited.

**"Deep pond": layered depth, one aqua current.** Neutrals are slate hue-biased toward the
aqua accent rather than left at a default grey, elevation is carried by a two-stop shadow
plus a faint top hairline, and a single gradient does all the emphasis work.

| Light | Dark |
|---|---|
| ![The gallery in the light theme](docs/gallery-light.jpg) | ![The gallery in the dark theme](docs/gallery-dark.jpg) |

Both are the same page — the theme is one class on `<html>`.

---

## See it

`examples/demo` is a small Vite app that renders every token and every primitive on one
page. It imports the template through the `@/*` alias pointed at `../../src`, so nothing
is copied: what the page shows is the source in this repo.

```bash
npm install     # workspace install, covers the template and the demo
npm run demo    # http://localhost:5173
```

---

## What's in here

```
src/
  styles/tokens.css       the whole theme: light/dark vars, @theme mapping, .dp-* utilities
  components/ui/*.tsx     24 primitives (shadcn "base-nova" style, built on @base-ui/react)
  lib/utils.ts            cn()
  lib/markdown.ts         the Markdown parser that components/ui/markdown.tsx renders
  lib/toast.tsx           ToastProvider + useToast()
  lib/confirm.tsx         ConfirmProvider + useConfirm()  (promise-based window.confirm)
  hooks/use-mobile.ts     useIsMobile()
examples/demo/            the gallery above — not part of what you copy
```

`src/` mirrors the directory layout the files expect to land in, so every internal import
(`@/components/ui/button`, `@/lib/utils`, `@/hooks/use-mobile`) resolves unchanged once
copied. Don't rearrange the folders unless you're prepared to rewrite those paths.

**No framework coupling.** Nothing here imports from Next.js. It runs the same under
Vite, React Router, Remix, or Next.

---

## Install

### 1. Dependencies

```bash
npm install @base-ui/react class-variance-authority clsx tailwind-merge \
            lucide-react tw-animate-css shadcn
npm install -D tailwindcss @tailwindcss/postcss
```

Requires **React 19** and **Tailwind CSS v4**. (`shadcn` is a runtime dependency here, not
just a CLI — `tokens.css` imports its stylesheet.)

### 2. Copy the source

```bash
cp -r datapond-ui/src/components/ui   your-app/components/
cp -r datapond-ui/src/lib/*           your-app/lib/
cp -r datapond-ui/src/hooks/*         your-app/hooks/
cp    datapond-ui/src/styles/tokens.css  your-app/app/
```

Adjust to taste — the only hard requirement is that your `@/*` alias points at whatever
root now contains `components/`, `lib/`, and `hooks/`.

### 3. Wire the alias

`tsconfig.json`:

```json
{ "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./*"] } } }
```

### 4. Import the tokens

In your entry stylesheet, **after** Tailwind:

```css
@import "tailwindcss";
@import "./tokens.css";
```

### 5. Mount the providers

`Tooltip`, `Toast`, and `Confirm` each need a provider above them:

```tsx
import { TooltipProvider } from "@/components/ui/tooltip"
import { ToastProvider } from "@/lib/toast"
import { ConfirmProvider } from "@/lib/confirm"

<ToastProvider>
  <ConfirmProvider>
    <TooltipProvider>{children}</TooltipProvider>
  </ConfirmProvider>
</ToastProvider>
```

### 6. Dark mode

Driven by a `.dark` class on an ancestor (`@custom-variant dark (&:is(.dark *))`). Toggle
`document.documentElement.classList.toggle("dark")` — the template ships no theme switcher.

---

## Tokens

### Standard shadcn tokens

`--background` `--foreground` `--card` `--popover` `--primary` `--secondary` `--muted`
`--accent` `--destructive` `--border` `--input` `--ring` `--radius`, the `--sidebar-*`
family, and `--chart-1` … `--chart-5`. Use them through Tailwind utilities as usual:
`bg-background`, `text-muted-foreground`, `border-border`.

The accent is aqua — `#066c7d` light, `#22c3d6` dark. `--radius` is `0.7rem`, and the
`--radius-sm…4xl` scale is derived from it, so changing that one value rescales everything.

The light accent is a deeper aqua than the chart ramp's `#0894ac`, and that is deliberate:
`--primary` carries white text on the filled button and is itself used as link text, so it
has to clear 4.5:1. A chart fill is non-text and only owes 3:1, so `--chart-1` keeps the
brighter value. See [Accessibility](#accessibility).

### DataPond extras

These are **not** Tailwind theme colors — reach them with arbitrary-value syntax,
`text-[var(--dp-good-text)]` or `bg-[var(--dp-good)]/10`.

| Token | Purpose |
|---|---|
| `--dp-gradient` | the signature current — logo, active rails, key emphasis |
| `--dp-aqua` | the accent as a raw value |
| `--dp-good` / `--dp-warn` / `--dp-bad` | the status triad, **solid step** — fills, borders, icons |
| `--dp-good-text` / `--dp-warn-text` / `--dp-bad-text` | the status triad, **text step** — words |
| `--dp-managed` | provider-managed resources (vs. self-hosted) |
| `--dp-shadow` / `--dp-shadow-lg` | two-stop elevation |
| `--dp-hairline` | the faint top highlight on a raised surface |

**Why the status colors come in two steps.** A dot, a border or an icon is non-text
content, so WCAG asks 3:1 of it and the vivid value is the right one. A sentence needs
4.5:1, and on a light ground no vivid amber or emerald gets there — so the `-text` step is
deliberately darker. Reach for the solid step when you are painting a shape and the `-text`
step when you are writing a word. In the dark theme the solid step already clears 4.5:1, so
the two are the same value and the distinction costs you nothing.

```tsx
<span className="size-2 rounded-full bg-[var(--dp-warn)]" />
<span className="text-[var(--dp-warn-text)]">Degraded</span>
```

### Utility classes

| Class | Effect |
|---|---|
| `.dp-gradient` | the gradient as a background |
| `.dp-gradient-text` | the gradient clipped to text |
| `.dp-surface` | elevation shadow + top hairline — already applied by `<Card>` |
| `.dp-elevated` | the heavier shadow, for modals and popovers |
| `.dp-num` | `font-variant-numeric: tabular-nums`, for figures in tables |

A `shake` keyframe is also defined, for invalid-input feedback:
`className={invalid ? "[animation:shake_0.5s_ease-in-out]" : ""}`.

### Fonts

Set `--dp-font-sans`, `--dp-font-mono`, or `--dp-font-heading` to override; each falls back
to a system stack, so the template looks right before you wire up any webfont.

```tsx
// Next.js example
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
<html className={inter.variable} style={{ "--dp-font-sans": "var(--font-inter)" }}>
```

---

## Components

`alert` · `alert-dialog` · `badge` · `breadcrumb` · `button` · `card` · `checkbox` ·
`collapsible` · `dialog` · `dropdown-menu` · `error-box` · `input` · `label` · `markdown` ·
`select` · `separator` · `sheet` · `sidebar` · `skeleton` · `switch` · `table` · `tabs` ·
`textarea` · `tooltip`

Two are worth calling out:

- **`sidebar.tsx`** (723 lines) is the largest piece — a full collapsible app shell with
  rail, mobile sheet fallback, keyboard shortcut, and cookie-persisted state. It depends on
  `button`, `input`, `separator`, `sheet`, `skeleton`, `tooltip`, and `useIsMobile`.
- **`markdown.tsx`** renders the Markdown subset an LLM actually emits. Parsing lives in
  `lib/markdown.ts` so it can be tested alone, and it never interprets HTML — the parser
  emits a closed set of node types, so there is no path from model output to markup.

`error-box.tsx` provides `<ErrorBox>` and `<EmptyState>`, the two surfaces that otherwise
get reinvented ad hoc on every page.

---

## Accessibility

**What the palette guarantees.** Every foreground/background pair the tokens can produce
was measured, in both themes, against all four surfaces (`--card`, `--background`,
`--muted`, `--sidebar`) and against each colour's own 10% tint — the combination a tinted
button or an inline error actually renders:

- text tokens clear **4.5:1** (WCAG 2.1 AA, normal text)
- the solid status step and the focus ring clear **3:1** (AA non-text)

That is 158 pairs, and they all pass. Several light-theme values are darker than a stock
shadcn palette for exactly this reason.

**What it does not guarantee.** Two things are known gaps, both inherited from shadcn's
defaults, and both left alone because closing them changes the look rather than a value:

- `--border` and `--input` sit near 1.3:1 against their surfaces. Where a field's only
  boundary is that border, WCAG 1.4.11 wants 3:1, which in practice means a much heavier
  edge than the soft look the system is going for. If you need to meet 1.4.11 strictly,
  darken `--input`.
- The components are keyboard-operable and labelled, and toasts announce (errors as
  `role="alert"`, the rest as `role="status"`), but **none of this has been through a
  screen-reader audit.** Treat the components as a good starting point, not a compliance
  claim.

The measurements live in the git history of this section, not in a test — if you retune a
colour, re-measure it.

---

## Differences from DataPond's own copy

This template is not a byte-for-byte snapshot. It stands alone, and a few things were
fixed on the way out:

1. **`ErrorBox` was decoupled.** DataPond's version hardcoded an "no embedding or LLM model
   is configured" hint and a `next/link` to `/settings`. That is now an optional `hint`
   prop taking any node, which removed the template's only Next.js import. It also now
   renders in `--dp-bad` rather than `--dp-warn` — it is an error box, and it was amber.
2. **`--dp-bad` was added.** DataPond referenced `var(--dp-bad)` on its Services page but
   never defined it, so that icon rendered uncolored. Defined here in both themes.
3. **The font tokens were made non-cyclic.** The original declared
   `--font-sans: var(--font-sans)` inside `@theme inline`, which is self-referential and
   only worked by cascade accident. Source variables are now distinctly named
   (`--dp-font-*`) and carry real fallback stacks.
4. **The light palette was retuned for AA**, and the status colours split into a solid and
   a text step. See [Accessibility](#accessibility).
5. **`Skeleton` was tokenized.** It was filled with a hardcoded `bg-slate-800/50`, which is
   invisible-to-wrong in the light theme. It now uses `bg-foreground/10`, which reads
   against any surface in either theme.
6. **`Toast` was tokenized and given a11y.** It painted itself with `green-500` /
   `red-500` / `blue-500` while the status tokens sat unused, announced nothing, had an
   unlabelled close button, and leaked its timers on unmount.
7. **`Card` was moved onto the `data-slot` convention.** It was the one file still on the
   older `React.forwardRef` shadcn generation, which meant `has-data-[slot=…]` selectors
   silently missed it.

`tokens.css` also drops `@import "tailwindcss"` — your app owns that import.

---

## Verifying a change

The root `package.json` and `tsconfig.json` are here for type-checking only; the template
itself is never built or published. The demo is a real Vite app and does build.

```bash
npm install
npm run typecheck    # tsc --noEmit across the template's 29 files
npm run demo:build   # builds examples/demo — catches anything typecheck can't
```

There is no test suite yet, and no CI. Both are worth adding before this gets much use.

---

## Credits

The primitives here started as [shadcn/ui](https://ui.shadcn.com) output in its
`base-nova` style and were modified — retokenized, and in a few cases rewritten. Credit
for the component structure belongs upstream; the bugs are ours.

| | |
|---|---|
| [shadcn/ui](https://github.com/shadcn-ui/ui) | MIT — the component structure these derive from |
| [Base UI](https://base-ui.com) | MIT — the unstyled primitives every component is built on |
| [Lucide](https://lucide.dev) | ISC — icons (itself a fork of [Feather](https://feathericons.com), MIT) |
| [class-variance-authority](https://cva.style) | Apache-2.0 — the variant API |
| [Tailwind CSS](https://tailwindcss.com) | MIT — required, v4 |
| [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | MIT — the enter/exit animations |

Those are npm dependencies you install yourself, not code vendored into `src/`, so their
licenses attach to your `node_modules` rather than to this template.

---

## License

[MIT](./LICENSE) — Copyright (c) 2026 Luke.

You are copying source into your own project, so the practical reading is: keep the
copyright notice somewhere (a `NOTICES` file, a header, your third-party page), and
otherwise do what you like. No attribution in your UI is required.

**Trademarks are not covered.** MIT grants rights to the code, not to names or marks.
The "DataPond" name and any DataPond logo are excluded from the license. Keep the
`--dp-*` tokens and `.dp-*` classes if you find them convenient — they are just
identifiers — but don't present a fork as DataPond.
