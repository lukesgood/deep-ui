import { afterEach, expect, test } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover, PopoverContent, PopoverTitle, PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog, DialogContent, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet, SheetContent, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

afterEach(cleanup)

/* ── the regression that motivated this file ──────────────────────────────────
 *
 * DropdownMenuLabel is Base UI's Menu.GroupLabel, which throws when it is not
 * inside a Menu.Group. A throw during render unmounts the whole React tree, so
 * every one of these menus took the entire page down when opened — and nothing
 * caught it, because opening a menu is exactly the step nobody performed.
 */

test("a menu with a label inside a group opens and renders its items", () => {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button />}>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>events_raw</DropdownMenuLabel>
          <DropdownMenuItem>Rename</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  fireEvent.click(screen.getByText("Actions"))
  expect(screen.getByText("events_raw")).toBeTruthy()
  expect(screen.getByText("Rename")).toBeTruthy()
})

test("a menu label without a group supplies its own instead of taking the page down", () => {
  // This used to throw, and a throw during render unmounts the whole React tree —
  // one menu with a label blanked the entire page. The label now wraps itself in a
  // group when it has none, so the mistake is not available to make.
  render(
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button />}>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>events_raw</DropdownMenuLabel>
        <DropdownMenuItem>Rename</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  fireEvent.click(screen.getByText("Actions"))
  expect(screen.getByText("events_raw")).toBeTruthy()
  expect(screen.getByText("Rename")).toBeTruthy()
})

test("a label inside a group does not nest a second one", () => {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button />}>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>events_raw</DropdownMenuLabel>
          <DropdownMenuItem>Rename</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  fireEvent.click(screen.getByText("Actions"))
  const label = screen.getByText("events_raw")
  const groups = label.closest('[role="group"]')?.querySelectorAll('[role="group"]') ?? []
  expect(groups.length).toBe(0)
})

/* ── every overlay opens ──────────────────────────────────────────────────── */

test("popover opens and is a labelled region", () => {
  render(
    <Popover>
      <PopoverTrigger render={<Button />}>Open</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Retention</PopoverTitle>
      </PopoverContent>
    </Popover>
  )
  fireEvent.click(screen.getByText("Open"))
  const title = screen.getByText("Retention")
  expect(title).toBeTruthy()
  const popup = title.closest('[data-slot="popover-content"]')!
  expect(popup.getAttribute("aria-labelledby")).toBeTruthy()
})

test("dialog opens", () => {
  render(
    <Dialog>
      <DialogTrigger render={<Button />}>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Create dataset</DialogTitle>
      </DialogContent>
    </Dialog>
  )
  fireEvent.click(screen.getByText("Open"))
  expect(screen.getByText("Create dataset")).toBeTruthy()
})

test("sheet opens", () => {
  render(
    <Sheet>
      <SheetTrigger render={<Button />}>Open</SheetTrigger>
      <SheetContent>
        <SheetTitle>Run history</SheetTitle>
      </SheetContent>
    </Sheet>
  )
  fireEvent.click(screen.getByText("Open"))
  expect(screen.getByText("Run history")).toBeTruthy()
})

test("accordion reveals its panel", () => {
  render(
    <Accordion>
      <AccordionItem value="a">
        <AccordionTrigger>Why did it fail?</AccordionTrigger>
        <AccordionContent>The upstream sync missed its window.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
  fireEvent.click(screen.getByText("Why did it fail?"))
  expect(screen.getByText("The upstream sync missed its window.")).toBeTruthy()
})
