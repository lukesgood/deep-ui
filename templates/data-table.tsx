"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown, Database, MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList,
} from "@/components/ui/combobox"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/ui/error-box"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { useConfirm } from "@/lib/confirm"
import { useToast } from "@/lib/toast"

/** A table of things, with the three controls a table of things always grows: a
 *  filter, a sort, and pages.
 *
 *  The composition is the easy part. What this template is really for is the handful
 *  of details that separate a table anyone can use from one that only works if you
 *  can see it — every one of which is invisible in a screenshot:
 *
 *  **Sorting lives in a button, and the column says which way it is sorted.** The
 *  `<th>` carries `aria-sort`; the clickable thing inside it is a real `<button>`.
 *  A `<th onClick>` is not focusable, not operable from the keyboard, and announces
 *  as a column header with no hint that it does anything.
 *
 *  **The filter says what it did.** Typing into a filter silently rewrites the table
 *  below it. Someone who cannot see that happen needs to be told, so the result count
 *  is a live region — the one thing most filtered tables leave out.
 *
 *  **Every row's action button names its row.** Twenty menus all called "Actions" is
 *  twenty identical buttons; the name has to carry which row it belongs to.
 *
 *  **Pages are buttons, because these pages have no URLs.** `PaginationLink` renders
 *  an `<a>` by default and takes `render={<button type="button" />}` for the
 *  client-side case. An `<a href="#">` that calls `preventDefault` announces as a
 *  link and offers to open in a new tab, and neither is true.
 *
 *  **Dates are formatted by the browser.** `Intl` plus `<time dateTime>`, so the
 *  reader gets their own conventions and the machine-readable value is still there.
 */

type Dataset = {
  name: string
  owner: string
  status: "healthy" | "degraded" | "stale"
  rows: number
  updated: string
}

const DATASETS: Dataset[] = [
  { name: "events_raw", owner: "platform", status: "healthy", rows: 412_889_002, updated: "2026-09-14T09:40:00Z" },
  { name: "events_clean", owner: "platform", status: "healthy", rows: 402_118_740, updated: "2026-09-14T10:05:00Z" },
  { name: "audit_log", owner: "platform", status: "healthy", rows: 96_442_100, updated: "2026-09-14T06:30:00Z" },
  { name: "users", owner: "growth", status: "healthy", rows: 2_940_551, updated: "2026-09-13T06:00:00Z" },
  { name: "billing_invoices", owner: "finance", status: "healthy", rows: 1_204_884, updated: "2026-09-12T01:15:00Z" },
  { name: "sessions", owner: "growth", status: "degraded", rows: 18_204_113, updated: "2026-09-09T09:05:00Z" },
  { name: "support_tickets", owner: "support", status: "healthy", rows: 331_902, updated: "2026-09-04T17:45:00Z" },
  { name: "feature_flags", owner: "platform", status: "healthy", rows: 1_882, updated: "2026-08-28T11:20:00Z" },
  { name: "billing_line_items", owner: "finance", status: "stale", rows: 8_771_240, updated: "2026-07-30T01:15:00Z" },
  { name: "experiments", owner: "growth", status: "stale", rows: 44_120, updated: "2026-06-19T14:00:00Z" },
]

const OWNERS = ["platform", "growth", "finance", "support"]
const PAGE_SIZE = 4

type SortKey = "name" | "rows" | "updated"
type Direction = "ascending" | "descending"

const TONE: Record<Dataset["status"], string> = {
  healthy: "border-[var(--dp-good)]/30 bg-[var(--dp-good)]/10 text-[var(--dp-good-text)]",
  degraded: "border-[var(--dp-warn)]/30 bg-[var(--dp-warn)]/10 text-[var(--dp-warn-text)]",
  stale: "border-border bg-muted text-muted-foreground",
}

