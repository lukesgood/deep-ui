"use client"

import * as React from "react"
import { ArrowDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useStickToBottom } from "@/hooks/use-stick-to-bottom"
import { cn } from "@/lib/utils"

/** The container an assistant panel was missing.
 *
 *  Two things it owns that are easy to get wrong by hand:
 *
 *  - **Following the stream, but only when invited.** It stays pinned to the bottom
 *    as answers arrive, and stops the moment the reader scrolls up to re-read
 *    something. `pinned` drives the jump-to-latest button.
 *  - **Announcing.** `role="log"` with `aria-live="polite"` means a new answer is
 *    read out when it settles. Without it a screen-reader user gets silence and has
 *    to go hunting for whether anything happened.
 *
 *  A seam worth knowing about: this scrolls natively rather than through
 *  `<ScrollArea>`, because sticking to the bottom needs a ref to the element that
 *  actually scrolls. The cost is that the scrollbar here is the platform's, so on
 *  macOS it hides itself between scrolls while the rest of the system's panes keep
 *  a visible one.
 */
function Conversation({
  className,
  children,
  label = "Conversation",
  ...props
}: React.ComponentProps<"div"> & { label?: string }) {
  const { ref, pinned, scrollToBottom } = useStickToBottom<HTMLDivElement>()

  return (
    <div data-slot="conversation" className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      <div
        ref={ref}
        data-slot="conversation-log"
        role="log"
        aria-live="polite"
        aria-label={label}
        aria-relevant="additions"
        tabIndex={0}
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        {...props}
      >
        {children}
      </div>
      {!pinned && (
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => scrollToBottom()}
          aria-label="Jump to the latest message"
          className="dp-elevated absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full"
        >
          <ArrowDown />
        </Button>
      )}
    </div>
  )
}

/** A turn. `role` here is who spoke, not an ARIA role — the two readings collide in
 *  every chat codebase, so it is spelled `from`. */
function ConversationMessage({
  from,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { from: "user" | "assistant" }) {
  return (
    <div
      data-slot="conversation-message"
      data-from={from}
      className={cn(
        "group/message flex w-full flex-col gap-1",
        from === "user" ? "items-end" : "items-start",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-sm",
          from === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** Actions on a turn — copy, regenerate. Revealed on hover, but never hidden from
 *  the keyboard: `focus-within` keeps them reachable by tabbing. */
function ConversationActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="conversation-actions"
      className={cn(
        "flex items-center gap-0.5 opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100",
        className
      )}
      {...props}
    />
  )
}

/** Shown while a reply is being generated. The dots are decorative — the text is
 *  what gets announced, and it is what a reader who has turned motion off sees. */
function ConversationPending({
  className,
  label = "Thinking…",
  ...props
}: React.ComponentProps<"div"> & { label?: string }) {
  return (
    <div
      data-slot="conversation-pending"
      role="status"
      className={cn("flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground", className)}
      {...props}
    >
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-pulse rounded-full bg-current"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      {label}
    </div>
  )
}

export { Conversation, ConversationActions, ConversationMessage, ConversationPending }
