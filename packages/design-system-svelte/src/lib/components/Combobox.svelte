<script lang="ts">
  import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface ComboboxOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "onchange"> {
    label: string;
    options: readonly ComboboxOption[];
    value?: string;
    defaultValue?: string;
    inputValue?: string;
    defaultInputValue?: string;
    name?: string;
    placeholder?: string;
    hint?: string;
    disabled?: boolean;
    required?: boolean;
    noResultsLabel?: string;
    inputProps?: Omit<HTMLInputAttributes, "value" | "name">;
    onValueChange?: (value: string, option: ComboboxOption) => void;
    onInputValueChange?: (value: string) => void;
  }

  let {
    label,
    options,
    defaultValue = "",
    value = $bindable(defaultValue),
    defaultInputValue,
    inputValue = $bindable(
      defaultInputValue ?? options.find((option) => option.value === value)?.label ?? "",
    ),
    name,
    placeholder,
    hint,
    disabled = false,
    required = false,
    noResultsLabel = "No results found",
    inputProps = {},
    onValueChange,
    onInputValueChange,
    class: className,
    onfocusout,
    ...rest
  }: Props = $props();

  const generatedId = $props.id();
  const inputId = $derived(inputProps.id ?? `cf-combobox-${generatedId}`);
  const listboxId = $derived(`${inputId}-listbox`);
  const hintId = $derived(hint ? `${inputId}-hint` : undefined);
  let open = $state(false);
  let activeIndex = $state(0);
  let input: HTMLInputElement;

  const selectedOption = $derived(options.find((option) => option.value === value));
  const filteredOptions = $derived.by(() => {
    const query = inputValue.trim().toLocaleLowerCase();
    if (!query || selectedOption?.label === inputValue) return options;
    return options.filter((option) =>
      `${option.label} ${option.description ?? ""}`.toLocaleLowerCase().includes(query),
    );
  });
  const enabledOptions = $derived(filteredOptions.filter((option) => !option.disabled));
  const activeOption = $derived(
    enabledOptions[Math.min(activeIndex, Math.max(0, enabledOptions.length - 1))],
  );

  function slug(value: string) {
    return value
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function choose(option: ComboboxOption) {
    if (option.disabled) return;
    value = option.value;
    inputValue = option.label;
    onInputValueChange?.(inputValue);
    onValueChange?.(value, option);
    open = false;
  }

  function move(offset: number) {
    if (enabledOptions.length === 0) return;
    open = true;
    activeIndex =
      (((activeIndex + offset) % enabledOptions.length) + enabledOptions.length) % enabledOptions.length;
  }

  function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    inputProps.oninput?.(event);
    if (event.defaultPrevented) return;
    inputValue = event.currentTarget.value;
    onInputValueChange?.(inputValue);
    activeIndex = 0;
    open = true;
  }

  function handleKeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) {
    inputProps.onkeydown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home" && open) {
      event.preventDefault();
      activeIndex = 0;
    } else if (event.key === "End" && open) {
      event.preventDefault();
      activeIndex = Math.max(0, enabledOptions.length - 1);
    } else if (event.key === "Enter" && open && activeOption) {
      event.preventDefault();
      choose(activeOption);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      open = false;
    }
  }
</script>

<div
  class={cx("cf-combobox", className)}
  data-state={open ? "open" : "closed"}
  data-value={value || undefined}
  onfocusout={(event) => {
    onfocusout?.(event);
    if (!event.defaultPrevented && !event.currentTarget.contains(event.relatedTarget as Node | null))
      open = false;
  }}
  {...rest}
>
  <label class="cf-combobox__label" for={inputId}>{label}</label>
  <div class="cf-combobox__input-wrap">
    <input
      {...inputProps}
      bind:this={input}
      id={inputId}
      class={cx("cf-input", "cf-combobox__input", inputProps.class)}
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      aria-controls={listboxId}
      aria-expanded={open}
      aria-activedescendant={open && activeOption ? `${listboxId}-${slug(activeOption.value)}` : undefined}
      aria-describedby={[inputProps["aria-describedby"], hintId].filter(Boolean).join(" ") || undefined}
      {placeholder}
      value={inputValue}
      {disabled}
      {required}
      onfocus={(event) => {
        inputProps.onfocus?.(event);
        if (!event.defaultPrevented && !disabled) {
          activeIndex = 0;
          open = true;
        }
      }}
      oninput={handleInput}
      onkeydown={handleKeydown}
    />
  </div>
  {#if name}<input type="hidden" {name} {value} />{/if}
  {#if hint}<div class="cf-combobox__hint" id={hintId}>{hint}</div>{/if}
  <div class="cf-combobox__listbox" id={listboxId} role="listbox" hidden={!open}>
    {#if filteredOptions.length}
      {#each filteredOptions as option (option.value)}
        {@const enabledIndex = enabledOptions.indexOf(option)}
        <div
          class="cf-combobox__option"
          id={`${listboxId}-${slug(option.value)}`}
          role="option"
          tabindex="-1"
          aria-selected={option.value === value}
          aria-disabled={option.disabled || undefined}
          data-active={enabledIndex >= 0 && option === activeOption ? true : undefined}
          onpointerdown={(event) => {
            event.preventDefault();
            choose(option);
            input.focus();
          }}
          onpointermove={() => {
            if (enabledIndex >= 0) activeIndex = enabledIndex;
          }}
        >
          <span>{option.label}</span>
          {#if option.description}<span class="cf-combobox__option-description">{option.description}</span
            >{/if}
        </div>
      {/each}
    {:else}
      <div class="cf-combobox__empty">{noResultsLabel}</div>
    {/if}
  </div>
</div>
