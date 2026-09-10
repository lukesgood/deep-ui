import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"

import { AssistantShell } from "../templates/assistant-shell"
import { SignIn } from "../templates/sign-in"

afterEach(cleanup)

/** `useIsMobile()` reads `matchMedia`, which happy-dom reports as desktop by default.
 *  Pinning it is the only way to exercise both halves of a responsive branch in a
 *  test, and this particular branch is worth pinning: hiding the Sheet with
 *  `lg:hidden` instead left it *open* on desktop, so its backdrop dimmed and blurred
 *  the whole page behind a panel nobody could see. */
function setViewport(isMobile: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: isMobile,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

beforeEach(() => {
  // Base UI's positioning and the sidebar both reach for these.
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
})

test("on a wide viewport the assistant docks, and no Sheet is mounted", () => {
  setViewport(false)
  render(<AssistantShell />)
  expect(screen.getByRole("complementary", { name: "Assistant" })).toBeTruthy()
  expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull()
})

test("on a narrow viewport the same panel moves into a Sheet, and nothing docks", () => {
  setViewport(true)
  render(<AssistantShell />)
  expect(screen.queryByRole("complementary", { name: "Assistant" })).toBeNull()
  expect(document.querySelector('[data-slot="sheet-content"]')).not.toBeNull()
})

test("the assistant is dismissable, and says which state its control will produce", () => {
  setViewport(false)
  render(<AssistantShell />)
  const toggle = screen.getByRole("button", { name: "Hide the assistant" })
  expect(toggle.getAttribute("aria-expanded")).toBe("true")

  fireEvent.click(toggle)

  expect(screen.queryByRole("complementary", { name: "Assistant" })).toBeNull()
  expect(screen.getByRole("button", { name: "Show the assistant" }).getAttribute("aria-expanded")).toBe("false")
})

/* ── sign-in ──────────────────────────────────────────────────────────────── */

test("the three methods are offered in the order they deserve", () => {
  setViewport(false)
  render(<SignIn />)
  const labels = screen
    .getAllByRole("button")
    .map((b) => b.textContent?.trim())
    .filter(Boolean)
  // Passkey first: fastest, and the only one of the three that cannot be phished.
  expect(labels[0]).toBe("Continue with a passkey")
  expect(labels).toContain("Continue with a password")
  expect(labels).toContain("Email me a sign-in link")
})

test("the email field opts into passkey conditional UI", () => {
  // `webauthn` in the autocomplete token list is what lets the browser offer a saved
  // passkey from the field itself. Without it, conditional mediation shows nothing.
  setViewport(false)
  render(<SignIn />)
  expect(screen.getByLabelText("Email").getAttribute("autocomplete")).toBe("username webauthn")
})

test("the password route refuses to advance on an empty address, and says why", async () => {
  setViewport(false)
  render(<SignIn />)
  fireEvent.click(screen.getByRole("button", { name: "Continue with a password" }))
  expect(await screen.findByText("Enter your email address.")).toBeTruthy()
  expect(screen.queryByLabelText("Password")).toBeNull()
})

test("a malformed address is caught on blur, in our words rather than the browser's", async () => {
  // The trap this guards: with a custom `validate` here the message would be the
  // browser's "Constraints not satisfied", because native validation on
  // `type="email"` fails first and the custom validator never runs.
  setViewport(false)
  render(<SignIn />)
  const email = screen.getByLabelText("Email")
  fireEvent.change(email, { target: { value: "not-an-address" } })
  fireEvent.blur(email)
  expect(await screen.findByText("That does not look like an email address.")).toBeTruthy()
  expect(screen.queryByText(/Constraints not satisfied/)).toBeNull()
  expect(email.getAttribute("aria-invalid")).toBe("true")
})

test("tabbing past an untouched empty field does not scold you; submitting does", async () => {
  // Base UI suppresses a lone `valueMissing` until the field has been marked dirty,
  // which is the difference between a form that helps and one that turns red at you
  // for looking at it. Asserted so a future change to the template does not lose it.
  setViewport(false)
  render(<SignIn />)
  const email = screen.getByLabelText("Email")
  fireEvent.focus(email)
  fireEvent.blur(email)
  await new Promise((r) => setTimeout(r, 100))
  expect(screen.queryByText("Enter your email address.")).toBeNull()

  fireEvent.click(screen.getByRole("button", { name: "Continue with a password" }))
  expect(await screen.findByText("Enter your email address.")).toBeTruthy()
})

test("the password step asks the manager for the current password, not a new one", async () => {
  setViewport(false)
  render(<SignIn />)
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "luke@example.com" } })
  fireEvent.click(screen.getByRole("button", { name: "Continue with a password" }))

  const password = await screen.findByLabelText("Password")
  expect((password as HTMLInputElement).autocomplete).toBe("current-password")
})

