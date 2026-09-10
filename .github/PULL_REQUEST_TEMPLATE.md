<!-- CONTRIBUTING.md has the rules that are actually enforced. The short version: -->

**What this changes, and why.** The diff says what; the description should say why.

- [ ] `npm run check` passes — typecheck, tests, token linter, contrast, docs, demo build
- [ ] Colours come from tokens; stacking from `--dp-z-*`; type from the scale
- [ ] If it changes how something *looks*, that is said above — a reviewer cannot
      infer a visual change from a diff
- [ ] If it adds a component, it has a case in `test/smoke.test.tsx`
- [ ] If it changes a token, `npm run check:contrast` still passes
- [ ] If it adds a test, the thing it covers was broken once to watch it go red
