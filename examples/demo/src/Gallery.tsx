import * as React from "react"
import {
  ArrowUpRight, CircleAlert, Copy, Database, Inbox, MoreHorizontal, Pencil,
  Trash2, TriangleAlert,
} from "lucide-react"

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState, ErrorBox } from "@/components/ui/error-box"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Markdown } from "@/components/ui/markdown"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useConfirm } from "@/lib/confirm"
import { useToast } from "@/lib/toast"

/* ───────────────────────────── page furniture ───────────────────────────── */

function Panel({ title, note, children, className = "" }: {
  title: string
  note?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="gap-1 p-4">
        <CardTitle className="text-sm">{title}</CardTitle>
        {note && <CardDescription className="text-xs">{note}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4 pt-0">{children}</CardContent>
    </Card>
  )
}

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid items-start gap-4 md:grid-cols-2">{children}</div>
)

/** Reads the live computed value of a CSS variable, and re-reads it when the theme
 *  class flips — so every swatch on the page shows the value actually in effect. */
function useTokenValues(names: readonly string[]) {
  const [values, setValues] = React.useState<Record<string, string>>({})
  React.useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.documentElement)
      setValues(
        Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()]))
      )
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })
    return () => observer.disconnect()
  }, [names])
  return values
}

type TokenList = readonly (readonly [string, string])[]

