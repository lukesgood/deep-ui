"use client"

import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"

import { cn } from "@/lib/utils"

/** A row of Toggles that share a value, with roving focus — one tab stop for the
 *  group and arrow keys between the buttons, rather than a tab stop each.
 *
 *  Set `multiple` for a multi-select group. */
function ToggleGroup({ className, ...props }: ToggleGroupPrimitive.Props) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn(
        "flex w-fit items-center gap-0.5 rounded-lg border bg-card p-0.5",
        className
      )}
      {...props}
    />
  )
}

export { ToggleGroup }
