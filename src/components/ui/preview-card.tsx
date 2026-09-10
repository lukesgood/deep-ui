"use client"

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"

import { cn } from "@/lib/utils"

/** The card that appears when you hover a reference — a dataset name, a person, a
 *  run id — showing enough that you do not have to navigate away to find out what it
 *  is.
 *
 *  It opens on hover *and* on keyboard focus, and it is not a tooltip: put real
 *  content in it, including things worth reading slowly. Anything essential must also
 *  exist somewhere that does not require hovering. */
const PreviewCard = PreviewCardPrimitive.Root

function PreviewCardTrigger({ ...props }: PreviewCardPrimitive.Trigger.Props) {
  return <PreviewCardPrimitive.Trigger data-slot="preview-card-trigger" {...props} />
}

function PreviewCardContent({
  className,
  side = "top",
  sideOffset = 6,
  align = "center",
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<PreviewCardPrimitive.Positioner.Props, "side" | "sideOffset" | "align">) {
  return (
    <PreviewCardPrimitive.Portal>
      <PreviewCardPrimitive.Positioner
        className="isolate z-[var(--dp-z-popover)] outline-none"
        side={side}
        sideOffset={sideOffset}
        align={align}
      >
        <PreviewCardPrimitive.Popup
          data-slot="preview-card-content"
          className={cn(
            "dp-elevated w-64 max-w-(--available-width) origin-(--transform-origin) rounded-lg bg-popover p-3 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { PreviewCard, PreviewCardContent, PreviewCardTrigger }
