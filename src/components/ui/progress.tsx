"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "@/lib/utils"

/** Base UI puts `role="progressbar"` and the aria-value* attributes on the root, so
 *  a screen reader gets the number even though only a coloured bar is drawn. Pass
 *  `value={null}` for work of unknown length — it reports indeterminate rather than
 *  claiming a percentage nobody can back up. */
function Progress({ className, ...props }: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("flex w-full flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full rounded-full bg-primary transition-all duration-200 data-[indeterminate]:w-1/3 data-[indeterminate]:animate-pulse"
      />
    </ProgressPrimitive.Track>
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      data-slot="progress-label"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      className={cn("dp-num text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Progress, ProgressLabel, ProgressTrack, ProgressValue }
