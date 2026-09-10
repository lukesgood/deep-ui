/** Puts the source of each gallery example next to the example.
 *
 *  The gallery shows 40 panels of components working, which answers "what does it look
 *  like" and not "how do I write it" — and the second question is the one somebody
 *  copying a component into their app actually has. Answering it by hand means writing
 *  every snippet twice, and the copy drifts from the original the first time either
 *  one is edited.
 *
 *  So the snippet is not written at all. At build time this reads the JSX children of
 *  every `<Panel>` straight out of the file being compiled and passes them in as a
 *  `source` prop. The code on the page is the code that produced the thing above it,
 *  because it is the same characters.
 *
 *  It parses rather than pattern-matches: a `>` inside a string, a nested `<Panel>`, a
 *  ternary in an attribute are all things a regex gets wrong quietly. And it throws if
 *  a panel yields nothing, because a "Show code" that opens onto an empty box is worse
 *  than no button at all.
 */
import { parse } from "@babel/parser"
import type { File, JSXElement, Node } from "@babel/types"
import type { Plugin } from "vite"

const TARGET = /Gallery\.tsx$/

/** Remove the indentation the snippet only has because of where it sat in the file. */
function dedent(text: string) {
  const lines = text.replace(/^\n+/, "").replace(/\s+$/, "").split("\n")
  const indents = lines
    .filter((l) => l.trim())
    .map((l) => l.match(/^[ \t]*/)![0].length)
  const strip = indents.length ? Math.min(...indents) : 0
  return lines.map((l) => l.slice(strip)).join("\n")
}

function name(node: JSXElement) {
  const n = node.openingElement.name
  return n.type === "JSXIdentifier" ? n.name : null
}

/** Every `<Panel>` in the file, with the span of its children.
 *
 *  Counted from the AST, not from the text. An early version compared against a
 *  `/<Panel[\s>]/g` count and failed the build on the word `<Panel>` inside the
 *  doc comment two paragraphs up — which is the whole reason this parses. */
function panels(ast: File) {
  const found: { insertAt: number; from: number; to: number }[] = []
  let total = 0
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return
    if (Array.isArray(node)) return node.forEach(visit)
    const n = node as Node
    if (n.type === "JSXElement" && name(n) === "Panel") {
      total++
      const kids = n.children.filter(
        (c) => !(c.type === "JSXText" && !c.value.trim())
      )
      if (kids.length) {
        found.push({
          insertAt: n.openingElement.name.end!,
          from: kids[0].start!,
          to: kids[kids.length - 1].end!,
        })
      }
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === "loc" || key === "leadingComments" || key === "trailingComments") continue
      visit(value)
    }
  }
  visit(ast.program.body)
  return { found, total }
}

export function panelSource(): Plugin {
  return {
    name: "deep-panel-source",
    enforce: "pre",
    transform(code: string, id: string) {
      if (!TARGET.test(id)) return null

      const ast = parse(code, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
      })

      const { found, total } = panels(ast)
      if (found.length !== total) {
        throw new Error(
          `deep-panel-source: ${total} <Panel> in ${id} but only ${found.length} have ` +
            `children to show. A "Code" button that opens onto an empty box is worse ` +
            `than no button, so this fails rather than shipping.`
        )
      }

      // Back to front, so each splice leaves the earlier offsets alone.
      let out = code
      for (const p of [...found].sort((a, b) => b.insertAt - a.insertAt)) {
        // The slice starts *after* the first line's indentation, so put it back
        // before dedenting — otherwise line one looks flush and every line under it
        // looks indented, which is the opposite of the shape it has in the file.
        const lineStart = code.lastIndexOf("\n", p.from - 1) + 1
        const lead = code.slice(lineStart, p.from)
        const snippet = dedent((/^[ \t]*$/.test(lead) ? lead : "") + code.slice(p.from, p.to))
        if (!snippet.trim()) throw new Error(`deep-panel-source: empty snippet in ${id}`)
        out =
          out.slice(0, p.insertAt) +
          ` source={${JSON.stringify(snippet)}}` +
          out.slice(p.insertAt)
      }
      return { code: out, map: null }
    },
  }
}
