"use client"

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"

/** A scroll container with the system's own scrollbar rather than the platform's.
 *
 *  What that buys, precisely: it looks the same on every OS, and it appears on
 *  **hover** — where the macOS overlay scrollbar appears only once you are already
 *  scrolling, which is too late to answer "can this pane scroll?". It is still
 *  hidden at rest; a permanently visible rail beside every list is its own noise.
 *
 *  Base UI unmounts the scrollbar entirely while the content does not overflow, and
 *  re-measures on scroll. That is right for a pane whose content is there from the
 *  start, and wrong for one that *grows* into being scrollable — see the note in
 *  components/ui/conversation.tsx before reaching for `keepMounted`.
 *
 *  The viewport stays a real scrolling element, so keyboard paging, wheel and
 *  scroll-into-view all behave normally. */
function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full overscroll-contain rounded-[inherit] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ScrollAreaPrimitive.Content data-slot="scroll-area-content">
          {children}
        </ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px opacity-0 transition-opacity duration-150 select-none data-hovering:opacity-100 data-scrolling:opacity-100",
        orientation === "vertical" && "h-full w-2",
        orientation === "horizontal" && "h-2 w-full flex-col",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-foreground/20"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
