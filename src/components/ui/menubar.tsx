"use client"

import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar"

import { cn } from "@/lib/utils"

/** The File / Edit / View strip. Holds a row of `DropdownMenu`s and coordinates them,
 *  so once one is open the others open on hover and arrow keys move between them.
 *
 *  Compose it with the `dropdown-menu` parts — `DropdownMenu`, `DropdownMenuTrigger`,
 *  `DropdownMenuContent` — rather than a parallel set of Menubar* wrappers. */
function Menubar({ className, ...props }: MenubarPrimitive.Props) {
  return (
    <MenubarPrimitive
      data-slot="menubar"
      className={cn(
        "flex w-fit items-center gap-0.5 rounded-lg border bg-card p-0.5",
        className
      )}
      {...props}
    />
  )
}

export { Menubar }
