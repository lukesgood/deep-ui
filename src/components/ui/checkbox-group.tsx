"use client"

import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group"

import { cn } from "@/lib/utils"

/** Holds the value for a set of related checkboxes, and — the part worth having —
 *  drives a parent checkbox's indeterminate state from its children. Give the parent
 *  `parent` and list every child name in `allValues`. */
function CheckboxGroup({ className, ...props }: CheckboxGroupPrimitive.Props) {
  return (
    <CheckboxGroupPrimitive
      data-slot="checkbox-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

export { CheckboxGroup }
