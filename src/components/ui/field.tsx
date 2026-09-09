"use client"

import { Field as FieldPrimitive } from "@base-ui/react/field"
import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset"
import { Form as FormPrimitive } from "@base-ui/react/form"

import { cn } from "@/lib/utils"

/** The wrapper the rest of the form controls were missing.
 *
 *  Without it every screen reinvents the same four-part arrangement — label,
 *  control, hint, error — and gets the wiring subtly wrong: the description not
 *  referenced by `aria-describedby`, the error announced only in colour, the label
 *  a `<div>` that does not focus the input when clicked.
 *
 *  Base UI's Field does that plumbing. This file only dresses it, and adds the one
 *  rule the design system has an opinion about: an error is red text *and* an
 *  `aria-invalid` control, never colour alone.
 *
 *      <Field name="email" validate={(v) => (v ? null : "Required")}>
 *        <FieldLabel>Email</FieldLabel>
 *        <FieldControl render={<Input />} />
 *        <FieldDescription>We only use this for alerts.</FieldDescription>
 *        <FieldError />
 *      </Field>
 */
function Field({ className, ...props }: FieldPrimitive.Root.Props) {
  return (
    <FieldPrimitive.Root
      data-slot="field"
      className={cn("group/field flex w-full flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none",
        "group-has-disabled/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

/** Renders whatever control you pass to `render`, wired to the label and to
 *  `aria-describedby` for you: `<FieldControl render={<Input />} />`. */
function FieldControl({ className, ...props }: FieldPrimitive.Control.Props) {
  return (
    <FieldPrimitive.Control data-slot="field-control" className={cn(className)} {...props} />
  )
}

function FieldDescription({ className, ...props }: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

/** Shown only when the field is actually invalid. Colour is the *second* signal —
 *  Base UI marks the control `aria-invalid`, which is what a screen reader reads,
 *  and this text is associated with it. `--dp-bad-text` rather than `--dp-bad`
 *  because these are words. */
function FieldError({ className, ...props }: FieldPrimitive.Error.Props) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={cn("text-xs text-[var(--dp-bad-text)]", className)}
      {...props}
    />
  )
}

/** A group of related fields — Base UI points the legend at the group with
 *  `aria-labelledby`, so it is announced when focus enters. */
function Fieldset({ className, ...props }: FieldsetPrimitive.Root.Props) {
  return (
    <FieldsetPrimitive.Root
      data-slot="fieldset"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function FieldsetLegend({ className, ...props }: FieldsetPrimitive.Legend.Props) {
  return (
    <FieldsetPrimitive.Legend
      data-slot="fieldset-legend"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

/** Collects the fields below it. Pass `errors` to surface server-side validation
 *  against the right field instead of in a banner nobody can act on. */
function Form({ className, ...props }: FormPrimitive.Props) {
  return (
    <FormPrimitive
      data-slot="form"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

export {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
  Form,
}
