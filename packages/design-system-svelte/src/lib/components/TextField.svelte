<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Size } from "../types.js";

  interface Props extends Omit<HTMLInputAttributes, "children" | "size" | "value"> {
    value?: string;
    label?: string;
    description?: string;
    error?: string;
    size?: Size;
    leading?: Snippet;
    trailing?: Snippet;
  }

  const generatedId = $props.id();

  let {
    value = $bindable(""),
    label,
    description,
    error,
    size = "md",
    leading,
    trailing,
    class: className,
    id,
    required = false,
    "aria-describedby": consumerDescribedBy,
    ...rest
  }: Props = $props();

  const inputId = $derived(id ?? `cf-text-field-${generatedId}`);
  const descriptionId = $derived(`${inputId}-description`);
  const errorId = $derived(`${inputId}-error`);
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
  <span class={cx("cf-input", className)} data-size={size}>
    {#if leading}<span class="cf-input__leading">{@render leading()}</span>{/if}
    <input
      bind:value
      id={inputId}
      {required}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={describedBy}
      {...rest}
    />
    {#if trailing}<span class="cf-input__trailing">{@render trailing()}</span>{/if}
  </span>
  {#if error}<span id={errorId} class="cf-field__error" role="alert">{error}</span>{:else if description}<span
      id={descriptionId}
      class="cf-field__description">{description}</span
    >{/if}
</label>
