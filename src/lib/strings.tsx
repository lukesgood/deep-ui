"use client"

import * as React from "react"

/** The words the components say on their own.
 *
 *  Most of these are `aria-label`s, which is what makes them worth extracting rather
 *  than leaving to whoever copies the files. An untranslated visible label is obvious
 *  the first time anyone looks at the screen. An untranslated `aria-label` is
 *  invisible to everyone except the person relying on it, who gets English read to
 *  them in the middle of their own language and has no way to report a bug nobody
 *  else can see.
 *
 *  Flat keys on purpose: a nested shape needs a deep merge to override one string,
 *  and a deep merge is a thing to get wrong. `{ ...DEFAULT_STRINGS, ...yours }` is
 *  the whole implementation.
 *
 *      <StringsProvider strings={{ "toast.dismiss": "알림 닫기" }}>
 *
 *  Nothing is required. A component takes its prop if given, the provider's value if
 *  there is one, and English otherwise — so an app that never renders the provider
 *  behaves exactly as it did before this existed.
 */
export const DEFAULT_STRINGS = {
  "breadcrumb.label": "breadcrumb",
  "breadcrumb.more": "More",

  "citations.label": "Sources",

  "combobox.showOptions": "Show options",

  "composer.send": "Send message",
  "composer.stop": "Stop generating",

  "confirm.cancel": "Cancel",
  "confirm.confirm": "Confirm",
  "confirm.title": "Confirm",

  "conversation.jumpToLatest": "Jump to the latest message",
  "conversation.label": "Conversation",
  "conversation.pending": "Thinking…",

  "dialog.close": "Close",

  "numberField.decrement": "Decrease",
  "numberField.increment": "Increase",

  "pagination.label": "Pagination",
  "pagination.next": "Next",
  "pagination.nextLabel": "Go to the next page",
  "pagination.previous": "Previous",
  "pagination.previousLabel": "Go to the previous page",

  "passwordInput.hide": "Hide password",
  "passwordInput.show": "Show password",

  "sheet.close": "Close",

  "sidebar.label": "Sidebar",
  "sidebar.mobileDescription": "Displays the mobile sidebar.",
  "sidebar.toggle": "Toggle Sidebar",

  "toast.dismiss": "Dismiss notification",
  "toast.region": "Notifications",
} as const

export type StringKey = keyof typeof DEFAULT_STRINGS
export type Strings = Partial<Record<StringKey, string>>

const StringsContext = React.createContext<Strings | null>(null)

export function StringsProvider({
  strings,
  children,
}: {
  strings: Strings
  children: React.ReactNode
}) {
  // Memoised on the object identity the caller gives us. Pass a module-level
  // constant, or memoise it yourself, or every component re-renders on every render.
  const value = React.useMemo(() => strings, [strings])
  return <StringsContext.Provider value={value}>{children}</StringsContext.Provider>
}

/** prop → provider → English. Pass the component's own prop as `override` so a
 *  one-off caller does not have to reach for the provider. */
export function useString(key: StringKey, override?: string): string {
  const strings = React.useContext(StringsContext)
  return override ?? strings?.[key] ?? DEFAULT_STRINGS[key]
}

/** For a component that needs several at once. */
export function useStrings(): Record<StringKey, string> {
  const strings = React.useContext(StringsContext)
  return React.useMemo(
    () => ({ ...DEFAULT_STRINGS, ...strings }),
    [strings]
  )
}
