import { afterEach, expect, test } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"

import { Pagination, PaginationContent, PaginationItem, PaginationPrevious } from "@/components/ui/pagination"
import { PasswordInput } from "@/components/ui/password-input"
import { DEFAULT_STRINGS, StringsProvider } from "@/lib/strings"
import { ToastProvider, useToast } from "@/lib/toast"

afterEach(cleanup)

/** The words the components say on their own.
 *
 *  Most are `aria-label`s. That is what makes leaving them baked in a real problem
 *  rather than an inconvenience: an untranslated visible label is obvious the first
 *  time anyone looks at the screen, and an untranslated `aria-label` is invisible to
 *  everyone except the person relying on it. */

test("with no provider, a component says the English default", () => {
  render(<PasswordInput aria-label="Password" />)
  expect(screen.getByRole("button", { name: DEFAULT_STRINGS["passwordInput.show"] })).toBeTruthy()
})

test("a provider replaces it, without the component knowing", () => {
  render(
    <StringsProvider strings={{ "passwordInput.show": "비밀번호 표시", "passwordInput.hide": "비밀번호 숨기기" }}>
      <PasswordInput aria-label="비밀번호" />
    </StringsProvider>
  )
  const toggle = screen.getByRole("button", { name: "비밀번호 표시" })
  fireEvent.click(toggle)
  // Both states, not just the one that happens to render first.
  expect(screen.getByRole("button", { name: "비밀번호 숨기기" })).toBeTruthy()
})

test("a partial dictionary leaves the rest in English", () => {
  // The realistic case: a translation that is not finished. It must not blank the
  // labels it has not reached yet.
  render(
    <StringsProvider strings={{ "pagination.previous": "이전" }}>
      <Pagination>
        <PaginationContent>
          <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
        </PaginationContent>
      </Pagination>
    </StringsProvider>
  )
  expect(screen.getByText("이전")).toBeTruthy()
  // aria-label was not translated, so it stays English rather than becoming undefined
  expect(screen.getByRole("navigation").getAttribute("aria-label")).toBe(
    DEFAULT_STRINGS["pagination.label"]
  )
})

test("a prop still wins over the provider, for a one-off", () => {
  render(
    <StringsProvider strings={{ "pagination.label": "쪽 이동" }}>
      <Pagination label="Search results">
        <PaginationContent />
      </Pagination>
    </StringsProvider>
  )
  expect(screen.getByRole("navigation", { name: "Search results" })).toBeTruthy()
})

test("providers rendered inside the strings provider see it too", () => {
  // Toast and Confirm are providers themselves, so they read the dictionary at their
  // own level rather than at the point a toast is raised.
  function Raise() {
    const { toast } = useToast()
    return <button onClick={() => toast("Saved", "success")}>Raise</button>
  }
  render(
    <StringsProvider strings={{ "toast.region": "알림", "toast.dismiss": "닫기" }}>
      <ToastProvider><Raise /></ToastProvider>
    </StringsProvider>
  )
  expect(screen.getByRole("region", { name: "알림" })).toBeTruthy()
  fireEvent.click(screen.getByText("Raise"))
  expect(screen.getByRole("button", { name: "닫기" })).toBeTruthy()
})

test("every default is a non-empty string", () => {
  for (const [key, value] of Object.entries(DEFAULT_STRINGS)) {
    expect(value, key).toBeTypeOf("string")
    expect(value.trim(), key).not.toBe("")
  }
})

/* ── direction ────────────────────────────────────────────────────────────── */

test("text the component did not write carries dir=auto", async () => {
  const { Markdown } = await import("@/components/ui/markdown")
  const { container } = render(<Markdown text={"# عنوان\n\nنص عربي مع events_raw"} />)

  // Per block, not once on the wrapper: one answer can hold an English paragraph and
  // an Arabic one, and direction belongs to each.
  const heading = container.querySelector("h3")!
  const paragraph = container.querySelector("p")!
  expect(heading.getAttribute("dir")).toBe("auto")
  expect(paragraph.getAttribute("dir")).toBe("auto")

  // The browser resolves it from the first strong character, so an Arabic paragraph
  // lays out right-to-left without anyone declaring a page language.
  expect(paragraph.textContent).toContain("events_raw")
})

test("a conversation turn is isolated from its neighbours", async () => {
  const { Conversation, ConversationMessage } = await import("@/components/ui/conversation")
  render(
    <Conversation>
      <ConversationMessage from="user">ما الذي يقرأ events_raw؟</ConversationMessage>
      <ConversationMessage from="assistant">The hourly rollup does.</ConversationMessage>
    </Conversation>
  )
  const bubbles = document.querySelectorAll('[data-slot="conversation-message"] > div[dir]')
  expect(bubbles).toHaveLength(2)
  for (const b of bubbles) expect(b.getAttribute("dir")).toBe("auto")
})

test("an error message is shown in whatever direction the server wrote it", async () => {
  const { ErrorBox } = await import("@/components/ui/error-box")
  render(<ErrorBox msg="فشل الاتصال" />)
  expect(screen.getByText("فشل الاتصال").getAttribute("dir")).toBe("auto")
})

test("the switch thumb is positioned logically, so it travels the right way in RTL", async () => {
  const { Switch } = await import("@/components/ui/switch")
  render(<Switch defaultChecked aria-label="Nightly compaction" />)
  const thumb = document.querySelector('[data-slot="switch-thumb"]')!

  // happy-dom does not lay out, so the assertion is on the mechanism rather than the
  // pixels: the offset must be an inset-inline property, which the browser resolves
  // against the writing direction, and never a translate, which does not flip and
  // sent the thumb off the end of its track.
  const classes = thumb.className
  expect(classes).toMatch(/(^|[\s:])start-/)
  expect(classes).not.toMatch(/translate-x/)
})
