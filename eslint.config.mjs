/** What the checkers in `scripts/` cannot see.
 *
 *  This repo already fails a build for a literal colour, a raw z-index, an English
 *  `aria-label`, an import that would not resolve in a copied tree, a contrast pair
 *  below AA and a stylesheet rule pointing at nothing. Those are all project-specific
 *  and they all live in `scripts/`.
 *
 *  ESLint is here for the two classes of bug those cannot reach:
 *
 *    - **`jsx-a11y`** — accessibility mistakes that are visible in the source. A design
 *      system that measures its own contrast and then ships a `<div onClick>` is not
 *      being careful, it is being careful in one place.
 *    - **`react-hooks`** — a stale closure in a hook is invisible in review, invisible
 *      in a type check, and shows up as "sometimes it scrolls to the wrong place".
 *
 *  It is deliberately not a style tool. There is no formatter and no opinion about
 *  quotes or semicolons here; a contributor should be arguing about behaviour, not
 *  about commas.
 */
import js from "@eslint/js"
import globals from "globals"
import jsxA11y from "eslint-plugin-jsx-a11y"
import reactHooks from "eslint-plugin-react-hooks"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      // Built by `npm run size` into a throwaway app; not ours to lint.
      "**/.size-*/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2024 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "jsx-a11y": jsxA11y, "react-hooks": reactHooks },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // React 19 + the new JSX transform: `React` is a namespace import used for its
      // types and hooks, not something the transform needs in scope.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Base UI's `render` prop takes an element that it clones props onto, so a
      // `render={<Button />}` genuinely has no children of its own here.
      "jsx-a11y/label-has-associated-control": "off",

      // These two ask "does this element have content", and in this codebase the
      // answer always arrives somewhere the rule cannot look: through `{...props}` in
      // a wrapper definition (`CardTitle`, `PaginationLink`), or through Base UI's
      // `render` prop, which clones children onto the element you hand it. Both are
      // house idioms, so the rules produce false positives and nothing else. Off with
      // a reason beats a disable comment on every anchor and heading in the repo —
      // the latter teaches contributors that the way past a lint error is to silence
      // it.
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/heading-has-content": "off",

      // Not in `recommended`, and one of the easier ways to make a control that a
      // sighted keyboard user can tab to and a screen-reader user cannot find.
      "jsx-a11y/no-aria-hidden-on-focusable": "error",
    },
  },

  {
    files: ["scripts/**/*.mjs", "*.config.mjs", "**/vite.config.ts", "**/vitest.config.ts"],
    languageOptions: { globals: { ...globals.node } },
  },

  {
    files: ["test/**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // A test may reach for a non-null assertion on something it has just asserted
      // the existence of; making it prove it twice is noise.
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  }
)
