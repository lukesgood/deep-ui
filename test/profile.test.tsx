import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { ConfirmProvider } from "@/lib/confirm"
import { ToastProvider } from "@/lib/toast"
import { Profile } from "../templates/profile"

afterEach(cleanup)
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  }))
})

const open = () =>
  render(
    <ToastProvider>
      <ConfirmProvider>
        <Profile />
      </ConfirmProvider>
    </ToastProvider>
  )

const dialog = () =>
  document.querySelector<HTMLElement>('[data-slot="dialog-content"]')!

/** Flush the microtask the confirm promise resolves on, plus a frame, so a "nothing
 *  happened" assertion is looking after the moment something could have. */
const settle = () => new Promise((r) => setTimeout(r, 50))
/** `useConfirm()` resolves a promise, so the state change it unblocks lands a
 *  microtask later than the click. Every assertion after a confirm has to wait. */
const press = (label: string) =>
  fireEvent.click(within(dialog()).getByRole("button", { name: label }))

test("removing a passkey asks first, and cancelling keeps it", async () => {
  open()
  expect(screen.getAllByRole("button", { name: /^Remove / })).toHaveLength(3)

  fireEvent.click(screen.getByRole("button", { name: "Remove iPhone 17" }))
  expect(await screen.findByText("Remove iPhone 17?")).toBeTruthy()

  press("Cancel")
  // Let the confirm's promise settle before looking. Asserting synchronously here
  // passes whether or not the guard exists — the removal would land a microtask
  // later either way, which is a test that agrees with itself and nothing else.
  await settle()
  // Revoking a passkey on a misclick locks someone out of their own account.
  expect(screen.getAllByRole("button", { name: /^Remove / })).toHaveLength(3)
})

test("confirming removes only that passkey", async () => {
  open()
  fireEvent.click(screen.getByRole("button", { name: "Remove iPhone 17" }))
  await screen.findByText("Remove iPhone 17?")
  press("Remove")

  await waitFor(() => expect(screen.queryByText("iPhone 17")).toBeNull())
  expect(screen.getByText("MacBook Pro — Touch ID")).toBeTruthy()
})

test("the last passkey warns differently, because it is the last one", async () => {
  open()
  for (const name of ["Remove iPhone 17", "Remove YubiKey 5C"]) {
    fireEvent.click(screen.getByRole("button", { name }))
    await screen.findByText(`${name}?`)
    press("Remove")
    await waitFor(() => expect(screen.queryByRole("button", { name })).toBeNull())
  }

  fireEvent.click(screen.getByRole("button", { name: "Remove MacBook Pro — Touch ID" }))
  expect(
    await screen.findByText(/This is your last passkey/)
  ).toBeTruthy()
  press("Remove")

  expect(
    await screen.findByText(/Your password is the only way into this account/)
  ).toBeTruthy()
})

test("the session you are using is named, and cannot be signed out from the list", () => {
  open()
  // Without this the list is unusable: "end anything you do not recognise" is a
  // guess if you cannot tell which row is the machine in front of you.
  const current = screen.getByText("Chrome on macOS").closest("li")!
  expect(within(current).getByText("This device")).toBeTruthy()
  expect(within(current).queryByRole("button")).toBeNull()

  expect(screen.getByRole("button", { name: "Sign out Safari on iOS" })).toBeTruthy()
})

test("signing out everywhere else keeps this device", async () => {
  open()
  fireEvent.click(screen.getByRole("button", { name: "Sign out everywhere else" }))
  await screen.findByText("Sign out everywhere else?")
  press("Sign out everywhere else")

  await waitFor(() => expect(screen.queryByText("Safari on iOS")).toBeNull())
  expect(screen.getByText("Chrome on macOS")).toBeTruthy()
  expect(screen.queryByText("Firefox on Windows")).toBeNull()
})

test("deleting the account asks, and says what goes with it", async () => {
  open()
  fireEvent.click(screen.getByRole("button", { name: "Delete account" }))
  expect(await screen.findByText("Delete your account?")).toBeTruthy()
  expect(screen.getByText(/cannot be undone/)).toBeTruthy()
})

test("the avatar falls back to initials when the picture will not load", () => {
  open()
  expect(screen.getByText("LH")).toBeTruthy()
  expect(screen.getByRole("button", { name: "Change your picture" })).toBeTruthy()
})
