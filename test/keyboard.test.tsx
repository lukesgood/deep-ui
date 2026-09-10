/** What a screen-reader audit does not need a screen reader for.
 *
 *  The README's audit list is ordered by how badly things go when they are wrong, and
 *  the top of it is split down the middle. "Does a streaming answer announce once or
 *  forty times" needs a person with a screen reader. "Does Escape return focus to the
 *  trigger" does not — that is a fact about the DOM, and a test can hold it.
 *
 *  This file is the second half. It exists because every other test here renders and
 *  then reads an attribute, which cannot catch the thing that actually breaks: focus
 *  and roving-tabindex behaviour comes from Base UI, so it can regress on a version
 *  bump without a line of this repo changing. The tooltip's missing `aria-describedby`
 *  sat here for months precisely because nobody ever opened one.
 *
 *  Every test below was checked by breaking the thing it covers. A test that passes
 *  when the behaviour is gone is worse than no test, because it is also a claim.
 */
import * as React from "react"
import { afterEach, expect, test } from "vitest"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList,
} from "@/components/ui/combobox"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Field, FieldControl, FieldDescription, FieldError, FieldLabel, Form,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup } from "@/components/ui/toggle-group"

afterEach(cleanup)

/** Where focus is, named the way a person would say it out loud. */
function focused() {
  const el = document.activeElement as HTMLElement | null
  if (!el || el === document.body) return "nothing"
  return (
    el.getAttribute("aria-label") ??
    el.textContent?.trim().slice(0, 24) ??
    el.tagName.toLowerCase()
  )
}

/* ── focus: does it go in, stay in, and come back ─────────────────────────── */

test("an open dialog keeps Tab inside it", async () => {
  const user = userEvent.setup()
  render(
    <>
      <Button>Before</Button>
      <Dialog>
        <DialogTrigger render={<Button />}>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Rename dataset</DialogTitle>
          <Input aria-label="New name" />
          <Button>Save</Button>
        </DialogContent>
      </Dialog>
      <Button>After</Button>
    </>
  )

  await user.click(screen.getByRole("button", { name: "Open" }))

  // Six stops is more than the dialog holds, so anything reachable outside it would
  // have shown up by now. Asserted as the whole trail rather than "never Before",
  // because a trap that lets focus escape to `document.body` also passes that.
  const trail = [focused()]
  for (let i = 0; i < 5; i++) {
    await user.tab()
    trail.push(focused())
  }

  expect(trail).toEqual([
    "New name", "Save", "Close",
    "New name", "Save", "Close",
  ])
})

test("Escape closes a dialog and gives focus back to what opened it", async () => {
  const user = userEvent.setup()
  render(
    <Dialog>
      <DialogTrigger render={<Button />}>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Rename dataset</DialogTitle>
        <Input aria-label="New name" />
      </DialogContent>
    </Dialog>
  )

  const trigger = screen.getByRole("button", { name: "Open" })
  await user.click(trigger)
  expect(focused()).toBe("New name")

  await user.keyboard("{Escape}")

  await waitFor(() => expect(screen.queryByText("Rename dataset")).toBeNull())
  // Not "focus is on some button" — on *this* button. Focus that lands back at the
  // top of the page means finding your place again from the start.
  expect(document.activeElement).toBe(trigger)
})

