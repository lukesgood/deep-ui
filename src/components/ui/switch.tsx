"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

/** The thumb is positioned, not translated.
 *
 *  `translate-x` moves toward the right in both directions, so under `dir="rtl"` the
 *  thumb travelled the wrong way and overshot its track. Flipping the sign — with a
 *  `ltr:`/`rtl:` variant pair, and again with a `--dp-flip` multiplier — changed
 *  `--tw-translate-x` and moved nothing.
 *
 *  `inset-inline-start` has no such problem: it *is* the logical property, so the
 *  browser resolves it against the writing direction and there is no sign to get
 *  wrong. It animates as well as a transform would.
 *
 *  The distances are the track's content box minus the thumb: 32px − 2px border −
 *  16px thumb = 14px, and 24 − 2 − 12 = 10px for the small one. */
function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none absolute top-1/2 block -translate-y-1/2 rounded-full bg-background ring-0 transition-[inset-inline-start] duration-150 start-0 group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:start-[14px] group-data-[size=sm]/switch:data-checked:start-[10px] dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