export function DataTable() {
  const { toast } = useToast()
  const confirm = useConfirm()

  const [query, setQuery] = React.useState("")
  const [owner, setOwner] = React.useState<string | null>(null)
  const [sort, setSort] = React.useState<{ key: SortKey; direction: Direction }>({
    key: "updated",
    direction: "descending",
  })
  const [page, setPage] = React.useState(1)

  // Any change to what is being shown starts again from page one. Staying on page 3
  // of a result set that now has one page is how a filter appears to return nothing.
  function refine<T>(set: (v: T) => void) {
    return (value: T) => {
      set(value)
      setPage(1)
    }
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = DATASETS.filter(
      (d) => (!q || d.name.toLowerCase().includes(q)) && (!owner || d.owner === owner)
    )
    const sign = sort.direction === "ascending" ? 1 : -1
    return [...rows].sort((a, b) => {
      if (sort.key === "rows") return (a.rows - b.rows) * sign
      return String(a[sort.key]).localeCompare(String(b[sort.key])) * sign
    })
  }, [query, owner, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, direction: s.direction === "ascending" ? "descending" : "ascending" }
        : { key, direction: key === "name" ? "ascending" : "descending" }
    )
    setPage(1)
  }

  async function remove(dataset: Dataset) {
    const ok = await confirm({
      title: `Delete ${dataset.name}?`,
      message: "The table and everything in it goes. This cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (ok) toast(`${dataset.name} deleted`, "success")
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Datasets</h1>
        {/* Not "everything you have access to". This template has no idea who is
            looking at it — `owner` is a column you can filter by, not a boundary —
            and copy that implies a permission check nothing performs is the kind of
            sentence somebody takes at face value. See SECURITY.md. */}
        <p className="text-sm text-muted-foreground">
          Every dataset in this workspace.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-64 space-y-1.5">
          <Label htmlFor="dataset-filter">Filter by name</Label>
          <Input
            id="dataset-filter"
            value={query}
            onChange={(e) => refine(setQuery)(e.target.value)}
            placeholder="events"
            // `search` gets the clear affordance and the right on-screen keyboard.
            type="search"
          />
        </div>

        <div className="min-w-48 space-y-1.5">
          <Label htmlFor="dataset-owner">Owner</Label>
          <Combobox
            items={OWNERS}
            value={owner}
            onValueChange={(v) => refine(setOwner)(v as string | null)}
          >
            <ComboboxInput id="dataset-owner" placeholder="Anyone" />
            <ComboboxContent>
              <ComboboxEmpty>No team by that name.</ComboboxEmpty>
              <ComboboxList>
                {OWNERS.map((o) => (
                  <ComboboxItem key={o} value={o}>{o}</ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        {(query || owner) && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery("")
              setOwner(null)
              setPage(1)
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* The count, out loud. A filter that quietly rewrites the table below it tells
          a sighted reader everything and a screen-reader user nothing. `polite`, so
          it waits for a pause rather than interrupting every keystroke. */}
      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
        {filtered.length === DATASETS.length
          ? `${DATASETS.length} datasets`
          : `${filtered.length} of ${DATASETS.length} datasets`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Database}
          title="Nothing matches that"
          hint="Try a shorter name, or clear the owner filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("")
                setOwner(null)
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <Table>
            <TableCaption>
              Datasets, {sortedBy(sort)}. Page {current} of {pages}.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <SortableHead label="Name" sortKey="name" sort={sort} onSort={toggleSort} />
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <SortableHead
                  label="Rows"
                  sortKey="rows"
                  sort={sort}
                  onSort={toggleSort}
                  className="text-end"
                />
                <SortableHead label="Updated" sortKey="updated" sort={sort} onSort={toggleSort} />
                <TableHead>
                  {/* The column exists for layout; naming it "Actions" out loud on
                      every row is noise, so the name lives on each button instead. */}
                  <span className="sr-only">Row actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((d) => (
                <TableRow key={d.name}>
                  {/* The name identifies the row, so it is a header for it. */}
                  <TableHead scope="row" className="font-mono font-normal">
                    {d.name}
                  </TableHead>
                  <TableCell className="text-muted-foreground">{d.owner}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={TONE[d.status]}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="dp-num text-end tabular-nums">
                    {d.rows.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <RelativeDate iso={d.updated} />
                  </TableCell>
                  <TableCell className="text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                        aria-label={`Actions for ${d.name}`}
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>{d.name}</DropdownMenuLabel>
                          <DropdownMenuItem>Open</DropdownMenuItem>
                          <DropdownMenuItem>Copy path</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => remove(d)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pages > 1 && (
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  {/* `disabled` belongs on the element being rendered, not on
                      PaginationLink — it renders an <a> by default, and an anchor
                      has no disabled state to set. */}
                  <PaginationPrevious
                    render={<button type="button" disabled={current === 1} />}
                    onClick={() => setPage(current - 1)}
                  />
                </PaginationItem>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      render={<button type="button" />}
                      isActive={n === current}
                      aria-label={`Page ${n}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    render={<button type="button" disabled={current === pages} />}
                    onClick={() => setPage(current + 1)}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </main>
  )
}

function sortedBy(sort: { key: SortKey; direction: Direction }) {
  const word = sort.direction === "ascending" ? "ascending" : "descending"
  return `sorted by ${sort.key === "rows" ? "row count" : sort.key}, ${word}`
}

/** A column header you can sort by.
 *
 *  `aria-sort` goes on the `<th>` — it describes the column, not the control — and
 *  only the sorted one carries it; "none" on every other column is three extra words
 *  read out per header for no information. The button inside is what takes focus. */
function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  className = "",
}: {
  label: string
  sortKey: SortKey
  sort: { key: SortKey; direction: Direction }
  onSort: (key: SortKey) => void
  className?: string
}) {
  const active = sort.key === sortKey
  const Icon = !active ? ChevronsUpDown : sort.direction === "ascending" ? ArrowUp : ArrowDown

  return (
    <TableHead aria-sort={active ? sort.direction : undefined} className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2 h-7 gap-1 px-2 font-medium"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <Icon
          className={`size-3 ${active ? "text-foreground" : "text-muted-foreground/50"}`}
          aria-hidden="true"
        />
      </Button>
    </TableHead>
  )
}

/** "2 days ago", with the exact timestamp underneath for anyone who needs it.
 *
 *  Both halves come from `Intl`, so a reader in Seoul gets "2일 전" and their own date
 *  format without this file knowing anything about it. The `<time dateTime>` keeps the
 *  machine-readable value regardless of what the words say. */
function RelativeDate({ iso }: { iso: string }) {
  const date = new Date(iso)
  // Fixed only so the sample rows above read sensibly and the tests stay still. In a
  // real table this is `new Date()`.
  const [now] = React.useState(() => new Date("2026-09-14T12:00:00Z"))

  const days = Math.round((date.getTime() - now.getTime()) / 86_400_000)
  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  const exact = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })

  return (
    <time dateTime={iso} title={exact.format(date)}>
      {Math.abs(days) < 1
        ? relative.format(Math.round((date.getTime() - now.getTime()) / 3_600_000), "hour")
        : relative.format(days, "day")}
    </time>
  )
}
