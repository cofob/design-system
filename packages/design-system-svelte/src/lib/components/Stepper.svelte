<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface StepperItem {
    id: string;
    label: string;
    description?: string;
    href?: string;
    disabled?: boolean;
    state?: "complete" | "current" | "upcoming";
  }

  interface Props extends HTMLAttributes<HTMLElement> {
    items: readonly StepperItem[];
    currentStep: string;
    label?: string;
    orientation?: "horizontal" | "vertical";
    onStepChange?: (id: string) => void;
  }

  let {
    items,
    currentStep,
    label = "Progress",
    orientation = "horizontal",
    onStepChange,
    class: className,
    ...rest
  }: Props = $props();
  const currentIndex = $derived(
    Math.max(
      0,
      items.findIndex((item) => item.id === currentStep),
    ),
  );
</script>

<nav class={cx("cf-stepper", className)} aria-label={label} data-orientation={orientation} {...rest}>
  <ol class="cf-stepper__list">
    {#each items as item, index (item.id)}
      {@const state =
        item.state ?? (index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming")}
      <li class="cf-stepper__item" data-state={state}>
        {#if item.href && !item.disabled}
          <a
            class="cf-stepper__trigger"
            href={item.href}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span class="cf-stepper__indicator" aria-hidden="true"
              >{state === "complete" ? "✓" : index + 1}</span
            >
            <span class="cf-stepper__label">{item.label}</span>
            {#if item.description}<span class="cf-stepper__description">{item.description}</span>{/if}
          </a>
        {:else if onStepChange && !item.disabled}
          <button
            class="cf-stepper__trigger"
            type="button"
            aria-current={state === "current" ? "step" : undefined}
            onclick={() => onStepChange?.(item.id)}
          >
            <span class="cf-stepper__indicator" aria-hidden="true"
              >{state === "complete" ? "✓" : index + 1}</span
            >
            <span class="cf-stepper__label">{item.label}</span>
            {#if item.description}<span class="cf-stepper__description">{item.description}</span>{/if}
          </button>
        {:else}
          <div class="cf-stepper__trigger" aria-current={state === "current" ? "step" : undefined}>
            <span class="cf-stepper__indicator" aria-hidden="true"
              >{state === "complete" ? "✓" : index + 1}</span
            >
            <span class="cf-stepper__label">{item.label}</span>
            {#if item.description}<span class="cf-stepper__description">{item.description}</span>{/if}
          </div>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
