"use client"

import * as React from "react"
import {
  BadgeCheck, Camera, Fingerprint, Globe, Laptop, LogOut, Plus, Smartphone,
  Trash2,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Field, FieldControl, FieldDescription, FieldError, FieldLabel, Form,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useConfirm } from "@/lib/confirm"
import { useToast } from "@/lib/toast"

/** The account screen.
 *
 *  A template, not a primitive. Three things in it are worth keeping whatever else
 *  you change:
 *
 *  **Passkeys are listed, not hidden behind "security settings".** They are the thing
 *  someone came here to add or revoke after losing a laptop, and a list of devices
 *  with dates is what makes that possible. Most products bury this.
 *
 *  **Sessions name the device and where it was last used, and the current one says
 *  so.** "Sign out everywhere" is the button people need when something has gone
 *  wrong, and it is useless if they cannot tell which row is the machine they are
 *  sitting at.
 *
 *  **Every destructive action goes through `useConfirm()`.** Revoking a passkey on a
 *  misclick locks someone out of their own account. The confirm is not ceremony.
 */

type Passkey = { id: string; name: string; added: Date; lastUsed: Date }
type Session = {
  id: string
  device: string
  where: string
  when: Date
  current?: boolean
  icon: typeof Laptop
}

/** Dates are `Date`s, not strings, and formatting is the browser's.
 *
 *  "12 Mar 2026" hardcoded is wrong in most of the world before anyone translates a
 *  word — day and month swap, the separator changes, the month name is English, and
 *  in Korean the year comes first. `Intl` already knows all of that for whatever
 *  locale the person is actually using, and `RelativeTimeFormat` knows that "3일 전"
 *  is not "3 days ago" with the words replaced.
 *
 *  Left to the browser's own locale here. Pass one explicitly if your app lets people
 *  choose a locale separately from their system. */
const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })
const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

const MINUTE = 60_000
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * MINUTE],
  ["month", 30 * 24 * 60 * MINUTE],
  ["day", 24 * 60 * MINUTE],
  ["hour", 60 * MINUTE],
  ["minute", MINUTE],
]

/** "3 days ago" / "3일 전" / "il y a 3 jours" — picking the largest unit that fits,
 *  the way a person would say it. `numeric: "auto"` is what turns "1 day ago" into
 *  "yesterday" where the language has a word for it. */
function ago(when: Date, now = Date.now()) {
  const elapsed = when.getTime() - now
  for (const [unit, ms] of UNITS) {
    if (Math.abs(elapsed) >= ms) return relative.format(Math.round(elapsed / ms), unit)
  }
  // Seconds rather than minutes for the "just happened" case: every locale has a
  // word for it ("now", "지금", "maintenant"), where zero minutes produces the
  // literal and useless "this minute" / "현재 분".
  return relative.format(0, "second")
}

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * MINUTE)
const hoursAgo = (n: number) => new Date(Date.now() - n * 60 * MINUTE)

const PASSKEYS: Passkey[] = [
  { id: "p1", name: "MacBook Pro — Touch ID", added: daysAgo(180), lastUsed: hoursAgo(3) },
  { id: "p2", name: "iPhone 17", added: daysAgo(250), lastUsed: daysAgo(3) },
  { id: "p3", name: "YubiKey 5C", added: daysAgo(300), lastUsed: daysAgo(60) },
]

const SESSIONS: Session[] = [
  { id: "s1", device: "Chrome on macOS", where: "Seoul, KR", when: new Date(), current: true, icon: Laptop },
  { id: "s2", device: "Safari on iOS", where: "Seoul, KR", when: hoursAgo(2), icon: Smartphone },
  { id: "s3", device: "Firefox on Windows", where: "Frankfurt, DE", when: daysAgo(6), icon: Globe },
]

