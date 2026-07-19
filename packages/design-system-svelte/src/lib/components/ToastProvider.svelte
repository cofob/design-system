<script lang="ts">
  import type { Snippet } from "svelte";
  import ToastViewport from "./ToastViewport.svelte";

  interface Props {
    children?: Snippet;
    viewport?: boolean;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  }

  let { children, viewport = true, position = "bottom-right" }: Props = $props();
</script>

{@render children?.()}
{#if viewport}<ToastViewport {position} />{/if}