test("cancelling an alert dialog gives focus back to what opened it", async () => {
  const user = userEvent.setup()

  function Harness() {
    const [open, setOpen] = React.useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Delete dataset</Button>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Delete events_raw?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => setOpen(false)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  render(<Harness />)
  const trigger = screen.getByRole("button", { name: "Delete dataset" })
  await user.click(trigger)
  await user.click(screen.getByRole("button", { name: "Cancel" }))

  await waitFor(() => expect(screen.queryByText("Delete events_raw?")).toBeNull())
  expect(document.activeElement).toBe(trigger)
})

test("a sheet returns focus to its trigger", async () => {
  const user = userEvent.setup()
  render(
    <Sheet>
      <SheetTrigger render={<Button />}>Filters</SheetTrigger>
      <SheetContent>
        <SheetTitle>Filters</SheetTitle>
        <Input aria-label="Query" />
      </SheetContent>
    </Sheet>
  )

  const trigger = screen.getByRole("button", { name: "Filters" })
  await user.click(trigger)
  await user.keyboard("{Escape}")

  await waitFor(() => expect(document.activeElement).toBe(trigger))
})

test("a combobox moves its highlight without moving focus off the input", async () => {
  const user = userEvent.setup()
  render(
    <Combobox items={["ap-northeast-2", "eu-west-1", "us-east-1"]}>
      <ComboboxInput aria-label="Region" />
      <ComboboxContent>
        <ComboboxEmpty>No region matches that.</ComboboxEmpty>
        <ComboboxList>
          {["ap-northeast-2", "eu-west-1", "us-east-1"].map((r) => (
            <ComboboxItem key={r} value={r}>{r}</ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )

  const input = screen.getByRole("combobox", { name: "Region" })
  await user.click(input)
  await user.keyboard("{ArrowDown}")

  // The whole point of `aria-activedescendant`: you are still typing in the input, so
  // focus must not leave it, but the reader has to be told which option is current.
  // Move focus to the option instead and typing stops working.
  await waitFor(() => expect(input.getAttribute("aria-activedescendant")).toBeTruthy())
  expect(document.activeElement).toBe(input)

  const first = input.getAttribute("aria-activedescendant")
  await user.keyboard("{ArrowDown}")
  await waitFor(() =>
    expect(input.getAttribute("aria-activedescendant")).not.toBe(first)
  )
  expect(document.activeElement).toBe(input)
  // And it points at something. An id naming nothing announces nothing.
  expect(document.getElementById(input.getAttribute("aria-activedescendant")!)).toBeTruthy()
})

/* ── state: does the control say what it is doing ─────────────────────────── */

test("an accordion trigger reports expanded, and the keyboard flips it", async () => {
  const user = userEvent.setup()
  render(
    <Accordion>
      <AccordionItem value="partitioning">
        <AccordionTrigger>Partitioning</AccordionTrigger>
        <AccordionContent>Partitioned by day.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )

  const trigger = screen.getByRole("button", { name: "Partitioning" })
  expect(trigger.getAttribute("aria-expanded")).toBe("false")

  await user.tab()
  expect(document.activeElement).toBe(trigger)

  await user.keyboard("{Enter}")
  await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("true"))

  await user.keyboard(" ")
  await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"))
})

test("a collapsible trigger reports expanded", async () => {
  const user = userEvent.setup()
  render(
    <Collapsible>
      <CollapsibleTrigger render={<Button />}>Advanced</CollapsibleTrigger>
      <CollapsibleContent>Retry policy.</CollapsibleContent>
    </Collapsible>
  )

  const trigger = screen.getByRole("button", { name: "Advanced" })
  expect(trigger.getAttribute("aria-expanded")).toBe("false")
  await user.click(trigger)
  await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("true"))
})

test("a toggle reports pressed, not checked", async () => {
  const user = userEvent.setup()
  render(<Toggle aria-label="Bold" />)

  const toggle = screen.getByRole("button", { name: "Bold" })
  expect(toggle.getAttribute("aria-pressed")).toBe("false")
  await user.click(toggle)
  await waitFor(() => expect(toggle.getAttribute("aria-pressed")).toBe("true"))
})

test("a toggle group is one tab stop with arrow keys inside it", async () => {
  const user = userEvent.setup()
  render(
    <>
      <ToggleGroup defaultValue={["bold"]} multiple>
        <Toggle value="bold" aria-label="Bold" />
        <Toggle value="italic" aria-label="Italic" />
        <Toggle value="underline" aria-label="Underline" />
      </ToggleGroup>
      <Button>After</Button>
    </>
  )

  // One stop for the group, not one per button — otherwise a five-button toolbar is
  // five presses of Tab to get past.
  await user.tab()
  expect(focused()).toBe("Bold")
  await user.keyboard("{ArrowRight}")
  expect(focused()).toBe("Italic")
  await user.keyboard("{ArrowRight}")
  expect(focused()).toBe("Underline")

  await user.tab()
  expect(focused()).toBe("After")
})

test("arrow keys move between tabs, and selection waits for Enter", async () => {
  const user = userEvent.setup()
  render(
    <Tabs defaultValue="schema">
      <TabsList>
        <TabsTrigger value="schema">Schema</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="schema">12 columns</TabsContent>
      <TabsContent value="preview">First 100 rows</TabsContent>
    </Tabs>
  )

  const schema = screen.getByRole("tab", { name: "Schema" })
  const preview = screen.getByRole("tab", { name: "Preview" })
  expect(schema.getAttribute("aria-selected")).toBe("true")

  // One tab stop for the whole list, as with a toolbar.
  await user.tab()
  expect(document.activeElement).toBe(schema)

  // Manual activation: the arrow key moves focus and leaves the selection alone.
  // This is deliberate and worth pinning. In a data app a tab is often expensive —
  // "Preview" runs a query, "History" fetches runs — and automatic activation would
  // fire every panel you arrow past on your way to the one you wanted. The cost is
  // one extra key; APG allows both, and this is the side to be on here.
  await user.keyboard("{ArrowRight}")
  expect(document.activeElement).toBe(preview)
  expect(preview.getAttribute("aria-selected")).toBe("false")
  expect(screen.getByRole("tabpanel").textContent).toContain("12 columns")

  await user.keyboard("{Enter}")
  await waitFor(() => expect(preview.getAttribute("aria-selected")).toBe("true"))
  expect(schema.getAttribute("aria-selected")).toBe("false")
  expect(screen.getByRole("tabpanel").textContent).toContain("First 100 rows")
})

/* ── forms: does the error reach the person who cannot see it ─────────────── */

test("a field error is announced through the control, after its description", async () => {
  const user = userEvent.setup()
  render(
    <Form onSubmit={(e) => e.preventDefault()}>
      <Field
        name="dataset"
        validate={(value) => (String(value ?? "") ? null : "A name is required.")}
        validationMode="onBlur"
      >
        <FieldLabel>Dataset name</FieldLabel>
        <FieldControl render={<Input />} />
        <FieldDescription>Cannot be changed after creation.</FieldDescription>
        <FieldError />
      </Field>
      <Button type="submit">Create</Button>
    </Form>
  )

  const control = screen.getByLabelText("Dataset name")
  await user.click(control)
  await user.tab()

  const error = await screen.findByText("A name is required.")

  // A visible red message is not an announcement. The control has to point at it.
  const described = (control.getAttribute("aria-describedby") ?? "").split(/\s+/)
  expect(described).toContain(error.id)
  expect(control.getAttribute("aria-invalid")).toBe("true")

  // Order matters: `aria-describedby` is read in the order it lists, so the rule
  // ("lowercase only") has to arrive before the complaint about breaking it.
  //
  // Both ids are asserted present before the comparison, because `indexOf` returns
  // -1 for a missing one and -1 is less than everything — a description that was
  // never wired up at all would otherwise pass this as "correctly ordered".
  const description = screen.getByText("Cannot be changed after creation.")
  expect(described).toContain(description.id)
  expect(described.indexOf(description.id)).toBeLessThan(described.indexOf(error.id))
})

test("a password toggle says whether the password is showing", async () => {
  const user = userEvent.setup()
  render(<PasswordInput aria-label="Password" />)

  const input = screen.getByLabelText("Password") as HTMLInputElement
  expect(input.type).toBe("password")

  const toggle = screen.getByRole("button")
  const revealName = toggle.getAttribute("aria-label")
  await user.click(toggle)

  await waitFor(() => expect(input.type).toBe("text"))
  // The button's name has to change with it. A button that still says "Show password"
  // while the password is showing is telling the reader the opposite of the truth.
  expect(toggle.getAttribute("aria-label")).not.toBe(revealName)
})
