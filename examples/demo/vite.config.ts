import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"

import { panelSource } from "./vite-plugin-panel-source"

// The demo consumes the template the same way a real app does: through the `@/*`
// alias, pointed at ../../src. Nothing is copied, so what you see on the page is
// exactly the source in this repo.
export default defineConfig({
  base: "./",
  plugins: [panelSource(), react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) },
    dedupe: ["react", "react-dom"],
  },
})
