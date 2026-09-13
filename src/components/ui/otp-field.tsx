"use client"

import { OTPField as OtpFieldPrimitive } from "@base-ui/react/otp-field"

import { format, useString } from "@/lib/strings"
import { cn } from "@/lib/utils"

/** One box per character, but a single value underneath — so paste fills the whole
 *  code, Backspace walks backwards across boxes, and autofill from an SMS reaches it.
 *  A row of separate `<input maxlength="1">` gets none of that.
 *
 *  The boxes are rendered from `length` when no children are given, so the count
 *  lives in one place. Pass children to lay them out yourself — a separator in the
 *  middle of a six-digit code, say — and the count is then yours to keep in step.
 *
 *  **Every box says where it is.** Six identical inputs with no names are six blanks
 *  to a screen reader: you can hear that you are in a text field, not which one of
 *  them, which for a code typed one character at a time is the only thing you need to
 *  know. Boxes two onward are labelled "Digit 3 of 6"; the first takes the field's
 *  own label, because Base UI routes it there and ignores `aria-label` on it. That
 *  split is right — arriving says what the field is, moving along says where you are.
 *
 *  Which means **the field still needs a label of its own**, the same as any input:
 *
 *      <Field name="code">
 *        <FieldLabel>Verification code</FieldLabel>
 *        <OtpField length={6} />
 *      </Field>
 *
 *  `index` and `length` are required on `OtpFieldInput` rather than defaulted, so a
 *  hand-laid-out row cannot quietly ship anonymous boxes — the type checker asks. */
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
        Array.from({ length }, (_, i) => (
          <OtpFieldInput key={i} index={i} length={length} />
        ))}
    </OtpFieldPrimitive.Root>
  )
}

function OtpFieldInput({
  className,
  index,
  length,
  "aria-label": ariaLabel,
  ...props
}: OtpFieldPrimitive.Input.Props & {
  /** Zero-based position of this box. Spoken as one-based. */
  index: number
  /** How many boxes there are in total, for "3 of 6". */
  length: number
}) {
  const digit = useString("otpField.digit")
  return (
    <OtpFieldPrimitive.Input
      data-slot="otp-field-input"
      // Base UI gives the *first* box the field's own label — from a `<Field.Label>`
      // or a `<label>` — and ignores `aria-label` there, with a warning. That is the
      // right split: arriving at the field should say what the field is, and moving
      // along it should say where you are. So position labels start at the second box.
      aria-label={
        index === 0 ? ariaLabel : ariaLabel ?? format(digit, { position: index + 1, length })
      }
      className={cn(
        "dp-num size-9 rounded-lg border border-input bg-transparent text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { OtpField, OtpFieldInput }
