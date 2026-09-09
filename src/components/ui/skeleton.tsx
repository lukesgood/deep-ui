import { cn } from "@/lib/utils"

/** Loading placeholder.
 *
 *  `aria-hidden`, because a row of grey rectangles is a picture of loading, not
 *  information — without it a screen reader walks a handful of empty elements and
 *  reports nothing useful. Say that the wait is happening on the region instead:
 *  `aria-busy={loading}` on whatever the skeletons are standing in for.
 *
 *  Filled with `foreground/10` rather than a fixed surface token: a skeleton has to
 *  read against whatever it sits on — a card, a muted panel, or the page background —
 *  in both light and dark themes.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-foreground/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
