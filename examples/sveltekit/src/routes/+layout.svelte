<script lang="ts">
  import "@cofob/design-system-css/index.css";
  import { ThemeScript } from "@cofob/design-system-svelte";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <ThemeScript />
</svelte:head>

{@render children()}
