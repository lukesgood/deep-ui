# Security

## Reporting

Open a [private security advisory](https://github.com/lukesgood/deep-ui/security/advisories/new).
Please do not open a public issue for anything exploitable.

There is no service behind this repository — it is source you copy into your own
project — so the realistic surface is small, and limited to what the components do
with content they are handed.

## What the components promise

Two of these are deliberate design decisions rather than incidental behaviour. Both
are covered by tests (`test/security.test.tsx`), and the first is also enforced by
`npm run check:tokens`, which fails on `dangerouslySetInnerHTML` anywhere in `src/`
or `templates/`. If you find a way around either, that is a security issue:

- **`lib/markdown.ts` never produces markup from its input.** The parser emits a
  closed set of node types and `components/ui/markdown.tsx` maps each to a React
  element. There is no `dangerouslySetInnerHTML` anywhere in `src/`, and no path from
  model or document text to HTML.
- **A URL in rendered text never becomes a link.** The renderer is built for prose of
  uncertain provenance — model output, or text derived from ingested documents — where
  a URL can be whatever someone put in a file. `citationHref` builds *same-page*
  anchors only.

## What they do not

The components render what you give them. They do not sanitise, escape or validate
application data beyond what React does by default, and `templates/` authenticates
nothing — the sign-in screen is a layout, not an implementation.
