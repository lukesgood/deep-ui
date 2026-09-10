"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { useStrings } from "@/lib/strings"
import { cn } from "@/lib/utils"

/** A password box with a reveal toggle.
 *
 *  Revealing matters: people mistype passwords they cannot see, and on a phone with
 *  autocorrect they mistype them a lot. Blocking paste, which some sites still do,
 *  breaks password managers and pushes people towards passwords they can remember.
 *  Neither is done here.
 *
 *  The details that are easy to get wrong and are the reason this is a component
 *  rather than an inline `useState`:
 *
 *  - the toggle is `type="button"`, so it does not submit the form it sits in
 *  - its label changes with the state, and `aria-pressed` reports that state, so it
 *    is not a button whose meaning only sighted users can infer from an icon
 *  - `aria-controls` points at the input, so the relationship is announced
 *  - `autoComplete` defaults to `current-password`; pass `new-password` on a
 *    sign-up or reset form or the manager will offer the old one
 */
function PasswordInput({
  className,
  autoComplete = "current-password",
  id,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const strings = useStrings()
  const [revealed, setRevealed] = React.useState(false)
  const generated = React.useId()
  const inputId = id ?? generated

  return (
    <div data-slot="password-input" className="relative">
      <Input
        id={inputId}
        type={revealed ? "text" : "password"}
        autoComplete={autoComplete}
        className={cn("pr-8", className)}
        {...props}
      />
      <button
        type="button"
        data-slot="password-input-toggle"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? strings["passwordInput.hide"] : strings["passwordInput.show"]}
        aria-pressed={revealed}
        aria-controls={inputId}
        className="absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {revealed ? (
          <EyeOffIcon className="size-4" />
        ) : (
          <EyeIcon className="size-4" />
        )}
      </button>
    </div>
  )
}

export { PasswordInput }
