import { test } from "node:test"
import assert from "node:assert/strict"

import { parseBlocks, parseInline, type Block, type Inline } from "../src/lib/markdown.ts"

/* ── inline ───────────────────────────────────────────────────────────────── */

test("plain text is one span", () => {
  assert.deepEqual(parseInline("just words"), [{ t: "text", v: "just words" }])
})

test("bold, italic and code are recognised", () => {
  assert.deepEqual(parseInline("**b**"), [{ t: "bold", v: "b" }])
  assert.deepEqual(parseInline("*i*"), [{ t: "italic", v: "i" }])
  assert.deepEqual(parseInline("`c`"), [{ t: "code", v: "c" }])
})

test("markers are kept literal inside code, because code wins the split", () => {
  // The ordering in INLINE matters: if bold matched first, `**not bold**` would
  // come back as a bold span and the backticks would be lost.
  assert.deepEqual(parseInline("`**not bold**`"), [{ t: "code", v: "**not bold**" }])
})

test("spans keep their surrounding text and order", () => {
  assert.deepEqual(parseInline("a **b** c"), [
    { t: "text", v: "a " },
    { t: "bold", v: "b" },
    { t: "text", v: " c" },
  ])
})

test("an asterisk inside a word is not italic", () => {
  // The lookbehind exists so `a*b*c` and `**x**` do not produce stray italics.
  assert.deepEqual(parseInline("a*b*c"), [{ t: "text", v: "a*b*c" }])
})

test("empty markers are left as text rather than becoming empty spans", () => {
  assert.deepEqual(parseInline("**"), [{ t: "text", v: "**" }])
  assert.deepEqual(parseInline("``"), [{ t: "text", v: "``" }])
})

test("citations are only spans when asked for", () => {
  assert.deepEqual(parseInline("see [1]", true), [
    { t: "text", v: "see " },
    { t: "cite", v: "1" },
  ])
  // Without the flag the marker still gets split out — only its classification
  // changes — so assert the contract that matters: it stays text, and the
  // visible characters survive intact.
  const off = parseInline("see [1]", false)
  assert.ok(off.every((s) => s.t === "text"))
  assert.equal(off.map((s) => s.v).join(""), "see [1]")
})

test("a bracketed non-number is never a citation", () => {
  assert.deepEqual(parseInline("[a]", true), [{ t: "text", v: "[a]" }])
})

/* ── blocks ───────────────────────────────────────────────────────────────── */

const kinds = (blocks: Block[]) => blocks.map((b) => b.t)
const spansOf = (b: Block) => ("spans" in b ? b.spans : [])
const textOf = (spans: Inline[]) => spans.map((s) => s.v).join("")

test("empty and nullish input produce no blocks", () => {
  assert.deepEqual(parseBlocks(""), [])
  assert.deepEqual(parseBlocks(undefined as unknown as string), [])
  assert.deepEqual(parseBlocks(null as unknown as string), [])
})

test("headings carry their level", () => {
  const blocks = parseBlocks("# one\n\n## two\n\n#### four")
  assert.deepEqual(kinds(blocks), ["h", "h", "h"])
  assert.deepEqual(
    blocks.map((b) => (b.t === "h" ? b.level : null)),
    [1, 2, 4]
  )
})

test("five hashes is not a heading — the parser stops at four", () => {
  assert.deepEqual(kinds(parseBlocks("##### five")), ["p"])
})

test("a hash without a space is not a heading", () => {
  assert.deepEqual(kinds(parseBlocks("#notaheading")), ["p"])
})

test("consecutive lines join into one paragraph, separated by a space", () => {
  const [block] = parseBlocks("one\ntwo")
  assert.equal(block.t, "p")
  assert.equal(textOf(spansOf(block)), "one two")
})

test("a blank line ends the paragraph", () => {
  assert.deepEqual(kinds(parseBlocks("one\n\ntwo")), ["p", "p"])
})

test("all three bullet markers make a list", () => {
  for (const marker of ["-", "*", "+"]) {
    const blocks = parseBlocks(`${marker} a\n${marker} b`)
    assert.deepEqual(kinds(blocks), ["ul"], `marker ${marker}`)
    assert.equal(blocks[0].t === "ul" ? blocks[0].items.length : 0, 2)
  }
})

test("both numbered forms make an ordered list", () => {
  assert.deepEqual(kinds(parseBlocks("1. a\n2. b")), ["ol"])
  assert.deepEqual(kinds(parseBlocks("1) a\n2) b")), ["ol"])
})

test("switching marker style starts a new list instead of mixing meanings", () => {
  assert.deepEqual(kinds(parseBlocks("- a\n1. b")), ["ul", "ol"])
})

test("a list ends when prose resumes", () => {
  assert.deepEqual(kinds(parseBlocks("- a\nprose")), ["ul", "p"])
})

test("list items are parsed for inline spans", () => {
  const [list] = parseBlocks("- **bold** item")
  assert.equal(list.t, "ul")
  if (list.t !== "ul") return
  assert.deepEqual(list.items[0][0], { t: "bold", v: "bold" })
})

test("a fenced block is captured verbatim", () => {
  const [block] = parseBlocks("```\nselect 1\n  indented\n```")
  assert.equal(block.t, "pre")
  assert.equal(block.t === "pre" ? block.v : "", "select 1\n  indented")
})

test("fence content is never parsed as markdown", () => {
  const [block] = parseBlocks("```\n# not a heading\n- not a list\n**not bold**\n```")
  assert.equal(block.t, "pre")
  assert.equal(block.t === "pre" ? block.v : "", "# not a heading\n- not a list\n**not bold**")
})

test("an unterminated fence swallows the rest rather than throwing", () => {
  const blocks = parseBlocks("```\nstill open")
  assert.deepEqual(kinds(blocks), ["pre"])
  assert.equal(blocks[0].t === "pre" ? blocks[0].v : "", "still open")
})

test("a fence interrupts an open paragraph and list", () => {
  assert.deepEqual(kinds(parseBlocks("prose\n- item\n```\ncode\n```")), ["p", "ul", "pre"])
})

test("CRLF input is normalised", () => {
  assert.deepEqual(kinds(parseBlocks("# h\r\n\r\n- a\r\n- b")), ["h", "ul"])
})

test("a realistic model answer parses into the expected shape", () => {
  const blocks = parseBlocks(
    [
      "## What changed",
      "",
      "The **billing_export** job failed. Two things to check:",
      "",
      "1. the upstream `sessions_hourly` table is *degraded*",
      "2. the credential expired",
      "",
      "```sql",
      "select count(*) from billing_export;",
      "```",
      "",
      "See [1].",
    ].join("\n"),
    true
  )
  assert.deepEqual(kinds(blocks), ["h", "p", "ol", "pre", "p"])
  const last = blocks.at(-1)!
  assert.ok(spansOf(last).some((s) => s.t === "cite" && s.v === "1"))
})
