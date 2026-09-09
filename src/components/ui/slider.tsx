"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

/** Pass an array to `value`/`defaultValue` for a range; Base UI renders a thumb per
 *  entry, so `<SliderThumb />` once is enough either way. */
function Slider({ className, ...props }: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    />
  )
}

function SliderLabel({ className, ...props }: SliderPrimitive.Label.Props) {
  return (
    <SliderPrimitive.Label
      data-slot="slider-label"
      className={cn("text-sm leading-none font-medium select-none", className)}
      {...props}
    />
  )
}

function SliderValue({ className, ...props }: SliderPrimitive.Value.Props) {
  return (
    <SliderPrimitive.Value
      data-slot="slider-value"
      className={cn("dp-num text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

/** The control is padded well beyond the visible rail: a 6px track is a miserable
 *  pointer target, and the touch guidance is 24px. */
function SliderTrack({ className, ...props }: SliderPrimitive.Track.Props) {
  return (
    <SliderPrimitive.Control
      data-slot="slider-control"
      className="flex w-full touch-none items-center py-2 select-none"
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn("h-1.5 w-full rounded-full bg-muted select-none", className)}
        {...props}
      >
        <SliderPrimitive.Indicator
          data-slot="slider-indicator"
          className="rounded-full bg-primary select-none"
        />
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          className="size-4 rounded-full border border-primary bg-background shadow-sm transition-[box-shadow] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:opacity-50"
        />
      </SliderPrimitive.Track>
    </SliderPrimitive.Control>
  )
}

export { Slider, SliderLabel, SliderTrack, SliderValue }
