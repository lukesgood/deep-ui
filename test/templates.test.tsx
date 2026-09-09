import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"

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

test("sign-in refuses to advance until both fields are valid, and says why", async () => {
  setViewport(false)
  render(<SignIn />)

  fireEvent.click(screen.getByRole("button", { name: "Continue" }))

  expect(await screen.findByText("Enter your email address.")).toBeTruthy()
  expect(screen.getByText("Enter your password.")).toBeTruthy()
  // Still on step one.
  expect(screen.queryByText("Verification code")).toBeNull()
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

  fireEvent.click(screen.getByRole("button", { name: "Continue" }))
  expect(await screen.findByText("Enter your email address.")).toBeTruthy()
})

test("the password box asks the manager for the current password, not a new one", () => {
  setViewport(false)
  render(<SignIn />)
  const password = document.querySelector<HTMLInputElement>('[data-slot="password-input"] input')!
  expect(password.autocomplete).toBe("current-password")
  expect(screen.getByLabelText("Email").getAttribute("autocomplete")).toBe("username")
})
