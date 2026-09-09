import { useEffect, useState } from "react"
import {
  Blocks, ClipboardList, Database, Layers, MessageSquare, Moon, Palette, Radio, Sun,
  Table2, Type,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ToastProvider } from "@/lib/toast"
import { ConfirmProvider } from "@/lib/confirm"

import { SECTIONS } from "./Gallery"

const ICONS = {
  Palette, Type, Layers, Blocks, Table2, Radio, Database, ClipboardList, MessageSquare,
} as const

/** The template ships no theme switcher on purpose — dark mode is just a `.dark`
 *  class on an ancestor. This is the four lines an app needs to drive it. */
function useTheme() {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  )
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])
  return [dark, () => setDark((d) => !d)] as const
}

export default function App() {
  const [dark, toggleTheme] = useTheme()
  const [active, setActive] = useState<string>(SECTIONS[0].id)

  // Highlight the nav entry for whatever section is nearest the top of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: "-72px 0px -70% 0px" }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <ToastProvider>
      <ConfirmProvider>
        <TooltipProvider>
          <SidebarProvider>
            <Sidebar collapsible="icon">
              <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="dp-gradient grid size-7 shrink-0 place-items-center rounded-lg">
                    <Database className="size-4 text-white" />
                  </div>
                  <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="dp-gradient-text truncate text-sm font-semibold">
                      Deep
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      Design system
                    </p>
                  </div>
                </div>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Gallery</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {SECTIONS.map((s) => {
                        const Icon = ICONS[s.icon]
                        return (
                          <SidebarMenuItem key={s.id}>
                            <SidebarMenuButton
                              isActive={active === s.id}
                              tooltip={s.title}
                              render={<a href={`#${s.id}`} />}
                            >
                              <Icon />
                              <span>{s.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={toggleTheme}
                      tooltip={dark ? "Switch to light" : "Switch to dark"}
                    >
                      {dark ? <Sun /> : <Moon />}
                      <span>{dark ? "Light theme" : "Dark theme"}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
              <SidebarRail />
            </Sidebar>

            <SidebarInset>
              <header className="sticky top-0 z-[var(--dp-z-sticky)] flex h-12 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-1 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#tokens">
                        Design system
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {SECTIONS.find((s) => s.id === active)?.title ?? "Tokens"}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <div className="ml-auto">
                  <Button variant="ghost" size="icon-sm" onClick={toggleTheme}
                    aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
                    {dark ? <Sun /> : <Moon />}
                  </Button>
                </div>
              </header>

              <div className="mx-auto w-full max-w-5xl flex-1 space-y-14 px-5 py-10">
                <div className="space-y-3">
                  <h1 className="font-heading text-3xl font-semibold tracking-tight">
                    <span className="dp-gradient-text">Deep</span> design system
                  </h1>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Every token and every primitive in the template, rendered from
                    <code className="mx-1 rounded bg-muted px-1 py-px font-mono text-[0.85em]">
                      ../../src
                    </code>
                    with no copies. Toggle the theme in the top right — nothing on this
                    page hardcodes a colour, so the whole gallery follows.
                  </p>
                </div>
                {SECTIONS.map((s) => (
                  <section key={s.id} id={s.id} className="scroll-mt-16 space-y-5">
                    <div className="space-y-1">
                      <h2 className="font-heading text-lg font-semibold tracking-tight">
                        {s.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">{s.note}</p>
                    </div>
                    <s.render />
                  </section>
                ))}
                <footer className="border-t pt-6 pb-4 text-xs text-muted-foreground">
                  MIT licensed. The primitives derive from shadcn/ui and are built on
                  Base UI — see the README for full credits.
                </footer>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}
