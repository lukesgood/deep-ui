import { afterEach, expect, test } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"

import { Button } from "@/components/ui/button"
import { Markdown } from "@/components/ui/markdown"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"

afterEach(cleanup)

/* Findings from the README's audit list, each closed and pinned shut. */

test("a tooltip describes the control it is attached to", () => {
  render(
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger render={<Button />}>Copy</TooltipTrigger>
        <TooltipContent>Copies the answer to the clipboard</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
  const trigger = screen.getByRole("button", { name: "Copy" })
  const popup = screen.getByRole("tooltip")

  // Previously: no role, no id, no association — the text was simply never read.
  expect(popup.id).toBeTruthy()
  expect(trigger.getAttribute("aria-describedby")).toBe(popup.id)
  expect(popup.textContent).toBe("Copies the answer to the clipboard")
})

test("a closed tooltip leaves no description pointing at nothing", () => {
  render(
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button />}>Copy</TooltipTrigger>
        <TooltipContent>Copies the answer</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
  expect(screen.getByRole("button", { name: "Copy" }).getAttribute("aria-describedby")).toBeNull()
})

test("markdown headings are headings, so an answer can be navigated", () => {
  render(<Markdown text={"# One\n\n## Two\n\n### Three"} />)
  // A model's `#` is a heading inside the answer, not the page's h1.
  expect(screen.getByRole("heading", { level: 3, name: "One" })).toBeTruthy()
  expect(screen.getByRole("heading", { level: 4, name: "Two" })).toBeTruthy()
  expect(screen.getByRole("heading", { level: 5, name: "Three" })).toBeTruthy()
})

test("the base heading level moves the whole outline", () => {
  render(<Markdown text="# One" baseHeadingLevel={2} />)
  expect(screen.getByRole("heading", { level: 2, name: "One" })).toBeTruthy()
})

test("headings never run past h6", () => {
  render(<Markdown text={"#### Four"} baseHeadingLevel={5} />)
  expect(screen.getByRole("heading", { level: 6, name: "Four" })).toBeTruthy()
})

test("a skeleton is decoration, not empty content", () => {
  const { container } = render(<Skeleton className="h-4 w-24" />)
  expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true")
})

test("column headers say they are column headers", () => {
  render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dataset</TableHead>
          <TableHead scope="row">Rows</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow><TableCell>events_raw</TableCell><TableCell>1</TableCell></TableRow>
      </TableBody>
    </Table>
  )
  expect(screen.getByText("Dataset").getAttribute("scope")).toBe("col")
  // and the default is overridable, for tables that also label rows
  expect(screen.getByText("Rows").getAttribute("scope")).toBe("row")
})
