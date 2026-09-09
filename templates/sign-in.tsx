"use client"

import * as React from "react"
import { Database } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field, FieldControl, FieldDescription, FieldError, FieldLabel, Form,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OtpField } from "@/components/ui/otp-field"
import { PasswordInput } from "@/components/ui/password-input"
import { Separator } from "@/components/ui/separator"

/** Sign in, with the second factor as a second step rather than a second screen.
 *
 *  A template, not a primitive: copy it and change everything. What is worth keeping
 *  is the wiring, which is the part that is invisible when it is right and expensive
 *  when it is wrong:
 *
 *  - both fields are `<Field>`s, so the error is announced and tied to the control
 *    rather than being red text sitting near it
 *  - validation is the browser's (`type="email" required`) and only the wording is
 *    ours, one `<FieldError match="...">` per case. Writing a custom `validate`
 *    instead looks like it works and does not: native validation fails first, so the
 *    custom one never runs and the user reads "Constraints not satisfied"
 *  - the password box gets `autoComplete="current-password"`; on a sign-up or reset
 *    screen change it to `new-password` or the manager offers the old one
 *  - the code step is one `<OtpField>`, so a pasted or SMS-autofilled code lands in
 *    every box at once
 *  - the heading is an `<h1>` and the form is reachable in one tab from the top
 *
 *  Deliberately absent: a social-provider row, because that is your identity
 *  provider's business, and a "forgot password" flow, because it is its own screen.
 */
export function SignIn({ onSignedIn }: { onSignedIn?: () => void }) {
  const [step, setStep] = React.useState<"credentials" | "code">("credentials")
  const [remember, setRemember] = React.useState(true)

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="dp-gradient grid size-10 place-items-center rounded-xl">
            <Database className="size-5 text-white" />
          </div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Sign in to Deep
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "credentials"
              ? "Use the account your workspace was created with."
              : "Enter the six-digit code from your authenticator."}
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            {step === "credentials" ? (
              <Form
                onSubmit={(event) => {
                  event.preventDefault()
                  setStep("code")
                }}
              >
                {/* The browser already knows what a malformed email looks like, so
                    the constraint is `type="email" required` and the only thing left
                    to supply is wording. A `<FieldError match="...">` per case does
                    that; a custom `validate` would not even run here, because native
                    validation fails first and the user would read the browser's
                    "Constraints not satisfied". */}
                <Field name="email" validationMode="onBlur">
                  <FieldLabel>Email</FieldLabel>
                  <FieldControl
                    render={
                      <Input type="email" required autoComplete="username" placeholder="you@example.com" />
                    }
                  />
                  <FieldError match="valueMissing">Enter your email address.</FieldError>
                  <FieldError match="typeMismatch">
                    That does not look like an email address.
                  </FieldError>
                </Field>

                <Field name="password" validationMode="onBlur">
                  <FieldLabel>Password</FieldLabel>
                  <FieldControl render={<PasswordInput required autoComplete="current-password" />} />
                  <FieldError match="valueMissing">Enter your password.</FieldError>
                </Field>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" checked={remember} onCheckedChange={setRemember} />
                    <Label htmlFor="remember" className="text-sm font-normal">
                      Keep me signed in
                    </Label>
                  </div>
                  <Button variant="link" size="sm" className="px-0" type="button">
                    Forgot password?
                  </Button>
                </div>

                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </Form>
            ) : (
              <Form
                onSubmit={(event) => {
                  event.preventDefault()
                  onSignedIn?.()
                }}
              >
                <Field name="code">
                  <FieldLabel>Verification code</FieldLabel>
                  <FieldControl render={<OtpField length={6} />} />
                  <FieldDescription>
                    Paste it — the whole code lands at once.
                  </FieldDescription>
                </Field>
                <Button type="submit" className="w-full">
                  Sign in
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("credentials")}
                >
                  Use a different account
                </Button>
              </Form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Separator />
          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to the terms. This is a template — it does not
            authenticate anything.
          </p>
        </div>
      </div>
    </main>
  )
}
