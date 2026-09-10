"use client"

import * as React from "react"
import {
  ArrowLeft, Database, Fingerprint, KeyRound, Loader2, Mail, MailCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field, FieldControl, FieldDescription, FieldError, FieldLabel, Form,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OtpField } from "@/components/ui/otp-field"
import { PasswordInput } from "@/components/ui/password-input"
import { Separator } from "@/components/ui/separator"

/** Sign in — passkey first, then a password or a link in the post.
 *
 *  A template, not a primitive: copy it and change everything. What is worth keeping
 *  is the wiring, which is invisible when it is right and expensive when it is wrong.
 *
 *  **Three methods, in the order they deserve.** A passkey is the fastest and the
 *  hardest to phish, so it leads. A password still has to be there. A sign-in link
 *  is the escape hatch for someone on a borrowed machine, and it is the only one of
 *  the three whose "success" happens somewhere else — which is why it gets a whole
 *  screen rather than a toast.
 *
 *  **Validation is the browser's; only the wording is ours.** `type="email" required`
 *  already knows what a malformed address looks like. A custom `validate` alongside
 *  it looks like it works and does not — native validation fails first, so the custom
 *  one never runs and the reader gets "Constraints not satisfied". One
 *  `<FieldError match="...">` per case is the fix.
 *
 *  **Every step change moves focus.** Swapping the card's contents without moving
 *  focus leaves a keyboard or screen-reader user on a button that no longer exists,
 *  reading nothing. Each step takes focus on its heading and announces itself.
 */

type Step = "identify" | "passkey" | "password" | "code" | "link-sent"

const RESEND_SECONDS = 30

export function SignIn({ onSignedIn }: { onSignedIn?: () => void }) {
  const [step, setStep] = React.useState<Step>("identify")
  const [email, setEmail] = React.useState("")
  const [remember, setRemember] = React.useState(true)
  const headingRef = React.useRef<HTMLHeadingElement>(null)
  const firstStep = React.useRef(true)

  // Focus follows the step, except on first paint — stealing focus from a page
  // someone just opened is its own rudeness.
  React.useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      {/* The one aqua current, running under the surface. Decorative, so it is
          hidden from assistive technology and it is the only thing here that is. */}
      <div
        aria-hidden="true"
        className="dp-gradient pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full opacity-15 blur-3xl dark:opacity-25"
      />

      {/* `relative` rather than a z-index on the blob: both are positioned, so
          source order alone decides, and the stacking ladder stays for overlays. */}
      <div className="relative w-full max-w-sm space-y-6">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="dp-elevated dp-gradient grid size-11 place-items-center rounded-2xl">
            <Database className="size-5 text-white" />
          </div>
          <div className="space-y-1">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="font-heading text-xl font-semibold tracking-tight outline-none"
            >
              {step === "link-sent" ? (
                "Check your inbox"
              ) : (
                <>
                  Sign in to <span className="dp-gradient-text">Deep</span>
                </>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">{SUBTITLES[step](email)}</p>
          </div>
        </header>

        <Card className="dp-elevated">
          <CardContent className="p-5">
            {step === "identify" && (
              <Identify
                email={email}
                onEmailChange={setEmail}
                remember={remember}
                onRememberChange={setRemember}
                onPasskey={() => setStep("passkey")}
                onPassword={() => setStep("password")}
                onMagicLink={() => setStep("link-sent")}
              />
            )}
            {step === "passkey" && (
              <Passkey onCancel={() => setStep("identify")} onDone={() => setStep("code")} />
            )}
            {step === "password" && (
              <Password onBack={() => setStep("identify")} onDone={() => setStep("code")} />
            )}
            {step === "code" && (
              <Code onBack={() => setStep("identify")} onDone={() => onSignedIn?.()} />
            )}
            {step === "link-sent" && (
              <LinkSent onBack={() => setStep("identify")} />
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          This is a template. It does not authenticate anything.
        </p>
      </div>
    </main>
  )
}

const SUBTITLES: Record<Step, (email: string) => string> = {
  identify: () => "Use a passkey, or the account your workspace was created with.",
  passkey: () => "Confirm with the device you registered.",
  password: () => "Enter the password for this account.",
  code: () => "Enter the six-digit code from your authenticator.",
  "link-sent": (email) => `We sent a sign-in link to ${email || "your address"}.`,
}

/* ── step one: who are you ────────────────────────────────────────────────── */

function Identify({
  email,
  onEmailChange,
  remember,
  onRememberChange,
  onPasskey,
  onPassword,
  onMagicLink,
}: {
  email: string
  onEmailChange: (value: string) => void
  remember: boolean
  onRememberChange: (value: boolean) => void
  onPasskey: () => void
  onPassword: () => void
  onMagicLink: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Passkeys can be usernameless, so this does not wait for the email field.
          Behind it: navigator.credentials.get({ publicKey, mediation: "optional" }). */}
      <Button className="w-full" onClick={onPasskey}>
        <Fingerprint /> Continue with a passkey
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-2xs tracking-widest text-muted-foreground uppercase">or</span>
        <Separator className="flex-1" />
      </div>

      <Form
        onSubmit={(event) => {
          event.preventDefault()
          onPassword()
        }}
      >
        <Field name="email" validationMode="onBlur">
          <FieldLabel>Email</FieldLabel>
          <FieldControl
            render={
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                /* `webauthn` is what turns on conditional UI: the browser offers a
                   saved passkey from the field itself, alongside the usual autofill.
                   It only does anything if the page also has a
                   `mediation: "conditional"` credential request in flight. */
                autoComplete="username webauthn"
              />
            }
          />
          <FieldError match="valueMissing">Enter your email address.</FieldError>
          <FieldError match="typeMismatch">That does not look like an email address.</FieldError>
        </Field>

        <div className="flex items-center gap-2">
          <Checkbox id="remember" checked={remember} onCheckedChange={onRememberChange} />
          <Label htmlFor="remember" className="text-sm font-normal">
            Keep me signed in
          </Label>
        </div>

        <Button type="submit" variant="outline" className="w-full">
          <KeyRound /> Continue with a password
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onMagicLink}>
          <Mail /> Email me a sign-in link
        </Button>
      </Form>
    </div>
  )
}

/* ── passkey ──────────────────────────────────────────────────────────────── */

/** The browser owns this screen once the call starts — the platform's own sheet is
 *  what the person actually interacts with. All this has to do is say what is
 *  happening, stay out of the way, and offer a way back for a device that is not to
 *  hand. */
function Passkey({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onDone, 1600)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="space-y-4">
      <div
        role="status"
        className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm"
      >
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
        Waiting for your passkey…
      </div>
      <p className="text-xs text-muted-foreground">
        Your browser should be asking for Touch ID, Windows Hello, or your security key.
      </p>
      <Button variant="outline" size="sm" className="w-full" onClick={onCancel}>
        Use another method
      </Button>
    </div>
  )
}

