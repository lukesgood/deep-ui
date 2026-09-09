import { afterEach, expect, test, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"

import { Button } from "@/components/ui/button"
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer"
import { Conversation, ConversationMessage } from "@/components/ui/conversation"
import {
  Field, FieldControl, FieldDescription, FieldError, FieldLabel, Form,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
} from "@/components/ui/pagination"
import { PasswordInput } from "@/components/ui/password-input"
import { Progress, ProgressTrack } from "@/components/ui/progress"

afterEach(cleanup)

/* ── Field: the wiring that hand-rolled versions drop ─────────────────────── */

test("a field ties its label, description and error to the control", async () => {
  render(
    <Form>
      <Field name="dataset" validate={(v) => (v ? null : "A name is required.")}>
        <FieldLabel>Dataset name</FieldLabel>
        <FieldControl render={<Input />} />
        <FieldDescription>Cannot be changed later.</FieldDescription>
        <FieldError />
      </Field>
      <Button type="submit">Create</Button>
    </Form>
  )

  const control = screen.getByLabelText("Dataset name")
  const description = screen.getByText("Cannot be changed later.")

  // The label points at the control, so clicking it focuses the input.
  expect(control.id).toBeTruthy()
  expect(screen.getByText("Dataset name").getAttribute("for")).toBe(control.id)
  // The hint is announced with the control, not just placed near it.
  expect(control.getAttribute("aria-describedby")).toContain(description.id)

  fireEvent.click(screen.getByText("Create"))
  const error = await screen.findByText("A name is required.")

  // Colour is the second signal; these two are the first.
  expect(control.getAttribute("aria-invalid")).toBe("true")
  expect(control.getAttribute("aria-describedby")).toContain(error.id)
})

/* ── PasswordInput ─────────────────────────────────────────────────────────── */

test("the reveal toggle switches the input and reports its own state", () => {
  render(<PasswordInput defaultValue="hunter2" />)
  const input = document.querySelector<HTMLInputElement>('[data-slot="password-input"] input')!
  const toggle = screen.getByRole("button", { name: "Show password" })

  expect(input.type).toBe("password")
  expect(toggle.getAttribute("aria-pressed")).toBe("false")
  expect(toggle.getAttribute("aria-controls")).toBe(input.id)

  fireEvent.click(toggle)

  expect(input.type).toBe("text")
  expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe("true")
  // Revealing must not disturb what was typed.
  expect(input.value).toBe("hunter2")
})

test("the reveal toggle cannot submit the form it sits in", () => {
  const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
  render(
    <form onSubmit={onSubmit}>
      <PasswordInput />
    </form>
  )
  fireEvent.click(screen.getByRole("button", { name: "Show password" }))
  expect(onSubmit).not.toHaveBeenCalled()
})

test("defaults to current-password, so a sign-up form must say otherwise", () => {
  const { rerender } = render(<PasswordInput />)
  const read = () =>
    document.querySelector<HTMLInputElement>('[data-slot="password-input"] input')!.autocomplete
  expect(read()).toBe("current-password")
  rerender(<PasswordInput autoComplete="new-password" />)
  expect(read()).toBe("new-password")
})

/* ── Composer ─────────────────────────────────────────────────────────────── */

function ComposerHarness({ busy = false, onSend }: { busy?: boolean; onSend: () => void }) {
  return (
    <Composer busy={busy} onSend={onSend}>
      <ComposerInput aria-label="Message" />
      <ComposerSubmit />
    </Composer>
  )
}

test("Enter sends", () => {
  const onSend = vi.fn()
  render(<ComposerHarness onSend={onSend} />)
  fireEvent.keyDown(screen.getByLabelText("Message"), { key: "Enter" })
  expect(onSend).toHaveBeenCalledTimes(1)
})

test("Shift+Enter breaks the line instead of sending", () => {
  const onSend = vi.fn()
  render(<ComposerHarness onSend={onSend} />)
  fireEvent.keyDown(screen.getByLabelText("Message"), { key: "Enter", shiftKey: true })
  expect(onSend).not.toHaveBeenCalled()
})

test("Enter mid-IME-composition does not send", () => {
  // In Korean, Japanese and Chinese input the first Enter commits the candidate.
  // Sending on it truncates the sentence mid-word.
  const onSend = vi.fn()
  render(<ComposerHarness onSend={onSend} />)
  const input = screen.getByLabelText("Message")
  fireEvent.compositionStart(input)
  fireEvent.keyDown(input, { key: "Enter" })
  expect(onSend).not.toHaveBeenCalled()

  fireEvent.compositionEnd(input)
  fireEvent.keyDown(input, { key: "Enter" })
  expect(onSend).toHaveBeenCalledTimes(1)
})

test("nothing is sent while a reply is still streaming", () => {
  const onSend = vi.fn()
  render(<ComposerHarness busy onSend={onSend} />)
  fireEvent.keyDown(screen.getByLabelText("Message"), { key: "Enter" })
  expect(onSend).not.toHaveBeenCalled()
  expect(screen.getByRole("button", { name: "Stop generating" })).toBeTruthy()
})

/* ── Conversation, Progress, Pagination ───────────────────────────────────── */

test("the conversation is a polite live region, so a new answer is announced", () => {
  render(
    <Conversation label="Assistant conversation">
      <ConversationMessage from="assistant">Hello</ConversationMessage>
    </Conversation>
  )
  const log = screen.getByRole("log")
  expect(log.getAttribute("aria-live")).toBe("polite")
  expect(log.getAttribute("aria-label")).toBe("Assistant conversation")
})

test("progress reports a number, and reports nothing when it has none", () => {
  const { rerender } = render(<Progress value={62}><ProgressTrack /></Progress>)
  const bar = () => screen.getByRole("progressbar")
  expect(bar().getAttribute("aria-valuenow")).toBe("62")

  rerender(<Progress value={null}><ProgressTrack /></Progress>)
  // Indeterminate must not claim a percentage nobody can back up.
  expect(bar().getAttribute("aria-valuenow")).toBeNull()
})

test("pagination announces the current page rather than only highlighting it", () => {
  render(
    <Pagination>
      <PaginationContent>
        <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
        <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
      </PaginationContent>
    </Pagination>
  )
  expect(screen.getByRole("navigation", { name: "Pagination" })).toBeTruthy()
  expect(screen.getByText("2").getAttribute("aria-current")).toBe("page")
  expect(screen.getByText("1").getAttribute("aria-current")).toBeNull()
})
