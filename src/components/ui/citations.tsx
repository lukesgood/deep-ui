"use client"

import * as React from "react"
import { FileText } from "lucide-react"

import { useString } from "@/lib/strings"
import { cn } from "@/lib/utils"

/** The other half of the `[1]` markers the Markdown renderer emits.
 *
 *  A citation badge with nothing behind it is worse than no citation: it looks like
 *  a claim has a source without ever showing what it is. This is the list those
 *  numbers point at.
 *
 *  Sources are shown, never linked. The prose and the URLs both come out of
 *  ingested documents, so turning them into anchors makes the panel a place someone
 *  else chooses where your reader lands — the same reason `lib/markdown.ts` refuses
 *  to build anchors. Show the label and the location as text and let a person
 *  decide.
 */
function Citations({
  className,
  label,
  children,
  ...props
}: React.ComponentProps<"section"> & { label?: string }) {
  const heading = useString("citations.label", label)
  return (
    <section
      data-slot="citations"
      aria-label={heading}
      className={cn("space-y-1.5", className)}
      {...props}
    >
      <h3 className="text-2xs font-medium tracking-widest text-muted-foreground uppercase">
        {heading}
      </h3>
      <ol className="space-y-1">{children}</ol>
    </section>
  )
}

function Citation({
  index,
  title,
  location,
  className,
  ...props
}: Omit<React.ComponentProps<"li">, "title"> & {
  /** The number shown in the answer. Given explicitly rather than derived from
   *  position, so a filtered list still matches the markers in the text. */
  index: number
  title: string
  location?: string
}) {
  return (
    <li
      data-slot="citation"
      id={`citation-${index}`}
      className={cn(
        "flex scroll-mt-4 items-start gap-2 rounded-md border bg-card px-2 py-1.5 target:ring-2 target:ring-ring",
        className
      )}
      {...props}
    >
      <span className="dp-num mt-px inline-flex size-4 shrink-0 items-center justify-center rounded bg-primary/10 text-2xs font-semibold text-primary">
        {index}
      </span>
      <span className="min-w-0 flex-1">
        {/* `title` because the text is clipped: a source nobody can read the
            name of is not a citation. */}
        <span dir="auto" title={title} className="block truncate text-xs font-medium">
          {title}
        </span>
        {location && (
          <span className="mt-0.5 flex items-center gap-1 text-2xs text-muted-foreground">
            <FileText className="size-3 shrink-0" />
            <span dir="auto" title={location} className="truncate">
              {location}
            </span>
          </span>
        )}
      </span>
    </li>
  )
}

export { Citation, Citations }