/* ── password ─────────────────────────────────────────────────────────────── */

function Password({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        onDone()
      }}
    >
      <Field name="password" validationMode="onBlur">
        <FieldLabel>Password</FieldLabel>
        <FieldControl render={<PasswordInput required autoComplete="current-password" autoFocus />} />
        <FieldError match="valueMissing">Enter your password.</FieldError>
      </Field>
      <div className="flex items-center justify-between">
        <Button type="button" variant="link" size="sm" className="px-0">
          Forgot password?
        </Button>
      </div>
      <Button type="submit" className="w-full">
        Continue
      </Button>
      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onBack}>
        <ArrowLeft /> Back
      </Button>
    </Form>
  )
}

/* ── second factor ────────────────────────────────────────────────────────── */

function Code({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        onDone()
      }}
    >
      <Field name="code">
        <FieldLabel>Verification code</FieldLabel>
        <FieldControl render={<OtpField length={6} />} />
        <FieldDescription>Paste it — the whole code lands at once.</FieldDescription>
      </Field>
      <Button type="submit" className="w-full">
        Sign in
      </Button>
      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onBack}>
        <ArrowLeft /> Use a different account
      </Button>
    </Form>
  )
}

/* ── sign-in link ─────────────────────────────────────────────────────────── */

/** The only method whose next step happens somewhere else, so this screen's whole
 *  job is to be unambiguous about that and to offer a way out of the dead end —
 *  a resend, and a way back if the address was wrong. */
function LinkSent({ onBack }: { onBack: () => void }) {
  const [seconds, setSeconds] = React.useState(RESEND_SECONDS)

  React.useEffect(() => {
    if (seconds === 0) return
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <div className="grid size-11 place-items-center rounded-full bg-primary/10">
          <MailCheck className="size-5 text-primary" aria-hidden="true" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        The link signs you in on this device and expires in 15 minutes. You can close
        this tab.
      </p>
      <Button
        variant="outline"
        className="w-full"
        disabled={seconds > 0}
        onClick={() => setSeconds(RESEND_SECONDS)}
      >
        {seconds > 0 ? (
          <>
            Resend in{" "}
            {/* aria-hidden so a countdown does not narrate itself once a second;
                the button's own label changes when it becomes available, which is
                the only moment worth announcing. */}
            <span aria-hidden="true" className="dp-num">
              {seconds}s
            </span>
          </>
        ) : (
          "Resend the link"
        )}
      </Button>
      <Button variant="ghost" size="sm" className="w-full" onClick={onBack}>
        <ArrowLeft /> Use a different address
      </Button>
    </div>
  )
}
