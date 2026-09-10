import { readdirSync } from "node:fs"
import { join } from "node:path"
import * as React from "react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { cleanup, render } from "@testing-library/react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckboxGroup } from "@/components/ui/checkbox-group"
import { Citation, Citations } from "@/components/ui/citations"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Conversation, ConversationActions, ConversationMessage, ConversationPending } from "@/components/ui/conversation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmptyState, ErrorBox } from "@/components/ui/error-box"
import { Field, FieldControl, FieldDescription, FieldError, FieldLabel, Fieldset, FieldsetLegend, Form } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Markdown } from "@/components/ui/markdown"
import { Menubar } from "@/components/ui/menubar"
import { Meter, MeterLabel, MeterTrack, MeterValue } from "@/components/ui/meter"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport } from "@/components/ui/navigation-menu"
import { NumberField, NumberFieldGroup } from "@/components/ui/number-field"
import { OtpField } from "@/components/ui/otp-field"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { PasswordInput } from "@/components/ui/password-input"
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { PreviewCard, PreviewCardContent, PreviewCardTrigger } from "@/components/ui/preview-card"
import { Progress, ProgressLabel, ProgressTrack, ProgressValue } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider, SliderLabel, SliderTrack, SliderValue } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@/components/ui/toolbar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ConfirmProvider } from "@/lib/confirm"
import { ToastProvider } from "@/lib/toast"

/** Every component, rendered once, in the state that mounts the most of it.
 *
 *  This is not coverage for its own sake. A `DropdownMenuLabel` outside a group used
 *  to throw during render, and a throw during render unmounts the whole React tree —
 *  so one component with a mistake in it blanked the entire page. Nothing caught it,
 *  because wiring a component and mounting one are different acts and only the first
 *  had been performed.
 *
 *  Overlays are rendered **open**, since a closed popup mounts almost nothing and
 *  would prove almost nothing.
 *
 *  The list is checked against the directory at the end, so a new component cannot
 *  quietly arrive without a case here.
 */

afterEach(cleanup)
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  }))
})

