import { test } from "node:test"
import assert from "node:assert/strict"

import { isNearBottom } from "../src/hooks/use-stick-to-bottom.ts"

const box = (scrollTop: number, scrollHeight = 1000, clientHeight = 400) => ({
  scrollTop,
  scrollHeight,
  clientHeight,
})

test("a container scrolled to the exact bottom is at the bottom", () => {
  assert.equal(isNearBottom(box(600)), true)
})

test("within the threshold still counts — sub-pixel scroll never lands exactly", () => {
  assert.equal(isNearBottom(box(580)), true) // 20px away
  assert.equal(isNearBottom(box(568)), true) // 32px away, the boundary
})

test("past the threshold does not count, so a reader who scrolled up is left alone", () => {
  assert.equal(isNearBottom(box(567)), false) // 33px away
  assert.equal(isNearBottom(box(0)), false)
})

test("content shorter than the viewport is always at the bottom", () => {
  // Otherwise a conversation with one short message would show a jump-to-latest
  // button pointing at nothing.
  assert.equal(isNearBottom(box(0, 200, 400)), true)
})

test("the threshold is adjustable", () => {
  assert.equal(isNearBottom(box(500), 100), true)
  assert.equal(isNearBottom(box(500), 50), false)
})

test("overscroll past the bottom counts as the bottom", () => {
  // Momentum scrolling on macOS and iOS reports scrollTop beyond the maximum.
  assert.equal(isNearBottom(box(650)), true)
})