export function Profile() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [passkeys, setPasskeys] = React.useState(PASSKEYS)
  const [sessions, setSessions] = React.useState(SESSIONS)

  const revokePasskey = async (key: Passkey) => {
    const ok = await confirm({
      title: `Remove ${key.name}?`,
      message:
        passkeys.length === 1
          ? "This is your last passkey. Removing it leaves your password as the only way in."
          : "That device will no longer be able to sign in. You can add it again later.",
      destructive: true,
      confirmText: "Remove",
    })
    if (!ok) return
    setPasskeys((list) => list.filter((k) => k.id !== key.id))
    toast(`${key.name} removed`, "success")
  }

  const endSession = async (session: Session) => {
    const ok = await confirm({
      title: `Sign out ${session.device}?`,
      message: `Last used ${ago(session.when)}, from ${session.where}.`,
      destructive: true,
      confirmText: "Sign out",
    })
    if (!ok) return
    setSessions((list) => list.filter((s) => s.id !== session.id))
    toast("Session ended", "success")
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Your account</h1>
        <p className="text-sm text-muted-foreground">
          How you sign in, and what is signed in right now.
        </p>
      </div>

      {/* ── identity ──────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center gap-4">
            <div className="group/avatar relative">
              <Avatar className="size-16">
                <AvatarImage src="https://example.invalid/nope.png" alt="" />
                {/* The gradient earns its place here: an initials fallback is the most
                    common state an avatar is ever in, and a flat grey circle is the
                    least interesting thing the system could put there. */}
                <AvatarFallback className="dp-gradient text-base font-semibold text-white">
                  LH
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon-xs"
                variant="outline"
                aria-label="Change your picture"
                className="dp-elevated absolute -right-1 -bottom-1 rounded-full"
                onClick={() => toast("Pick an image — this is a template", "info")}
              >
                <Camera />
              </Button>
            </div>
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium">Luke Ham</p>
              <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                luke@example.com
                <BadgeCheck
                  className="size-4 shrink-0"
                  style={{ color: "var(--dp-good)" }}
                  aria-hidden="true"
                />
                <span className="sr-only">Verified.</span>
              </p>
            </div>
          </div>

          <Separator />

          <Form onSubmit={(e) => { e.preventDefault(); toast("Profile saved", "success") }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="name"
                validationMode="onBlur"
                validate={(v) => (String(v ?? "").trim() ? null : "A display name is required.")}
              >
                <FieldLabel>Display name</FieldLabel>
                <FieldControl render={<Input defaultValue="Luke Ham" />} />
                <FieldError />
              </Field>
              <Field name="email" validationMode="onBlur">
                <FieldLabel>Email</FieldLabel>
                <FieldControl
                  render={<Input type="email" required defaultValue="luke@example.com" autoComplete="email" />}
                />
                <FieldError match="valueMissing">Enter your email address.</FieldError>
                <FieldError match="typeMismatch">
                  That does not look like an email address.
                </FieldError>
                <FieldDescription>Changing this needs a fresh confirmation.</FieldDescription>
              </Field>
            </div>
            <div>
              <Button type="submit" size="sm">Save</Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* ── passkeys ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 p-5 pb-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Passkeys</CardTitle>
            <CardDescription className="text-sm">
              Sign in with Touch ID, Windows Hello or a security key. Nothing to
              remember, and nothing a phishing page can take.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => toast("Your browser would ask for a passkey here", "info")}
          >
            <Plus /> Add
          </Button>
        </CardHeader>
        <CardContent className="p-5">
          {passkeys.length === 0 ? (
            <p
              className="rounded-lg border px-3 py-2 text-xs"
              style={{
                color: "var(--dp-warn-text)",
                borderColor: "color-mix(in oklab, var(--dp-warn) 30%, transparent)",
                background: "color-mix(in oklab, var(--dp-warn) 10%, transparent)",
              }}
            >
              No passkeys. Your password is the only way into this account.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {passkeys.map((key) => (
                <li key={key.id} className="flex items-center gap-3 p-3">
                  <Fingerprint className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{key.name}</span>
                    <span className="dp-num block truncate text-xs text-muted-foreground">
                      {/* `<time>` so the machine-readable value survives the
                          formatting, and a screen reader can be given the full date. */}
                      Added <time dateTime={key.added.toISOString()}>{date.format(key.added)}</time>
                      {" · used "}
                      <time dateTime={key.lastUsed.toISOString()}>{ago(key.lastUsed)}</time>
                    </span>
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove ${key.name}`}
                    onClick={() => revokePasskey(key)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── sessions ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 p-5 pb-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Where you are signed in</CardTitle>
            <CardDescription className="text-sm">
              End anything you do not recognise.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={async () => {
              const ok = await confirm({
                title: "Sign out everywhere else?",
                message: "Every other device will have to sign in again. This one stays.",
                destructive: true,
                confirmText: "Sign out everywhere else",
              })
              if (!ok) return
              setSessions((list) => list.filter((s) => s.current))
              toast("Other sessions ended", "success")
            }}
          >
            <LogOut /> Sign out everywhere else
          </Button>
        </CardHeader>
        <CardContent className="p-5">
          <ul className="divide-y rounded-lg border">
            {sessions.map((session) => (
              <li key={session.id} className="flex items-center gap-3 p-3">
                <session.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{session.device}</span>
                    {/* Naming the current session is what makes the whole list usable:
                        without it, "sign out everything suspicious" is a guess. */}
                    {session.current && (
                      <Badge variant="secondary" className="shrink-0">
                        This device
                      </Badge>
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {session.where} ·{" "}
                    <time dateTime={session.when.toISOString()}>{ago(session.when)}</time>
                  </span>
                </span>
                {!session.current && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Sign out ${session.device}`}
                    onClick={() => endSession(session)}
                  >
                    <LogOut />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ── the end of the road ───────────────────────────────────────────── */}
      <Card style={{ borderColor: "color-mix(in oklab, var(--dp-bad) 30%, transparent)" }}>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="space-y-1">
            <p className="text-sm font-medium">Delete this account</p>
            <p className="text-xs text-muted-foreground">
              Every pond, pipeline and saved query goes with it. There is no undo.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              const ok = await confirm({
                title: "Delete your account?",
                message:
                  "This removes every pond, pipeline and saved query. It cannot be undone.",
                destructive: true,
                confirmText: "Delete everything",
              })
              toast(ok ? "This is a template — nothing was deleted" : "Nothing deleted", "info")
            }}
          >
            <Trash2 /> Delete account
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
