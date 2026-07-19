<script lang="ts">
  import { onMount } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import {
    activeToastViewport,
    dismissToast,
    finishToastDismissal,
    registerToastViewport,
    toasts,
  } from "../toast.js";

  interface Props extends Omit<HTMLAttributes<HTMLOListElement>, "children"> {
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    label?: string;
  }

  let { position = "bottom-right", label = "Notifications", class: className, ...rest }: Props = $props();
  const generatedId = $props.id();
  const viewportId = `cf-toast-viewport-${generatedId}`;

  onMount(() => registerToastViewport(viewportId));
</script>

<ol
  class={cx("cf-toast-viewport", className)}
  data-position={position}
  aria-label={label}
  aria-live="polite"
  aria-relevant="additions removals"
  {...rest}
>
  {#each $activeToastViewport === viewportId ? $toasts : [] as item (item.id)}
    <li
      class="cf-toast"
      data-state={item.state}
      data-tone={item.tone ?? "neutral"}
      role={item.tone === "danger" ? "alert" : "status"}
      onanimationend={(event) => {
        if (event.target === event.currentTarget && item.state === "closed") finishToastDismissal(item.id);
      }}
    >
      <div class="cf-toast__content">
        <p class="cf-toast__title">{item.title}</p>
        {#if typeof item.description === "string"}
          <p class="cf-toast__description">{item.description}</p>
        {:else if item.description}
          <div class="cf-toast__description">{@render item.description()}</div>
        {/if}
      </div>
      {#if item.actionLabel}
        <button
          type="button"
          class="cf-toast__action"
          onclick={() => {
            item.onAction?.();
            dismissToast(item.id);
          }}>{item.actionLabel}</button
        >
      {/if}
      <button
        type="button"
        class="cf-toast__close"
        aria-label="Dismiss notification"
        onclick={() => dismissToast(item.id)}>×</button
      >
    </li>
  {/each}
</ol>
