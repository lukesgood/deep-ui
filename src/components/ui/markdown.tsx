"use client"

import { parseBlocks, type Inline } from "@/lib/markdown"

/** Renders the Markdown subset a model actually emits.
 *
 *  Parsing lives in lib/markdown.ts so it can be exercised on its own; this file is
 *  only the mapping to elements. Nothing here interprets HTML — the parser produces
 *  a closed set of node types and each is rendered as a React element, so there is no
 *  path from model output to markup.
 */
export function Markdown({
  text,
  citations = false,
  citationHref,
  baseHeadingLevel = 3,
  className = "",
}: {
  text: string
  citations?: boolean
  /** The heading level `#` maps to. A model's `#` is not the page's `<h1>` — it is a
   *  heading inside whatever section is already rendering the answer — so it starts at
   *  `<h3>` by default and each further `#` goes one deeper, clamped at `<h6>`. Raise
   *  or lower it to sit correctly under your own document outline. */
  baseHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /** Turns each `[n]` marker into a link to the matching source. Given a function
   *  rather than a boolean so the target is the caller's to decide — `<Citations>`
   *  renders ids of the form `citation-1`, so `(n) => "#citation-" + n` pairs them.
   *  Omit it and the marker stays inert text, as before. */
  citationHref?: (index: string) => string
  className?: string
}) {
  const blocks = parseBlocks(text, citations)
  // `dir="auto"` per block rather than once on the wrapper: this renders text nobody
  // here wrote — model output, or prose pulled from a document — and a single answer
  // can hold an English paragraph and an Arabic one. Direction is a property of each
  // block, and the browser infers it from the first strong character.
  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((b, i) => {
        if (b.t === "pre") return (
          <pre key={i} dir="auto" className="overflow-x-auto rounded-md border bg-muted/50 p-2 font-mono text-2xs leading-relaxed">
            {b.v}
          </pre>
        )
        if (b.t === "h") {
          // Real heading elements, so a long answer can be navigated by structure
          // instead of read start to finish. The visual size stays independent of the
          // level — inside a chat bubble an <h3> should not look like a page heading.
          const size = b.level <= 2 ? "text-sm" : "text-xs"
          const level = Math.min(baseHeadingLevel + b.level - 1, 6)
          const Heading = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
          return (
            <Heading key={i} dir="auto" className={`${size} font-semibold`}>
              <Spans spans={b.spans} citationHref={citationHref} />
            </Heading>
          )
        }
        if (b.t === "ul") return (
          <ul key={i} dir="auto" className="list-disc space-y-0.5 pl-4">
            {b.items.map((it, j) => <li key={j}><Spans spans={it} citationHref={citationHref} /></li>)}
          </ul>
        )
        if (b.t === "ol") return (
          <ol key={i} dir="auto" className="list-decimal space-y-0.5 pl-4">
            {b.items.map((it, j) => <li key={j}><Spans spans={it} citationHref={citationHref} /></li>)}
          </ol>
        )
        return <p key={i} dir="auto" className="whitespace-pre-wrap"><Spans spans={b.spans} citationHref={citationHref} /></p>
      })}
    </div>
  )
}

/** Inline spans only — for somewhere a block wrapper would be wrong. */
export function Spans({ spans, citationHref }: {
  spans: Inline[]
  citationHref?: (index: string) => string
}) {
  return (
    <>
      {spans.map((s, i) => {
        if (s.t === "bold") return <strong key={i} className="font-semibold text-foreground">{s.v}</strong>
        if (s.t === "italic") return <em key={i}>{s.v}</em>
        if (s.t === "code") return (
          <code key={i} dir="auto" className="rounded bg-muted px-1 py-px font-mono text-[0.9em]">{s.v}</code>
        )
        if (s.t === "cite") {
          const badge = "mx-0.5 inline-flex items-center rounded bg-primary/10 px-1 py-px align-baseline text-2xs font-semibold text-primary"
          // A same-page anchor, so it works without JavaScript and the target
          // element's `:target` style does the highlighting. Still never an
          // external link — see the note in lib/markdown.ts.
          return citationHref ? (
            <sup key={i}>
              <a href={citationHref(s.v)} className={`${badge} hover:bg-primary/20`}>
                {s.v}
              </a>
            </sup>
          ) : (
            <sup key={i} className={badge}>{s.v}</sup>
          )
        }
        return <span key={i}>{s.v}</span>
      })}
    </>
  )
}
