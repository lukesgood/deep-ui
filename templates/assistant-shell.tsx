"use client"

import * as React from "react"
import {
  ChevronsUpDown, Database, LayoutDashboard, LogOut, PanelRight, Settings2,
  Table2, User, Workflow,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Citation, Citations } from "@/components/ui/citations"
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer"
import {
  Conversation, ConversationMessage, ConversationPending,
} from "@/components/ui/conversation"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Markdown } from "@/components/ui/markdown"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarRail, SidebarTrigger,
} from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

/** An app shell with the assistant docked on the right.
 *
 *  This is the answer to "where does the assistant panel go": there is no
 *  `<AssistantPanel>` component, because there did not need to be one. On a wide
 *  screen it is an `aside` beside `<SidebarInset>`; on a narrow one it becomes a
 *  `<Sheet>`, because a 320px column next to a 375px viewport is not a layout.
 *
 *  The branch is `useIsMobile()`, in JavaScript, not a `lg:hidden` on the Sheet —
 *  hiding it with CSS still leaves it *open*, so its backdrop dims and blurs the
 *  whole page behind a panel nobody can see.
 *
 *  Why not a second `<Sidebar side="right">`: `SidebarProvider` owns one open state,
 *  so two Sidebars under one provider collapse together. Nesting a second provider
 *  works but buys nothing here — the assistant needs a single boolean, not a rail,
 *  a keyboard shortcut and a cookie. Reach for `Sidebar side="right"` when the right
 *  panel is *navigation* that deserves the same affordances as the left.
 */

const NAV = [
  { icon: LayoutDashboard, label: "Overview" },
  { icon: Table2, label: "Datasets", active: true },
  { icon: Workflow, label: "Pipelines" },
  { icon: Settings2, label: "Settings" },
]

const ANSWER = `**events_raw** is the busiest table in this pond — 1,408,222 rows,
partitioned by day.

1. the hourly rollup reads it at :05 past [1]
2. compaction rewrites yesterday's partition at 02:00 [2]

Nothing has failed in the last seven days.`

const SOURCES = [
  { index: 1, title: "sessions_hourly — schedule", location: "warehouse/schedules.yaml" },
  { index: 2, title: "Compaction policy", location: "docs/ops/compaction.md" },
]

function AssistantPanel() {
  const [turns, setTurns] = React.useState([
    { id: 0, from: "user" as const, text: "What reads events_raw?" },
    { id: 1, from: "assistant" as const, text: ANSWER },
  ])
  const [draft, setDraft] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft("")
    setTurns((t) => [...t, { id: Date.now(), from: "user" as const, text }])
    setBusy(true)
    setTimeout(() => {
      setTurns((t) => [...t, { id: Date.now() + 1, from: "assistant" as const, text: ANSWER }])
      setBusy(false)
    }, 900)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <Database className="size-4 text-primary" />
        <span className="text-sm font-medium">Assistant</span>
      </div>

      <Conversation label="Assistant conversation" className="min-h-0 flex-1">
        {turns.map((t) => (
          <ConversationMessage key={t.id} from={t.from}>
            {t.from === "assistant" ? (
              <Markdown text={t.text} citations citationHref={(n) => `#citation-${n}`} />
            ) : (
              t.text
            )}
          </ConversationMessage>
        ))}
        {busy && <ConversationPending />}
      </Conversation>

      <div className="shrink-0 space-y-3 border-t p-3">
        <ScrollArea className="max-h-28">
          <Citations>
            {SOURCES.map((c) => (
              <Citation key={c.index} {...c} />
            ))}
          </Citations>
        </ScrollArea>
        <Separator />
        <Composer busy={busy} onSend={send}>
          <ComposerInput
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about this dataset…"
            aria-label="Message"
          />
          <ComposerSubmit />
        </Composer>
      </div>
    </div>
  )
}

/** The account control every app shell has and this one did not.
 *
 *  It reads as one row — picture, name, address — and opens a menu, which is what
 *  makes it findable: people look bottom-left for their own account, and they look
 *  for their own face. Collapsed to icons the text is clipped rather than removed,
 *  so the button keeps its name for a screen reader.
 *
 *  The menu repeats the name and address at the top. That is not decoration: on a
 *  shared machine it is the only confirmation of *which* account is about to be
 *  signed out. */
function UserMenu() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip="Luke Ham"
                className="data-[popup-open]:bg-sidebar-accent"
              />
            }
          >
            <Avatar className="size-7 shrink-0">
              <AvatarImage src="https://example.invalid/nope.png" alt="" />
              <AvatarFallback className="dp-gradient text-2xs font-semibold text-white">
                LH
              </AvatarFallback>
            </Avatar>
            <span className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">Luke Ham</span>
              <span className="truncate text-xs text-muted-foreground">luke@example.com</span>
            </span>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate text-sm font-medium text-foreground">Luke Ham</span>
                <span className="block truncate text-xs">luke@example.com</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User /> Your account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings2 /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AssistantShell() {
  const isMobile = useIsMobile()
  const [assistantOpen, setAssistantOpen] = React.useState(true)

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="dp-gradient grid size-7 shrink-0 place-items-center rounded-lg">
              <Database className="size-4 text-white" />
            </div>
            <span className="dp-gradient-text truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
              Deep Water
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton isActive={item.active} tooltip={item.label}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <span className="font-mono text-sm">events_raw</span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label={assistantOpen ? "Hide the assistant" : "Show the assistant"}
            aria-expanded={assistantOpen}
            onClick={() => setAssistantOpen((o) => !o)}
          >
            <PanelRight />
          </Button>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto p-6">
            <h1 className="font-heading text-xl font-semibold tracking-tight">events_raw</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Partitioned by day · 12 columns ·{" "}
              <span className="dp-num">1,408,222</span> rows
            </p>
            <div className="mt-6 space-y-2">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span className="font-mono text-xs">
                    run_{String(2048 - i).padStart(4, "0")}
                  </span>
                  <span className="dp-num text-xs text-muted-foreground">1.{i}s</span>
                </div>
              ))}
            </div>
          </div>

          {/* One or the other, never both. */}
          {isMobile ? (
            <Sheet open={assistantOpen} onOpenChange={setAssistantOpen}>
              <SheetContent side="right" className="w-full p-0 sm:max-w-sm">
                <SheetHeader className="sr-only">
                  <SheetTitle>Assistant</SheetTitle>
                  <SheetDescription>Ask about this dataset.</SheetDescription>
                </SheetHeader>
                <AssistantPanel />
              </SheetContent>
            </Sheet>
          ) : (
            assistantOpen && (
              <aside className="w-80 shrink-0 border-l bg-card" aria-label="Assistant">
                <AssistantPanel />
              </aside>
            )
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
