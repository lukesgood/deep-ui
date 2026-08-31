# DataPond Design System

The design system extracted from [DataPond](https://github.com/) — theme tokens plus 24
UI primitives — packaged as a **copy-in source template** you can drop into any React app.

There is no build step and nothing to `npm install` from a registry. You copy `src/` into
your project, install the peer dependencies, and own the code from then on. That is the
same model shadcn/ui uses, and it is deliberate: these components are meant to be edited.

**"Deep pond": layered depth, one aqua current.** Neutrals are slate hue-biased toward the
aqua accent rather than left at a default grey, elevation is carried by a two-stop shadow
plus a faint top hairline, and a single gradient does all the emphasis work.

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

The accent is aqua — `#0894ac` light, `#22c3d6` dark. `--radius` is `0.7rem`, and the
`--radius-sm…4xl` scale is derived from it, so changing that one value rescales everything.

### DataPond extras

These are **not** Tailwind theme colors — reach them with arbitrary-value syntax,
`text-[var(--dp-good)]` or `bg-[var(--dp-good)]/10`.

| Token | Purpose |
|---|---|
| `--dp-gradient` | the signature current — logo, active rails, key emphasis |
| `--dp-aqua` | the accent as a raw value |
| `--dp-good` / `--dp-warn` / `--dp-bad` | the status triad — healthy / degraded / failed |
| `--dp-managed` | provider-managed resources (vs. self-hosted) |
| `--dp-shadow` / `--dp-shadow-lg` | two-stop elevation |
| `--dp-hairline` | the faint top highlight on a raised surface |

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

## Differences from DataPond's own copy

This template is not a byte-for-byte snapshot. Three things were changed so it stands alone:

1. **`ErrorBox` was decoupled.** DataPond's version hardcoded an "no embedding or LLM model
   is configured" hint and a `next/link` to `/settings`. That is now an optional `hint`
   prop taking any node, which removed the template's only Next.js import.
2. **`--dp-bad` was added.** DataPond referenced `var(--dp-bad)` on its Services page but
   never defined it, so that icon rendered uncolored. Defined here in both themes.
3. **The font tokens were made non-cyclic.** The original declared
   `--font-sans: var(--font-sans)` inside `@theme inline`, which is self-referential and
   only worked by cascade accident. Source variables are now distinctly named
   (`--dp-font-*`) and carry real fallback stacks.

`tokens.css` also drops `@import "tailwindcss"` — your app owns that import.

---

## Verifying a change

`package.json` and `tsconfig.json` are here for type-checking only; nothing is built or
published.

```bash
npm install
npm run typecheck   # tsc --noEmit across all 29 files
```

---

## License

Inherits DataPond's license. The shadcn/ui primitives this derives from are MIT.
