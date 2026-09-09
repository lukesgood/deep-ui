"use client"

import * as React from "react"
import { ArrowUp, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ComposerContext = {
  busy: boolean
  submit: () => void
}

const Context = React.createContext<ComposerContext | null>(null)

function useComposer() {
  const ctx = React.useContext(Context)
  if (!ctx) throw new Error("Composer parts must be used within <Composer>")
  return ctx
}

/** The prompt box. A `<form>`, so Enter and the button go through one path and the
 *  browser's own submit semantics still apply. */
function Composer({
  busy = false,
  onSend,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"form">, "onSubmit"> & {
  /** True while a reply is streaming — blocks a second send. */
  busy?: boolean
  onSend?: () => void
}) {
  const ref = React.useRef<HTMLFormElement>(null)

  const submit = React.useCallback(() => {
    if (busy) return
    onSend?.()
  }, [busy, onSend])

  return (
    <Context.Provider value={{ busy, submit }}>
      <form
        ref={ref}
        data-slot="composer"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className={cn(
          "flex items-end gap-2 rounded-xl border bg-card p-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          className
        )}
        {...props}
      >
        {children}
      </form>
    </Context.Provider>
  )
}

/** Enter sends, Shift+Enter breaks the line — and it grows with the text up to a
 *  cap, because a prompt box that stays one line tall hides what you typed.
 *
 *  Enter is deliberately not bound while an IME composition is in flight: in
 *  Korean, Japanese and Chinese input the first Enter commits the candidate, and
 *  sending on it truncates the sentence mid-word. */
function ComposerInput({
  className,
  maxRows = 8,
  onKeyDown,
  ...props
}: React.ComponentProps<"textarea"> & { maxRows?: number }) {
  const { busy, submit } = useComposer()
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const composing = React.useRef(false)

  const resize = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20
    el.style.height = `${Math.min(el.scrollHeight, lineHeight * maxRows)}px`
  }, [maxRows])

  React.useEffect(resize, [resize, props.value])

  return (
    <textarea
      ref={ref}
      data-slot="composer-input"
      rows={1}
      onInput={resize}
      onCompositionStart={() => (composing.current = true)}
      onCompositionEnd={() => (composing.current = false)}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key !== "Enter" || event.shiftKey) return
        if (composing.current || event.nativeEvent.isComposing) return
        event.preventDefault()
        if (!busy) submit()
      }}
      className={cn(
        "field-sizing-content max-h-48 flex-1 resize-none bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

/** Send, or stop while a reply is streaming — one control, because they are the
 *  same slot and a second button next to a disabled one is just clutter. */
function ComposerSubmit({
  onStop,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { onStop?: () => void }) {
  const { busy } = useComposer()
  return (
    <Button
      data-slot="composer-submit"
      type={busy ? "button" : "submit"}
      size="icon-sm"
      aria-label={busy ? "Stop generating" : "Send message"}
      onClick={busy ? onStop : undefined}
      className={cn("rounded-full", className)}
      {...props}
    >
      {busy ? <Square className="fill-current" /> : <ArrowUp />}
    </Button>
  )
}

export { Composer, ComposerInput, ComposerSubmit }
