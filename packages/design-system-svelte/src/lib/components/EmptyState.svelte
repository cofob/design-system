<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
    title: string;
    description?: string;
    icon?: Snippet;
    action?: Snippet;
    children?: Snippet;
  }

  let { title, description, icon, action, children, class: className, ...rest }: Props = $props();
</script>

<div class={cx("cf-empty-state", className)} {...rest}>
  {#if icon}<div class="cf-empty-state__icon">{@render icon()}</div>{/if}
  <h2 class="cf-empty-state__title">{title}</h2>
  {#if description}<p class="cf-empty-state__description">{description}</p>{/if}
  {@render children?.()}
  {#if action}<div class="cf-empty-state__action">{@render action()}</div>{/if}
</div>