test("the sign-in link step names the address it went to, and gates the resend", async () => {
  setViewport(false)
  render(<SignIn />)
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "luke@example.com" } })
  fireEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }))

  // The one method whose next step happens somewhere else, so the address has to be
  // on screen — a typo is otherwise a silent dead end.
  expect(await screen.findByText(/luke@example\.com/)).toBeTruthy()
  expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeTruthy()
  expect(screen.getByRole("button", { name: /Resend in/ }).hasAttribute("disabled")).toBe(true)
})

test("a step change moves focus, instead of leaving it on a button that is gone", async () => {
  setViewport(false)
  render(<SignIn />)
  fireEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }))
  const heading = await screen.findByRole("heading", { name: "Check your inbox" })
  expect(document.activeElement).toBe(heading)
})

test("the password step lands on its heading, not on the password box", async () => {
  setViewport(false)
  render(<SignIn />)
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sujin@example.com" } })
  fireEvent.click(screen.getByRole("button", { name: "Continue with a password" }))

  // Every step is supposed to take focus on its heading, so the person is told which
  // step they are on before being dropped into a field. A field that grabs focus on
  // mount skips the announcement — you are typing into something you were never told
  // the name of.
  const heading = await screen.findByRole("heading")
  expect(document.activeElement).toBe(heading)
})

test("the passkey step says what is happening and offers a way out", () => {
  setViewport(false)
  render(<SignIn />)
  fireEvent.click(screen.getByRole("button", { name: "Continue with a passkey" }))
  expect(screen.getByRole("status").textContent).toContain("Waiting for your passkey")
  expect(screen.getByRole("button", { name: "Use another method" })).toBeTruthy()
})

/* ── dates ────────────────────────────────────────────────────────────────── */

test("dates are formatted by the browser, not written out in English", async () => {
  const { ToastProvider } = await import("@/lib/toast")
  const { ConfirmProvider } = await import("@/lib/confirm")
  const { Profile } = await import("../templates/profile")
  setViewport(false)
  render(
    <ToastProvider>
      <ConfirmProvider>
        <Profile />
      </ConfirmProvider>
    </ToastProvider>
  )

  // Every date carries a machine-readable value alongside whatever the locale
  // renders, so the formatting can change without losing the actual instant.
  const times = Array.from(document.querySelectorAll("time"))
  expect(times.length).toBeGreaterThan(0)
  for (const t of times) {
    expect(t.getAttribute("datetime")).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(t.textContent?.trim()).not.toBe("")
  }

  // Positive, not a negative regex over the whole page: every session row must carry
  // a <time>, so replacing one with a literal string fails here rather than sliding
  // past an assertion that was only ever looking for English.
  for (const device of ["Chrome on macOS", "Safari on iOS", "Firefox on Windows"]) {
    const row = screen.getByText(device).closest("li")!
    expect(within(row).getByText((_, el) => el?.tagName === "TIME")).toBeTruthy()
  }
})
