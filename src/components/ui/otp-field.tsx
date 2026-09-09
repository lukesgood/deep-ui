"use client"

import * as React from "react"
import { OTPField as OtpFieldPrimitive } from "@base-ui/react/otp-field"

import { cn } from "@/lib/utils"

/** One box per character, but a single value underneath — so paste fills the whole
 *  code, Backspace walks backwards across boxes, and autofill from an SMS reaches it.
 *  A row of separate `<input maxlength="1">` gets none of that.
 *
 *  The boxes are rendered from `length` when no children are given, so the count
 *  lives in one place. Pass children to lay them out yourself — a separator in the
 *  middle of a six-digit code, say — and the count is then yours to keep in step. */
function OtpField({
  className,
  length,
  children,
  ...props
}: OtpFieldPrimitive.Root.Props) {
  return (
    <OtpFieldPrimitive.Root
      data-slot="otp-field"
      length={length}
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    >
      {children ??
        Array.from({ length }, (_, i) => <OtpFieldInput key={i} />)}
    </OtpFieldPrimitive.Root>
  )
}

function OtpFieldInput({ className, ...props }: OtpFieldPrimitive.Input.Props) {
  return (
    <OtpFieldPrimitive.Input
      data-slot="otp-field-input"
      className={cn(
        "dp-num size-9 rounded-lg border border-input bg-transparent text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { OtpField, OtpFieldInput }
