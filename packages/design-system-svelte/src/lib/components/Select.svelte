<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLSelectAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { SelectOption, Size } from "../types.js";

  interface Props extends Omit<HTMLSelectAttributes, "children" | "size" | "value"> {
    value?: string;
    label?: string;
    description?: string;
    error?: string;
    placeholder?: string;
    options?: SelectOption[];
    size?: Size;
    children?: Snippet;
  }

  const generatedId = $props.id();

  let {
    value = $bindable(""),
    label,
    description,
    error,
    placeholder,
    options = [],
    size = "md",
    children,
    class: className,
    id,
    required = false,
    disabled = false,
    "aria-describedby": consumerDescribedBy,
    ...rest
  }: Props = $props();

  const selectId = $derived(id ?? `cf-select-${generatedId}`);
  const descriptionId = $derived(`${selectId}-description`);
  const errorId = $derived(`${selectId}-error`);
  const describedBy = $derived(
    [consumerDescribedBy, error ? errorId : description ? descriptionId : undefined]
      .filter(Boolean)
      .join(" ") || undefined,
  );
</script>

<label class="cf-field" data-invalid={Boolean(error) || undefined}>
  {#if label}<span class="cf-field__label"
      >{label}{#if required}<span aria-hidden="true"> *</span>{/if}</span
    >{/if}
  <span
    class="cf-select"
    data-size={size}
    data-invalid={Boolean(error) || undefined}
    data-disabled={disabled || undefined}
  >
    <select
      bind:value
      id={selectId}
      class={className}
      {required}
      {disabled}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={describedBy}
      {...rest}
    >
      {#if placeholder}<option value="" disabled>{placeholder}</option>{/if}
      {#each options as option (option.value)}
        <option value={option.value} disabled={option.disabled}>{option.label}</option>
      {/each}
      {@render children?.()}
    </select>
  </span>
  {#if error}<span id={errorId} class="cf-field__error" role="alert">{error}</span>{:else if description}<span
      id={descriptionId}
      class="cf-field__description">{description}</span
    >{/if}
</label>
