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

**They authorise nothing either.** There is no permission model anywhere in this
repository: no roles, no policies, no notion of who is looking. `templates/data-table`
has an `owner` column with four team names in it, and `owner` is something you can
filter by — not a boundary. If you hand a component a row, it renders the row.

This is not a gap to be filled here. A design system cannot enforce access control,
because enforcement that happens in the browser is not enforcement; the server decides
what leaves it, and the only safe assumption is that anything reaching the client was
allowed to. What a design system can do is give you the means to *say* what the server
decided — `EmptyState` already takes the words, `Badge` already carries a status, a
control can be held back with a reason (see `components/ui/button.tsx`) — and those
are deliberately unopinionated, because every product's permission vocabulary differs.

One consequence worth stating, because it is a decision and not an accident: **"there
is nothing here" and "there is something here you cannot see" are different
sentences.** Which one you show is an information-disclosure choice — the second
confirms a record exists — and it belongs to your product, not to this template. The
templates say the first because they have nothing to hide.
