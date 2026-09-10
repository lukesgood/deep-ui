"use client"

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { MinusIcon, PlusIcon } from "lucide-react"

import { useStrings } from "@/lib/strings"
import { cn } from "@/lib/utils"

/** A number input that behaves like one: arrow keys and the steppers move by `step`,
 *  the value is clamped to `min`/`max`, and the text is parsed with `Intl.NumberFormat`
 *  so a locale that groups with `.` does not silently become `NaN`.
 *
 *  `<input type="number">` gives you none of that reliably, and its spinners cannot be
 *  styled or reached from the keyboard on every platform. */
function NumberField({ className, ...props }: NumberFieldPrimitive.Root.Props) {
  return (
    <NumberFieldPrimitive.Root
      data-slot="number-field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function NumberFieldGroup({ className, ...props }: NumberFieldPrimitive.Group.Props) {
  const strings = useStrings()
  return (
    <NumberFieldPrimitive.Group
      data-slot="number-field-group"
      className={cn(
        "flex h-8 w-fit items-center rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-disabled:opacity-50 dark:bg-input/30",
        className
      )}
      {...props}
    >
      <NumberFieldPrimitive.Decrement
        data-slot="number-field-decrement"
        aria-label={strings["numberField.decrement"]}
        className="flex size-8 shrink-0 items-center justify-center rounded-l-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground disabled:pointer-events-none"
      >
        <MinusIcon className="size-3.5" />
      </NumberFieldPrimitive.Decrement>
      <NumberFieldPrimitive.Input
        data-slot="number-field-input"
        className="dp-num h-full w-16 border-x bg-transparent text-center text-sm outline-none"
      />
      <NumberFieldPrimitive.Increment
        data-slot="number-field-increment"
        aria-label={strings["numberField.increment"]}
        className="flex size-8 shrink-0 items-center justify-center rounded-r-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground disabled:pointer-events-none"
      >
        <PlusIcon className="size-3.5" />
      </NumberFieldPrimitive.Increment>
    </NumberFieldPrimitive.Group>
  )
}

export { NumberField, NumberFieldGroup }
