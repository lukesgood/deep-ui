"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { useString, useStrings } from "@/lib/strings"
import { cn } from "@/lib/utils"

/** Page navigation. The only primitive here with no Base UI counterpart, because
 *  there is no behaviour to abstract — it is a `<nav>` of links, and the whole job is
 *  getting the semantics right:
 *
 *  - a labelled `<nav>`, so it is reachable as a landmark and distinguishable from
 *    any other list of numbers on the page
 *  - `aria-current="page"` on the active one, which is what actually announces where
 *    you are; the highlight alone says nothing
 *  - the ellipsis is `aria-hidden`, since "…" read aloud between page numbers is noise
 *
 *  Render the items as links where the pages have URLs — a paginated list that cannot
 *  be linked to or opened in a new tab is a worse list. */
function Pagination({
  className,
  label,
  ...props
}: React.ComponentProps<"nav"> & { label?: string }) {
  return (
    <nav
      data-slot="pagination"
      role="navigation"
      aria-label={useString("pagination.label", label)}
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

function PaginationLink({
  className,
  isActive,
  size = "icon-sm",
  ...props
}: React.ComponentProps<"a"> & {
  isActive?: boolean
  size?: React.ComponentProps<typeof Button>["size"]
}) {
  return (
    <a
      data-slot="pagination-link"
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
      className={cn(
        buttonVariants({ variant: isActive ? "outline" : "ghost", size }),
        "dp-num cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  const strings = useStrings()
  return (
    <PaginationLink
      aria-label={strings["pagination.previousLabel"]}
      size="sm"
      className={cn("gap-1 px-2", className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
      <span className="hidden sm:inline">{strings["pagination.previous"]}</span>
    </PaginationLink>
  )
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  const strings = useStrings()
  return (
    <PaginationLink
      aria-label={strings["pagination.nextLabel"]}
      size="sm"
      className={cn("gap-1 px-2", className)}
      {...props}
    >
      <span className="hidden sm:inline">{strings["pagination.next"]}</span>
      <ChevronRightIcon className="size-4" />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      aria-hidden="true"
      className={cn("flex size-7 items-center justify-center text-muted-foreground", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