function Swatches({ tokens }: { tokens: TokenList }) {
  const names = React.useMemo(() => tokens.map(([n]) => n), [tokens])
  const values = useTokenValues(names)
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {tokens.map(([name, note]) => (
        <li key={name} className="flex items-center gap-2.5">
          <span
            className="size-9 shrink-0 rounded-lg border"
            style={{ background: `var(${name})` }}
          />
          <span className="min-w-0">
            <code className="block truncate font-mono text-[11px]">{name}</code>
            <span className="dp-num block truncate text-[11px] text-muted-foreground">
              {values[name] || "—"}
            </span>
            <span className="block truncate text-[10px] text-muted-foreground/80">
              {note}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/* ────────────────────────────── 1. tokens ────────────────────────────────── */

const SURFACES = [
  ["--background", "the pond floor"],
  ["--card", "a surface on it"],
  ["--popover", "overlays"],
  ["--muted", "recessed fills"],
  ["--secondary", "quiet buttons"],
  ["--accent", "hover / active"],
  ["--sidebar", "the sunken rail"],
  ["--border", "hairlines"],
  ["--input", "field edges"],
] as const

const BRAND = [
  ["--primary", "the one current"],
  ["--ring", "focus"],
  ["--destructive", "danger"],
  ["--foreground", "body text"],
  ["--muted-foreground", "secondary text"],
  ["--dp-managed", "provider-managed"],
] as const

const CHARTS = [
  ["--chart-1", "series 1"],
  ["--chart-2", "series 2"],
  ["--chart-3", "series 3"],
  ["--chart-4", "series 4"],
  ["--chart-5", "series 5"],
] as const

const STATUS = [
  { name: "good", label: "Healthy" },
  { name: "warn", label: "Degraded" },
  { name: "bad", label: "Failed" },
] as const

function TokensSection() {
  return (
    <div className="space-y-4">
      <Grid>
        <Panel title="Surfaces" note="Neutrals are slate hue-biased toward the accent, not left at a default grey.">
          <Swatches tokens={SURFACES} />
        </Panel>
        <Panel title="Brand and text" note="One accent does all the emphasis work.">
          <Swatches tokens={BRAND} />
        </Panel>
      </Grid>
      <Panel
        title="Status, in two steps"
        note="The solid step is for fills, borders and icons (3:1). The text step is for words (4.5:1) — on a light ground no vivid amber reaches that, so it is deliberately darker. In dark mode the two coincide."
      >
        <div className="space-y-2">
          {STATUS.map((s) => (
            <div
              key={s.name}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
              style={{
                borderColor: `color-mix(in oklab, var(--dp-${s.name}) 30%, transparent)`,
                background: `color-mix(in oklab, var(--dp-${s.name}) 10%, transparent)`,
              }}
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ background: `var(--dp-${s.name})` }}
              />
              <code className="font-mono text-[11px] text-muted-foreground">
                --dp-{s.name}
              </code>
              <span className="text-sm" style={{ color: `var(--dp-${s.name}-text)` }}>
                {s.label} — this sentence uses --dp-{s.name}-text
              </span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Chart ramp" note="Kept vivid on purpose: a chart fill is non-text, so 3:1 is the bar and the brighter aqua stays.">
        <Swatches tokens={CHARTS} />
      </Panel>
    </div>
  )
}

/* ──────────────────────────── 2. foundations ─────────────────────────────── */

const RADII = ["sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] as const

function FoundationsSection() {
  return (
    <Grid>
      <Panel title="Radius scale" note="All derived from --radius (0.7rem). Change that one value and everything rescales.">
        <div className="flex flex-wrap items-end gap-3">
          {RADII.map((r) => (
            <div key={r} className="space-y-1 text-center">
              <div
                className="size-12 border bg-muted"
                style={{ borderRadius: `var(--radius-${r})` }}
              />
              <code className="font-mono text-[10px] text-muted-foreground">{r}</code>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Elevation" note="A two-stop shadow plus a faint top hairline. .dp-surface is already applied by Card.">
        <div className="flex flex-wrap gap-3">
          <div className="dp-surface grid h-20 w-32 place-items-center rounded-lg border bg-card text-xs">
            .dp-surface
          </div>
          <div className="dp-elevated grid h-20 w-32 place-items-center rounded-lg border bg-card text-xs">
            .dp-elevated
          </div>
        </div>
      </Panel>
      <Panel title="The signature current" note="One gradient, used for the logo, active rails and key emphasis — and nothing else.">
        <div className="space-y-3">
          <div className="dp-gradient h-12 rounded-lg" />
          <p className="dp-gradient-text font-heading text-2xl font-semibold">
            .dp-gradient-text
          </p>
        </div>
      </Panel>
      <Panel title="Numerals and fonts" note="`.dp-num` switches on tabular figures so columns of numbers line up. Fonts fall back to a system stack until you wire your own.">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-1 text-[11px] text-muted-foreground">default</p>
              <p>1,408,222</p>
              <p>9,111,777</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] text-muted-foreground">.dp-num</p>
              <p className="dp-num">1,408,222</p>
              <p className="dp-num">9,111,777</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-0.5">
            <p className="font-heading text-base font-semibold">--dp-font-heading</p>
            <p className="text-sm">--dp-font-sans</p>
            <p className="font-mono text-xs">--dp-font-mono</p>
          </div>
        </div>
      </Panel>
    </Grid>
  )
}

/* ───────────────────────────── 3. controls ───────────────────────────────── */

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const
const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const
const BADGE_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const

function ControlsSection() {
  const [checked, setChecked] = React.useState(true)
  const [on, setOn] = React.useState(true)
  const [region, setRegion] = React.useState<string | null>("eu-west-1")

  return (
    <div className="space-y-4">
      <Panel title="Button" note="Six variants, five sizes. The filled variant carries white on --primary, which is why that token is a deeper aqua than the chart ramp.">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {BUTTON_VARIANTS.map((v) => (
              <Button key={v} variant={v}>{v}</Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {BUTTON_SIZES.map((s) => (
              <Button key={s} size={s} variant="outline">size {s}</Button>
            ))}
            <Button size="icon" variant="outline" aria-label="Copy"><Copy /></Button>
            <Button disabled>disabled</Button>
          </div>
        </div>
      </Panel>

      <Grid>
        <Panel title="Badge" note="Same variant vocabulary as Button, at label scale.">
          <div className="flex flex-wrap gap-2">
            {BADGE_VARIANTS.map((v) => (
              <Badge key={v} variant={v}>{v}</Badge>
            ))}
          </div>
        </Panel>

        <Panel title="Checkbox, Switch, Tooltip">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox id="cb" checked={checked} onCheckedChange={setChecked} />
              <Label htmlFor="cb">Replicate across regions</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="sw" checked={on} onCheckedChange={setOn} />
              <Label htmlFor="sw">Nightly compaction</Label>
            </div>
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" size="sm" />}>
                Hover me
              </TooltipTrigger>
              <TooltipContent>Tooltips need a TooltipProvider above them</TooltipContent>
            </Tooltip>
          </div>
        </Panel>

        <Panel title="Input, Label, Select">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Dataset name</Label>
              <Input id="name" placeholder="events_raw" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="region">Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="region" className="w-full">
                  <SelectValue placeholder="Choose a region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eu-west-1">eu-west-1</SelectItem>
                  <SelectItem value="us-east-1">us-east-1</SelectItem>
                  <SelectItem value="ap-northeast-2">ap-northeast-2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Panel>

        <Panel title="Textarea" note="Invalid state borrows --destructive through aria-invalid.">
          <div className="space-y-3">
            <Textarea placeholder="Describe what this pipeline does…" rows={3} />
            <Input aria-invalid defaultValue="not-a-valid-name" />
          </div>
        </Panel>
      </Grid>
    </div>
  )
}

/* ─────────────────────────────── 4. data ─────────────────────────────────── */

const ROWS = [
  { name: "events_raw", rows: "1,408,222", status: "good", label: "Healthy" },
  { name: "sessions_hourly", rows: "94,318", status: "warn", label: "Degraded" },
  { name: "billing_export", rows: "12,004", status: "bad", label: "Failed" },
] as const

function DataSection() {
  return (
    <div className="space-y-4">
      <Panel title="Table" note="Figures use .dp-num, and status uses the text step of the status triad.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dataset</TableHead>
              <TableHead className="text-right">Rows</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-mono text-xs">{r.name}</TableCell>
                <TableCell className="dp-num text-right">{r.rows}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: `var(--dp-${r.status})` }}
                    />
                    <span style={{ color: `var(--dp-${r.status}-text)` }}>{r.label}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-xs" aria-label="Actions" />}
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{r.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Pencil /> Rename
                        <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive">
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Grid>
        <Panel title="Tabs" note="Two list variants: the filled default, and `line`.">
          <div className="space-y-4">
            <Tabs defaultValue="schema">
              <TabsList>
                <TabsTrigger value="schema">Schema</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="schema" className="pt-3 text-muted-foreground">
                12 columns, partitioned by <code className="font-mono">day</code>.
              </TabsContent>
              <TabsContent value="preview" className="pt-3 text-muted-foreground">
                First 100 rows.
              </TabsContent>
              <TabsContent value="history" className="pt-3 text-muted-foreground">
                42 runs in the last week.
              </TabsContent>
            </Tabs>
            <Tabs defaultValue="a">
              <TabsList variant="line">
                <TabsTrigger value="a">Line</TabsTrigger>
                <TabsTrigger value="b">Variant</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Panel>

        <Panel title="Collapsible, Separator, Skeleton">
          <div className="space-y-4">
            <Collapsible>
              <CollapsibleTrigger
                render={<Button variant="outline" size="sm" className="w-full justify-between" />}
              >
                Connection details <ArrowUpRight className="size-3.5" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 text-xs text-muted-foreground">
                <code className="font-mono">postgres://pond.internal:5432/events</code>
              </CollapsibleContent>
            </Collapsible>
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </Panel>
      </Grid>
    </div>
  )
}

/* ───────────────────────────── 5. overlays ───────────────────────────────── */

function OverlaysSection() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [alertOpen, setAlertOpen] = React.useState(false)

  return (
    <Grid>
      <Panel title="Dialog and Sheet" note="Both sit on .dp-elevated, the heavier of the two shadows.">
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              Open dialog
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create dataset</DialogTitle>
                <DialogDescription>
                  Names are lowercase, and cannot be changed later.
                </DialogDescription>
              </DialogHeader>
              <Input placeholder="events_raw" />
              <DialogFooter>
                <DialogClose render={<Button variant="outline" size="sm" />}>
                  Cancel
                </DialogClose>
                <Button size="sm">Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="sm" />}>
              Open sheet
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Run history</SheetTitle>
                <SheetDescription>
                  The sheet is also what the sidebar collapses into on mobile.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </Panel>

      <Panel title="Alert dialog and confirm" note="`useConfirm()` is the promise-based replacement for window.confirm().">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setAlertOpen(true)}>
            Alert dialog
          </Button>
          <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Drop billing_export?</AlertDialogTitle>
                <AlertDialogDescription>
                  12,004 rows will be deleted. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAlertOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => setAlertOpen(false)}>
                  Drop it
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const ok = await confirm({
                title: "Drop billing_export?",
                message: "12,004 rows will be deleted.",
                destructive: true,
                confirmText: "Drop it",
              })
              toast(ok ? "Dataset dropped" : "Cancelled", ok ? "success" : "info")
            }}
          >
            useConfirm()
          </Button>
        </div>
      </Panel>

      <Panel title="Toast" note="Each toast is announced — errors as role=alert, the rest as role=status.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => toast("Snapshot saved", "success")}>
            success
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast("Connection refused", "error")}>
            error
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast("Compaction queued", "info")}>
            info
          </Button>
        </div>
      </Panel>

      <Panel title="Dropdown menu">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            Actions <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>events_raw</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Copy /> Duplicate
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Panel>
    </Grid>
  )
}

/* ───────────────────────────── 6. feedback ───────────────────────────────── */

const SAMPLE = `## What changed

The **billing_export** job failed on its third retry. Two things to check:

1. the upstream \`sessions_hourly\` table is *degraded*
2. the warehouse credential expired on Tuesday

\`\`\`sql
select count(*) from billing_export where day = current_date;
\`\`\`

Links are shown as text, never as anchors [1].`

function FeedbackSection() {
  return (
    <div className="space-y-4">
      <Grid>
        <Panel title="Alert">
          <div className="space-y-3">
            <Alert>
              <CircleAlert />
              <AlertTitle>Compaction is behind</AlertTitle>
              <AlertDescription>
                The last run finished 40 minutes late.
              </AlertDescription>
              <AlertAction>
                <Button size="xs" variant="outline">Retry</Button>
              </AlertAction>
            </Alert>
            <Alert>
              <TriangleAlert />
              <AlertTitle>No warehouse credential</AlertTitle>
            </Alert>
          </div>
        </Panel>

        <Panel title="ErrorBox and EmptyState" note="The two surfaces that otherwise get reinvented on every page.">
          <div className="space-y-4">
            <ErrorBox
              msg="connect ECONNREFUSED 10.0.4.19:5432"
              hint={<>The pond is unreachable — check the network policy.</>}
              action={<Button size="xs" variant="outline">Retry</Button>}
            />
            <Separator />
            <EmptyState
              icon={Inbox}
              title="No datasets yet"
              hint="Connect a source and the first sync will fill this in."
              action={<Button size="sm" className="mt-1">Connect a source</Button>}
            />
          </div>
        </Panel>
      </Grid>

      <Grid>
        <Panel title="Markdown" note="A deliberately small subset — the parts a model actually emits. HTML is never interpreted, and URLs are never turned into anchors.">
          <Markdown text={SAMPLE} citations />
        </Panel>

        <Panel title="Card" note="Card is the only primitive that applies .dp-surface for you.">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="size-4" /> events_raw
              </CardTitle>
              <CardDescription className="text-xs">
                Partitioned by day · 12 columns
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
              <span className="dp-num">1,408,222</span> rows, last synced 4 minutes ago.
            </CardContent>
            <CardFooter className="gap-2 p-4 pt-0">
              <Button size="sm">Open</Button>
              <Button size="sm" variant="outline">Schema</Button>
            </CardFooter>
          </Card>
        </Panel>
      </Grid>
    </div>
  )
}

/* ───────────────────────────────── index ────────────────────────────────── */

export const SECTIONS = [
  {
    id: "tokens",
    title: "Tokens",
    icon: "Palette",
    note: "Every colour in the system, read live from the stylesheet.",
    render: TokensSection,
  },
  {
    id: "foundations",
    title: "Foundations",
    icon: "Layers",
    note: "Radius, elevation, the gradient, and the numeral and font tokens.",
    render: FoundationsSection,
  },
  {
    id: "controls",
    title: "Controls",
    icon: "Blocks",
    note: "Everything a person clicks or types into.",
    render: ControlsSection,
  },
  {
    id: "data",
    title: "Data display",
    icon: "Table2",
    note: "Tables, tabs, and the loading states that go with them.",
    render: DataSection,
  },
  {
    id: "overlays",
    title: "Overlays",
    icon: "Radio",
    note: "Anything that floats above the page, plus the two provider-backed helpers.",
    render: OverlaysSection,
  },
  {
    id: "feedback",
    title: "Feedback",
    icon: "Type",
    note: "Alerts, errors, empty states, and rendered model output.",
    render: FeedbackSection,
  },
] as const
