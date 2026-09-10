import { afterEach, expect, test } from "vitest"
import { act, cleanup, render, screen } from "@testing-library/react"

import { Conversation, ConversationMessage } from "@/components/ui/conversation"
import { Markdown } from "@/components/ui/markdown"

afterEach(cleanup)

/** The first item on the README's screen-reader audit list, as far as it can be taken
 *  without a screen reader.
 *
 *  The failure being guarded against: a streaming answer re-renders its text on every
 *  token, and a naive live region announces the whole growing message each time —
 *  forty announcements for one answer, each interrupting the last. It is the worst
 *  thing a chat panel can do to somebody using a reader, and it is invisible to
 *  everyone else.
 *
 *  What a screen reader announces inside `aria-live` depends on `aria-relevant`. With
 *  `additions`, nodes being *added* are announced and text *changing in place* is not.
 *  So the measurable property is: while a message streams, the live region sees
 *  character data change and no new nodes added. That is not proof a reader stays
 *  quiet — only a reader can prove that — but the shape it would need is testable, and
 *  a regression that starts appending a node per token would fail here.
 */

function countMutations(target: Node, run: () => void) {
  const counts = { additions: 0, characterData: 0 }
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "childList") counts.additions += r.addedNodes.length
      if (r.type === "characterData") counts.characterData += 1
    }
  })
  observer.observe(target, {
    childList: true,
    subtree: true,
    characterData: true,
  })
  run()
  // MutationObserver is a microtask; flush it.
  observer.takeRecords().forEach((r) => {
    if (r.type === "childList") counts.additions += r.addedNodes.length
    if (r.type === "characterData") counts.characterData += 1
  })
  observer.disconnect()
  return counts
}

const ANSWER = "The hourly rollup reads it at five past, and compaction rewrites it at two."

function Streaming({ text }: { text: string }) {
  return (
    <Conversation>
      <ConversationMessage from="user">What reads it?</ConversationMessage>
      {text && (
        <ConversationMessage from="assistant">
          <Markdown text={text} />
        </ConversationMessage>
      )}
    </Conversation>
  )
}

test("a streaming answer changes text in place instead of appending a node per token", () => {
  const { rerender } = render(<Streaming text={ANSWER.slice(0, 10)} />)
  const log = screen.getByRole("log")

  const counts = countMutations(log, () => {
    // twenty tokens' worth of growth, the way a stream arrives
    for (let i = 11; i <= 30; i++) {
      act(() => {
        rerender(<Streaming text={ANSWER.slice(0, i)} />)
      })
    }
  })

  expect(counts.characterData).toBeGreaterThan(0)
  // `aria-relevant="additions"` is what makes this the right measurement: a node added
  // is announced, a character changed is not.
  expect(counts.additions).toBe(0)
})

test("the answer arriving is one addition, not none — it still has to be announced", () => {
  const { rerender } = render(<Streaming text="" />)
  const log = screen.getByRole("log")

  const counts = countMutations(log, () => {
    act(() => {
      rerender(<Streaming text={ANSWER} />)
    })
  })

  expect(counts.additions).toBeGreaterThan(0)
})

test("the log declares which mutations matter", () => {
  render(<Streaming text={ANSWER} />)
  const log = screen.getByRole("log")
  // Without `additions` the default for role=log includes text, and every token would
  // be a candidate for announcement.
  expect(log.getAttribute("aria-relevant")).toBe("additions")
  expect(log.getAttribute("aria-live")).toBe("polite")
})
