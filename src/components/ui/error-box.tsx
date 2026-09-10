import { AlertCircle } from "lucide-react"
import type { ReactNode } from "react"

/** Consistent inline error surface (replaces ad-hoc amber/red error divs).
 *
 *  `hint` is for the app-specific "here is probably why" follow-up — a raw error
 *  string rarely tells the user what to do about it. Pass a node that points them
 *  at the fix; it renders indented under the message.
 *
 *      <ErrorBox
 *        msg={err}
 *        hint={/gateway|not configured/i.test(err) && (
 *          <>No model is registered — add one under <a href="/settings">Settings</a>.</>
 *        )}
 *      />
 */
export function ErrorBox({ msg, action, hint, className = "" }: {
  msg?: string | null
  action?: ReactNode          // optional retry button etc., rendered under the message
  hint?: ReactNode            // optional app-specific explanation of the likely cause
  className?: string
}) {
  if (!msg) return null
  return (
    <div className={`rounded-md border border-[var(--dp-bad)]/30 bg-[var(--dp-bad)]/10 px-3 py-2 text-xs text-[var(--dp-bad-text)] space-y-1 ${className}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        {/* The message is whatever the server said, in whatever language it says it. */}
        <span dir="auto">{msg}</span>
      </div>
      {action && <div className="ps-6 pt-1">{action}</div>}
      {hint && <div className="ps-6">{hint}</div>}
    </div>
  )
}

/** Consistent empty-state surface (icon + title + hint + optional action). */
export function EmptyState({ icon: Icon, title, hint, action, className = "" }: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  hint?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center gap-2 text-muted-foreground ${className}`}>
      {Icon && <Icon className="h-8 w-8 opacity-30" />}
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs opacity-70 max-w-sm">{hint}</p>}
      {action}
    </div>
  )
}
