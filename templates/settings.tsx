"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckboxGroup } from "@/components/ui/checkbox-group"
import {
  Field, FieldControl, FieldDescription, FieldError, FieldLabel, Fieldset,
  FieldsetLegend, Form,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumberField, NumberFieldGroup } from "@/components/ui/number-field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Slider, SliderLabel, SliderTrack, SliderValue } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/** A settings screen, which is mostly an exercise in grouping.
 *
 *  The shape worth copying: one `<Form>` per tab, `<Fieldset>` around anything that
 *  is a set rather than a single control, and a save bar that only appears once
 *  something has changed — a permanently enabled Save gives no signal about whether
 *  the work is done.
 *
 *  Every control here is a `<Field>` or inside a `<Fieldset>`, which is what makes
 *  the labels, hints and errors reach assistive technology. A settings page assembled
 *  out of bare `<label>` and `<input>` looks identical and announces almost nothing.
 */
export function Settings() {
  const [dirty, setDirty] = React.useState(false)
  const [retention, setRetention] = React.useState<number | readonly number[]>(90)
  const touch = () => setDirty(true)

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Applies to every dataset in this workspace.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="pt-4">
          <Card>
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-base">Workspace</CardTitle>
              <CardDescription className="text-sm">
                The name people see in invitations and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <Form onChange={touch}>
                <Field
                  name="workspace"
                  validate={(v) => (String(v ?? "") ? null : "A workspace name is required.")}
                  validationMode="onBlur"
                >
                  <FieldLabel>Name</FieldLabel>
                  <FieldControl render={<Input defaultValue="Deep Water" />} />
                  <FieldError />
                </Field>
                <Field name="workers">
                  <FieldLabel>Parallel workers</FieldLabel>
                  <FieldControl render={<NumberField defaultValue={4} min={1} max={64}><NumberFieldGroup /></NumberField>} />
                  <FieldDescription>
                    More workers finish sooner and cost more.
                  </FieldDescription>
                </Field>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="pt-4">
          <Card>
            <CardContent className="space-y-5 p-5">
              <Slider
                value={retention}
                onValueChange={(v) => { setRetention(v); touch() }}
                min={1}
                max={365}
              >
                <div className="flex items-baseline justify-between">
                  <SliderLabel>Keep rows for</SliderLabel>
                  <SliderValue />
                </div>
                <SliderTrack />
              </Slider>
              <Separator />
              <Fieldset>
                <FieldsetLegend>After the retention window</FieldsetLegend>
                <RadioGroup defaultValue="cold" onValueChange={touch}>
                  {[
                    { value: "cold", label: "Move to cold storage", hint: "Slower to read, much cheaper" },
                    { value: "delete", label: "Delete", hint: "Cannot be undone" },
                  ].map((o) => (
                    <label
                      key={o.value}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-primary/5"
                    >
                      <RadioGroupItem value={o.value} className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-medium">{o.label}</span>
                        <span className="block text-xs text-muted-foreground">{o.hint}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </Fieldset>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="pt-4">
          <Card>
            <CardContent className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label htmlFor="digest">Daily digest</Label>
                  <p className="text-xs text-muted-foreground">
                    One message at 09:00 instead of one per event.
                  </p>
                </div>
                <Switch id="digest" defaultChecked onCheckedChange={touch} />
              </div>
              <Separator />
              <Fieldset>
                <FieldsetLegend>Tell me when</FieldsetLegend>
                <CheckboxGroup defaultValue={["failed"]} onValueChange={touch}>
                  {[
                    { name: "failed", label: "A job fails" },
                    { name: "degraded", label: "A table is degraded for more than an hour" },
                    { name: "quota", label: "Storage passes 80% of quota" },
                  ].map((o) => (
                    <label key={o.name} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox name={o.name} />
                      {o.label}
                    </label>
                  ))}
                </CheckboxGroup>
              </Fieldset>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Appears only once there is something to save, so its presence is the signal. */}
      {dirty && (
        <div className="dp-elevated sticky bottom-4 flex items-center justify-between gap-4 rounded-xl border bg-card p-3">
          <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDirty(false)}>
              Discard
            </Button>
            <Button size="sm" onClick={() => setDirty(false)}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
