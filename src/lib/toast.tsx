"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const TOAST_DURATION = 4000

/** Icon colour uses the SOLID status step: an icon is non-text content, so 3:1 is the
 *  bar and the vivid value is the right one. The message itself stays `text-foreground`
 *  rather than tinting to the status colour — a sentence in amber is the combination
 *  that fails contrast, and the icon plus the border already carry the semantics. */
const TONE: Record<ToastType, { icon: typeof Info; color: string }> = {
  success: { icon: CheckCircle, color: "var(--dp-good)" },
  error: { icon: AlertCircle, color: "var(--dp-bad)" },
  info: { icon: Info, color: "var(--dp-aqua)" },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, type }])
    timers.current.set(id, setTimeout(() => dismiss(id), TOAST_DURATION))
  }, [dismiss])

  // Unmounting with toasts still on screen would otherwise leave timers running that
  // call setState on a dead tree.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[var(--dp-z-toast)] flex flex-col gap-2"
      >
        {toasts.map((t) => {
          const { icon: Icon, color } = TONE[t.type]
          return (
            <div
              key={t.id}
              // An error interrupts; the other two wait for a pause in speech. The roles
              // carry the live-region semantics, so the container must not also be one —
              // nesting them makes screen readers announce twice.
              role={t.type === "error" ? "alert" : "status"}
              className="dp-elevated flex min-w-[300px] items-center gap-3 rounded-lg border bg-popover px-4 py-3 text-popover-foreground animate-in slide-in-from-right"
              style={{ borderColor: color }}
            >
              <Icon className="h-5 w-5 shrink-0" style={{ color }} aria-hidden="true" />
              <p className="flex-1 text-sm">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
