<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLFieldsetAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import Radio from "./Radio.svelte";

  interface RadioOption {
    value: string;
    label: string;
    description?: string | undefined;
    disabled?: boolean | undefined;
  }

  interface Props extends Omit<HTMLFieldsetAttributes, "children" | "onchange"> {
    name: string;
    label: string;
    options?: readonly RadioOption[];
    value?: string;
    defaultValue?: string;
    description?: string;
    error?: string;
    orientation?: "horizontal" | "vertical";
    children?: Snippet;
    onValueChange?: (value: string) => void;
  }

  let {
    name,
    label,
    options = [],
    defaultValue = "",
    value = $bindable(defaultValue),
    description,
    error,
    orientation = "vertical",
    children,
    onValueChange,
    class: className,
    disabled = false,
    "aria-describedby": ariaDescribedby,
    ...rest
  }: Props = $props();

  const generatedId = $props.id();
  const descriptionId = `${generatedId}-description`;
  const errorId = `${generatedId}-error`;

  function choose(next: string) {
    if (value === next) return;
    value = next;
    onValueChange?.(next);
  }
</script>

<fieldset
  class={cx("cf-radio-group", className)}
  data-orientation={orientation}
  data-invalid={error ? true : undefined}
  aria-describedby={[ariaDescribedby, error ? errorId : description ? descriptionId : undefined]
    .filter(Boolean)
    .join(" ") || undefined}
  {disabled}
  {...rest}
>
  <legend class="cf-radio-group__legend">{label}</legend>
  {#if description}<div class="cf-radio-group__description" id={descriptionId}>{description}</div>{/if}
  <div class="cf-radio-group__options">
    {#each options as option (option.value)}
      <Radio
        {name}
        value={option.value}
        label={option.label}
        description={option.description}
        disabled={option.disabled}
        checked={value === option.value}
        onCheckedChange={(checked) => checked && choose(option.value)}
      />
    {/each}
    {@render children?.()}
  </div>
  {#if error}<div class="cf-radio-group__error" id={errorId} role="alert">{error}</div>{/if}
</fieldset>