const CASES: Record<string, React.ReactNode> = {
  accordion: (
    <Accordion defaultValue={["a"]}>
      <AccordionItem value="a">
        <AccordionTrigger>Trigger</AccordionTrigger>
        <AccordionContent>Panel</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  alert: (
    <Alert>
      <AlertTitle>Title</AlertTitle>
      <AlertDescription>Description</AlertDescription>
    </Alert>
  ),
  "alert-dialog": (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogTitle>Title</AlertDialogTitle>
      </AlertDialogContent>
    </AlertDialog>
  ),
  avatar: <Avatar><AvatarFallback>LH</AvatarFallback></Avatar>,
  badge: <Badge>Badge</Badge>,
  breadcrumb: (
    <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>Here</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
  ),
  button: <Button>Button</Button>,
  card: (
    <Card>
      <CardHeader><CardTitle>Title</CardTitle><CardDescription>Description</CardDescription></CardHeader>
      <CardContent>Content</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>
  ),
  checkbox: <Checkbox />,
  "checkbox-group": <CheckboxGroup defaultValue={["a"]}><Checkbox name="a" /></CheckboxGroup>,
  citations: <Citations><Citation index={1} title="Source" location="a/b.md" /></Citations>,
  collapsible: (
    <Collapsible defaultOpen>
      <CollapsibleTrigger render={<Button />}>Trigger</CollapsibleTrigger>
      <CollapsibleContent>Panel</CollapsibleContent>
    </Collapsible>
  ),
  combobox: (
    <Combobox items={["a", "b"]} defaultOpen>
      <ComboboxInput aria-label="Search" />
      <ComboboxContent>
        <ComboboxEmpty>Nothing</ComboboxEmpty>
        <ComboboxList>{(v: string) => <ComboboxItem key={v} value={v}>{v}</ComboboxItem>}</ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
  composer: (
    <Composer><ComposerInput aria-label="Message" /><ComposerSubmit /></Composer>
  ),
  "context-menu": (
    <ContextMenu>
      <ContextMenuTrigger>Right-click</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Label</ContextMenuLabel>
        <ContextMenuItem>Item</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  conversation: (
    <Conversation>
      <ConversationMessage from="user">Question</ConversationMessage>
      <ConversationMessage from="assistant">
        Answer
        <ConversationActions><Button size="icon-xs" aria-label="Copy" /></ConversationActions>
      </ConversationMessage>
      <ConversationPending />
    </Conversation>
  ),
  dialog: (
    <Dialog open>
      <DialogContent>
        <DialogHeader><DialogTitle>Title</DialogTitle><DialogDescription>Description</DialogDescription></DialogHeader>
        <DialogFooter><Button>OK</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  "dropdown-menu": (
    <DropdownMenu open>
      <DropdownMenuTrigger render={<Button />}>Menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Label</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item<DropdownMenuShortcut>⌘K</DropdownMenuShortcut></DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  "error-box": (
    <>
      <ErrorBox msg="Something failed" hint={<>Try again</>} action={<Button size="xs">Retry</Button>} />
      <EmptyState title="Nothing here" hint="Add something" action={<Button size="sm">Add</Button>} />
    </>
  ),
  field: (
    <Form>
      <Fieldset>
        <FieldsetLegend>Legend</FieldsetLegend>
        <Field name="a">
          <FieldLabel>Label</FieldLabel>
          <FieldControl render={<Input />} />
          <FieldDescription>Hint</FieldDescription>
          <FieldError match="valueMissing">Required</FieldError>
        </Field>
      </Fieldset>
    </Form>
  ),
  input: <Input aria-label="Input" />,
  label: <Label htmlFor="x">Label</Label>,
  markdown: <Markdown text={"# H\n\n- a\n\n`code` **b** *c* [1]"} citations citationHref={(n) => `#c-${n}`} />,
  menubar: <Menubar><Button>File</Button></Menubar>,
  meter: (
    <Meter value={50}><MeterLabel>Label</MeterLabel><MeterValue /><MeterTrack /></Meter>
  ),
  "navigation-menu": (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent><NavigationMenuLink href="#">Link</NavigationMenuLink></NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
      <NavigationMenuViewport />
    </NavigationMenu>
  ),
  "number-field": <NumberField defaultValue={1}><NumberFieldGroup /></NumberField>,
  "otp-field": <OtpField length={6} />,
  pagination: (
    <Pagination>
      <PaginationContent>
        <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
        <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
        <PaginationItem><PaginationEllipsis /></PaginationItem>
        <PaginationItem><PaginationNext href="#" /></PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  "password-input": <PasswordInput aria-label="Password" />,
  popover: (
    <Popover open>
      <PopoverTrigger render={<Button />}>Open</PopoverTrigger>
      <PopoverContent><PopoverTitle>Title</PopoverTitle><PopoverDescription>Description</PopoverDescription></PopoverContent>
    </Popover>
  ),
  "preview-card": (
    <PreviewCard open>
      <PreviewCardTrigger render={<Button />}>Hover</PreviewCardTrigger>
      <PreviewCardContent>Preview</PreviewCardContent>
    </PreviewCard>
  ),
  progress: (
    <Progress value={50}><ProgressLabel>Label</ProgressLabel><ProgressValue /><ProgressTrack /></Progress>
  ),
  "radio-group": <RadioGroup defaultValue="a"><RadioGroupItem value="a" /></RadioGroup>,
  "scroll-area": <ScrollArea className="h-10">Content</ScrollArea>,
  select: (
    <Select defaultValue="a" open>
      <SelectTrigger aria-label="Select"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="a">A</SelectItem></SelectContent>
    </Select>
  ),
  separator: <Separator />,
  sheet: (
    <Sheet open>
      <SheetContent>
        <SheetHeader><SheetTitle>Title</SheetTitle><SheetDescription>Description</SheetDescription></SheetHeader>
      </SheetContent>
    </Sheet>
  ),
  sidebar: (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>Header</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Group</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Item"><span>Item</span></SidebarMenuButton>
                  <SidebarMenuBadge>3</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
        </SidebarContent>
        <SidebarFooter>Footer</SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset><SidebarTrigger /></SidebarInset>
    </SidebarProvider>
  ),

  skeleton: <Skeleton className="h-4 w-20" />,
  slider: (
    <Slider defaultValue={50}><SliderLabel>Label</SliderLabel><SliderValue /><SliderTrack /></Slider>
  ),
  switch: <Switch aria-label="Switch" />,
  table: (
    <Table>
      <TableCaption>Caption</TableCaption>
      <TableHeader><TableRow><TableHead>Head</TableHead></TableRow></TableHeader>
      <TableBody><TableRow><TableCell>Cell</TableCell></TableRow></TableBody>
      <TableFooter><TableRow><TableCell>Footer</TableCell></TableRow></TableFooter>
    </Table>
  ),
  tabs: (
    <Tabs defaultValue="a">
      <TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList>
      <TabsContent value="a">Panel</TabsContent>
    </Tabs>
  ),
  textarea: <Textarea aria-label="Textarea" />,
  toggle: <Toggle aria-label="Toggle">B</Toggle>,
  "toggle-group": <ToggleGroup defaultValue={["a"]}><Toggle value="a" aria-label="A">A</Toggle></ToggleGroup>,
  toolbar: (
    <Toolbar>
      <ToolbarGroup><ToolbarButton aria-label="Bold">B</ToolbarButton></ToolbarGroup>
      <ToolbarSeparator />
    </Toolbar>
  ),
  tooltip: (
    <Tooltip open>
      <TooltipTrigger render={<Button />}>Hover</TooltipTrigger>
      <TooltipContent>Tip</TooltipContent>
    </Tooltip>
  ),
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

for (const [name, element] of Object.entries(CASES)) {
  test(`${name} mounts`, () => {
    const { container } = render(<Providers>{element}</Providers>)
    // A throw would have failed already; this catches the quieter failure of a
    // component that renders nothing at all.
    expect(container.firstChild).not.toBeNull()
  })
}

test("every component in the directory has a case here", () => {
  // cwd, not import.meta.url: under happy-dom the module URL is not a file: URL.
  const dir = join(process.cwd(), "src/components/ui")
  const onDisk = readdirSync(dir)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx$/, ""))
    .sort()
  expect(Object.keys(CASES).sort()).toEqual(onDisk)
})
