import * as React from "react"

/** How close to the bottom still counts as "at the bottom", in pixels. Sub-pixel
 *  scroll positions and zoom mean an exact comparison never holds. */
const THRESHOLD = 32

/** Pure so it can be exercised without a DOM. */
export function isNearBottom(
  el: { scrollTop: number; scrollHeight: number; clientHeight: number },
  threshold = THRESHOLD
) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
}

/** Keeps a scroll container pinned to the bottom as content streams in — but only
 *  while the reader has left it there.
 *
 *  The behaviour people actually want, and the reason this is not a one-liner: if
 *  someone has scrolled up to re-read an earlier answer, yanking them back down on
 *  every token is worse than not following at all. So the container follows new
 *  content only while it is already at the bottom, and stops the moment they scroll
 *  away. `pinned` is exposed so a "jump to latest" affordance can be shown when it
 *  is false.
 */
export function useStickToBottom<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [pinned, setPinned] = React.useState(true)
  // Read by the observer callback, which must not re-subscribe on every change.
  const pinnedRef = React.useRef(true)

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = ref.current
    if (!el) return
    pinnedRef.current = true
    setPinned(true)
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const onScroll = () => {
      const next = isNearBottom(el)
      pinnedRef.current = next
      setPinned(next)
    }
    el.addEventListener("scroll", onScroll, { passive: true })

    // Content growing is what should trigger a follow, not a timer.
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current) el.scrollTop = el.scrollHeight
    })
    observer.observe(el)
    for (const child of Array.from(el.children)) observer.observe(child)

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of Array.from(record.addedNodes)) {
          if (node instanceof Element) observer.observe(node)
        }
      }
      if (pinnedRef.current) el.scrollTop = el.scrollHeight
    })
    mutations.observe(el, { childList: true, subtree: true })

    return () => {
      el.removeEventListener("scroll", onScroll)
      observer.disconnect()
      mutations.disconnect()
    }
  }, [])

  return { ref, pinned, scrollToBottom }
}
