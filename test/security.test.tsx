import { afterEach, expect, test } from "vitest"
import { cleanup, render } from "@testing-library/react"

import { Markdown } from "@/components/ui/markdown"
import { parseBlocks, parseInline } from "@/lib/markdown"

afterEach(cleanup)

/** The two properties SECURITY.md claims. They are design decisions, not incidental
 *  behaviour, so they are asserted rather than assumed.
 *
 *  The renderer exists for prose of uncertain provenance — model output, or text
 *  derived from ingested documents. Both of those can contain whatever someone put
 *  in a file. */

/* ── nothing in the input becomes markup ──────────────────────────────────── */

const HOSTILE = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<iframe src='https://evil.example'></iframe>",
  "<a href='https://evil.example'>click</a>",
  "<div onclick='alert(1)'>text</div>",
  "<style>body{display:none}</style>",
]

for (const input of HOSTILE) {
  test(`renders as text, not markup: ${input.slice(0, 24)}…`, () => {
    const { container } = render(<Markdown text={input} />)

    for (const tag of ["script", "img", "iframe", "a", "style"]) {
      expect(container.querySelector(tag)).toBeNull()
    }
    expect(container.querySelector("[onclick]")).toBeNull()
    // The characters survive — they are shown, which is the point.
    expect(container.textContent).toContain(input.slice(0, 12))
  })
}

test("the parser emits a closed set of node types, whatever it is handed", () => {
  // This is what makes the renderer's mapping exhaustive: there is no node type it
  // could be given that maps to raw markup.
  const blocks = parseBlocks(HOSTILE.join("\n\n") + "\n\n# h\n\n- a\n\n```\nx\n```", true)
  const blockTypes = new Set(blocks.map((b) => b.t))
  expect([...blockTypes].every((t) => ["p", "h", "ul", "ol", "pre"].includes(t))).toBe(true)

  const spanTypes = new Set(
    blocks.flatMap((b) => ("spans" in b ? b.spans : [])).map((s) => s.t)
  )
  expect([...spanTypes].every((t) => ["text", "bold", "italic", "code", "cite"].includes(t))).toBe(true)
})

test("a fenced block is never parsed, so markers inside it stay inert", () => {
  const { container } = render(<Markdown text={"```\n<script>alert(1)</script>\n```"} />)
  expect(container.querySelector("script")).toBeNull()
  expect(container.querySelector("pre")?.textContent).toBe("<script>alert(1)</script>")
})

/* ── a URL in the text never becomes a link ───────────────────────────────── */

test("a bare URL is shown, not linked", () => {
  const { container } = render(
    <Markdown text="See https://evil.example/reset for details." />
  )
  expect(container.querySelector("a")).toBeNull()
  expect(container.textContent).toContain("https://evil.example/reset")
})

test("markdown link syntax is not link syntax here", () => {
  // The parser has no link node at all, which is why: nothing to build an anchor from.
  const { container } = render(<Markdown text="[click me](https://evil.example)" />)
  expect(container.querySelector("a")).toBeNull()
  expect(container.textContent).toContain("https://evil.example")
  expect(parseInline("[click me](https://evil.example)").every((s) => s.t === "text")).toBe(true)
})

test("citationHref can only produce the anchor the caller builds, and it is same-page", () => {
  render(
    <Markdown text="A claim [1] and another [2]." citations citationHref={(n) => `#citation-${n}`} />
  )
  const links = Array.from(document.querySelectorAll("a"))
  expect(links).toHaveLength(2)
  for (const link of links) {
    expect(link.getAttribute("href")).toMatch(/^#citation-\d+$/)
  }
})

test("without citationHref a marker is inert text, not a link", () => {
  const { container } = render(<Markdown text="A claim [1]." citations />)
  expect(container.querySelector("a")).toBeNull()
  expect(container.textContent).toContain("1")
})
