"use client"

import { Meter as MeterPrimitive } from "@base-ui/react/meter"

import { cn } from "@/lib/utils"

/** A measurement inside a known range — disk used, quota consumed, rows against a
 *  limit. Not a Progress bar: progress is a task moving towards done and eventually
 *  disappears, a meter is a reading that just sits there. They carry different ARIA
 *  roles, and a screen reader treats them differently. */
function Meter({ className, ...props }: MeterPrimitive.Root.Props) {
  return (
    <MeterPrimitive.Root
      data-slot="meter"
      className={cn("flex w-full flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function MeterLabel({ className, ...props }: MeterPrimitive.Label.Props) {
  return (
    <MeterPrimitive.Label
      data-slot="meter-label"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function MeterValue({ className, ...props }: MeterPrimitive.Value.Props) {
  return (
    <MeterPrimitive.Value
      data-slot="meter-value"
      className={cn("dp-num text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function MeterTrack({ className, ...props }: MeterPrimitive.Track.Props) {
  return (
    <MeterPrimitive.Track
      data-slot="meter-track"
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <MeterPrimitive.Indicator
        data-slot="meter-indicator"
        className="h-full rounded-full bg-primary transition-all duration-200"
      />
    </MeterPrimitive.Track>
  )
}

export { Meter, MeterLabel, MeterTrack, MeterValue }
