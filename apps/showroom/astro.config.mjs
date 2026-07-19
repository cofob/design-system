import react from "@astrojs/react";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";
import socialImages from "./integrations/social-images.mjs";

export default defineConfig({
  site: "https://design.cofob.dev",
  output: "static",
  devToolbar: { enabled: false },
  integrations: [react(), svelte(), socialImages()],
  vite: {
    ssr: {
      noExternal: ["@cofob/design-system-css", "@cofob/design-system-react", "@cofob/design-system-svelte"],
    },
  },
});
