import { useEffect, useState } from "react"

import { AssistantShell } from "../../../templates/assistant-shell"
import { Settings } from "../../../templates/settings"
import { SignIn } from "../../../templates/sign-in"

/** Whole screens, as opposed to the gallery's parts. They live in `templates/` at
 *  the repo root and import the primitives through the same `@/*` alias an app would,
 *  so what you see here is what you would get by copying the file. */
export const TEMPLATES = [
  { id: "sign-in", title: "Sign in", render: SignIn },
  { id: "settings", title: "Settings", render: Settings },
  { id: "assistant-shell", title: "Assistant shell", render: AssistantShell },
] as const

/** `#/t/<id>` swaps the whole page for a template. The prefix keeps it clear of the
 *  plain `#section` anchors the gallery already uses for scrolling. */
export function useTemplateRoute() {
  const read = () => {
    const match = window.location.hash.match(/^#\/t\/([\w-]+)$/)
    return TEMPLATES.find((t) => t.id === match?.[1]) ?? null
  }
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read)
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return route
}
