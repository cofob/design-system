<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Size } from "../types.js";

  interface Props extends Omit<HTMLTextareaAttributes, "children" | "value"> {
    value?: string;
    label?: string;
    description?: string;
    error?: string;
    size?: Size;
  }

  const generatedId = $props.id();

  let {
    value = $bindable(""),
    label,
    description,
    error,
    size = "md",
    class: className,
    id,
    required = false,
    "aria-describedby": consumerDescribedBy,
    ...rest
  }: Props = $props();

  const textareaId = $derived(id ?? `cf-textarea-${generatedId}`);
  const descriptionId = $derived(`${textareaId}-description`);
  const errorId = $derived(`${textareaId}-error`);
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
  <textarea
    bind:value
    id={textareaId}
    class={cx("cf-textarea", className)}
    data-size={size}
    {required}
    aria-invalid={error ? "true" : undefined}
    aria-describedby={describedBy}
    {...rest}></textarea>
  {#if error}<span id={errorId} class="cf-field__error" role="alert">{error}</span>{:else if description}<span
      id={descriptionId}
      class="cf-field__description">{description}</span
    >{/if}
</label>
