import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/package').PackageConfig & import('svelte/compiler').CompileOptions} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: { runes: true },
};

export default config;
