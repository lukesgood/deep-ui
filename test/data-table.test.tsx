/** The table template's details, which are all the ones a screenshot cannot show.
 *
 *  A data table is the composition people reach for first and get wrong in the same
 *  four places every time: the sort lives on a `<th onClick>` that cannot be focused,
 *  the filter rewrites the table without saying so, twenty row menus are all called
 *  "Actions", and the pages are `<a href="#">` that go nowhere. Each of those is
 *  invisible unless you are the person it breaks for.
 */
import { afterEach, beforeEach, expect, test } from "vitest"
import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { DataTable } from "../templates/data-table"
import { Providers, installBrowserStubs } from "./cases"

afterEach(cleanup)
beforeEach(installBrowserStubs)

const show = () => render(<Providers><DataTable /></Providers>)

/** The header cell for a column, which is where `aria-sort` lives. */
function columnHeader(name: string) {
  return screen.getByRole("columnheader", { name: new RegExp(name) })
}

test("a sortable column is sorted by a button, not by a click on the cell", async () => {
  const user = userEvent.setup()
  show()

  // The control has to be reachable and operable from the keyboard. A <th onClick>
  // is neither, and announces as a column header that does nothing.
  const sortByName = within(columnHeader("Name")).getByRole("button", { name: "Name" })
  await user.click(sortByName)

  await waitFor(() =>
    expect(columnHeader("Name").getAttribute("aria-sort")).toBe("ascending")
  )
  // Only the sorted column says so. "none" on every other header is three more words
  // read out per column for no information.
  expect(columnHeader("Owner").getAttribute("aria-sort")).toBeNull()
  expect(columnHeader("Updated").getAttribute("aria-sort")).toBeNull()

  await user.click(sortByName)
  await waitFor(() =>
    expect(columnHeader("Name").getAttribute("aria-sort")).toBe("descending")
  )
})

test("sorting by a column actually reorders the rows", async () => {
  const user = userEvent.setup()
  show()

  await user.click(within(columnHeader("Name")).getByRole("button", { name: "Name" }))
  const first = () => screen.getAllByRole("rowheader")[0].textContent

  await waitFor(() => expect(first()).toBe("audit_log"))
  await user.click(within(columnHeader("Name")).getByRole("button", { name: "Name" }))
  await waitFor(() => expect(first()).toBe("users"))
})

test("the filter says how many rows are left", async () => {
  const user = userEvent.setup()
  show()

  const count = screen.getByRole("status")
  expect(count.textContent).toBe("10 datasets")

  await user.type(screen.getByLabelText("Filter by name"), "billing")

  // The count is the whole point: the table rewrites itself and a live region is the
  // only thing that says so out loud.
  await waitFor(() => expect(count.textContent).toBe("2 of 10 datasets"))
  expect(count.getAttribute("aria-live")).toBe("polite")
})

test("filtering to nothing explains itself instead of showing an empty table", async () => {
  const user = userEvent.setup()
  show()

  await user.type(screen.getByLabelText("Filter by name"), "zzz")

  await waitFor(() => expect(screen.queryByRole("table")).toBeNull())
  expect(screen.getByText("Nothing matches that")).toBeTruthy()
  expect(screen.getByRole("button", { name: "Clear filters" })).toBeTruthy()
})

test("filtering goes back to page one", async () => {
  const user = userEvent.setup()
  show()

  await user.click(screen.getByRole("button", { name: "Page 3" }))
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Page 3" }).getAttribute("aria-current")).toBe("page")
  )

  // Six matches is two pages. The filter has to put you back at the start of its own
  // results, not halfway down them.
  //
  // The obvious version of this test — filter down to a single page and check the
  // rows are there — passes with the reset deleted, because `Math.min(page, pages)`
  // clamps anyway. It took a two-page result to tell the two apart, which is the only
  // reason this assertion is worth anything.
  await user.type(screen.getByLabelText("Filter by name"), "i")

  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Page 1" }).getAttribute("aria-current")).toBe("page")
  )
  expect(screen.getByRole("status").textContent).toBe("6 of 10 datasets")
  expect(screen.queryByRole("button", { name: "Page 3" })).toBeNull()
})

test("each row's action button names its row", () => {
  show()

  const rows = screen.getAllByRole("rowheader").map((h) => h.textContent)
  for (const name of rows) {
    // Not "there is a button somewhere" — one named for this row. Twenty menus all
    // called "Actions" are twenty identical buttons.
    expect(screen.getByRole("button", { name: `Actions for ${name}` })).toBeTruthy()
  }
})

test("pages are buttons, because these pages have no URLs", () => {
  show()

  const nav = screen.getByRole("navigation", { name: "Pagination" })
  const controls = within(nav).getAllByRole("button")
  expect(controls.length).toBeGreaterThan(2)

  // An <a href="#"> that calls preventDefault announces as a link and offers to open
  // in a new tab. Neither is true here, so there are no links in this nav at all.
  expect(within(nav).queryAllByRole("link")).toEqual([])
})

test("the row's own name is a header for the row", () => {
  show()
  const headers = screen.getAllByRole("rowheader")
  expect(headers.length).toBeGreaterThan(0)
  for (const h of headers) expect(h.getAttribute("scope")).toBe("row")
})

test("dates are formatted by the browser and keep their machine-readable value", () => {
  show()
  const times = document.querySelectorAll("time[datetime]")
  expect(times.length).toBeGreaterThan(0)
  for (const t of times) {
    expect(t.getAttribute("datetime")).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    // Something a browser produced, not a string this file wrote out in English.
    expect(t.textContent?.trim()).toBeTruthy()
    expect(t.getAttribute("datetime")).not.toBe(t.textContent?.trim())
  }
})
