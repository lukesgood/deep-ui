/** `dom-accessibility-api` ships `dist/index.d.ts`, but its `exports` map has no
 *  `types` condition, so TypeScript cannot reach it under `moduleResolution:
 *  "bundler"`. This declares the one function `accessible-name.test.tsx` calls.
 *
 *  It is a shim over a packaging gap, not a description of the library: if the real
 *  signature changes, this will keep compiling and the test will be wrong. Delete it
 *  the day the package adds a `types` condition. */
declare module "dom-accessibility-api" {
  export function computeAccessibleName(element: Element): string
}
