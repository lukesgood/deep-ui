import { cn } from "@/lib/utils"

/** Loading placeholder.
 *
 *  Filled with `foreground/10` rather than a fixed surface token: a skeleton has to
 *  read against whatever it sits on — a card, a muted panel, or the page background —
 *  in both light and dark themes.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-xl bg-foreground/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
