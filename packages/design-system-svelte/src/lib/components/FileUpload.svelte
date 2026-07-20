<script lang="ts">
  import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "onchange"> {
    label: string;
    files?: File[];
    defaultFiles?: File[];
    name?: string;
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    required?: boolean;
    maxFiles?: number;
    maxSize?: number;
    prompt?: string;
    hint?: string;
    removeLabel?: (file: File) => string;
    onFilesChange?: (files: readonly File[]) => void;
    inputProps?: Omit<HTMLInputAttributes, "type" | "name" | "accept" | "multiple">;
  }

  let {
    label,
    defaultFiles = [],
    files = $bindable(defaultFiles),
    name,
    accept,
    multiple = false,
    disabled = false,
    required = false,
    maxFiles,
    maxSize,
    prompt = "Choose files or drag them here",
    hint,
    removeLabel = (file) => `Remove ${file.name}`,
    onFilesChange,
    inputProps = {},
    class: className,
    ...rest
  }: Props = $props();

  const generatedId = $props.id();
  const inputId = $derived(inputProps.id ?? `cf-file-upload-${generatedId}`);
  const errorId = $derived(`${inputId}-error`);
  const limit = $derived(maxFiles ?? (multiple ? Number.POSITIVE_INFINITY : 1));
  let dragging = $state(false);
  let error = $state("");

  function accepts(file: File) {
    if (!accept) return true;
    return accept.split(",").some((entry) => {
      const rule = entry.trim().toLocaleLowerCase();
      if (rule.startsWith(".")) return file.name.toLocaleLowerCase().endsWith(rule);
      if (rule.endsWith("/*")) return file.type.toLocaleLowerCase().startsWith(rule.slice(0, -1));
      return file.type.toLocaleLowerCase() === rule;
    });
  }

  function formatSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function addFiles(incoming: readonly File[]) {
    const accepted = incoming.filter((file) => accepts(file) && (!maxSize || file.size <= maxSize));
    const rejected = incoming.length - accepted.length;
    const requested = multiple ? [...files, ...accepted] : accepted.slice(0, 1);
    files = requested.slice(0, limit);
    onFilesChange?.(files);
    error = rejected
      ? `${rejected} ${rejected === 1 ? "file was" : "files were"} not accepted.`
      : files.length < requested.length
        ? "Some files exceed the upload limit."
        : "";
  }
</script>

<div
  class={cx("cf-file-upload", className)}
  data-disabled={disabled || undefined}
  ondragenter={(event) => {
    event.preventDefault();
    if (!disabled) dragging = true;
  }}
  ondragover={(event) => event.preventDefault()}
  ondragleave={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) dragging = false;
  }}
  ondrop={(event) => {
    event.preventDefault();
    dragging = false;
    if (!disabled) addFiles(Array.from(event.dataTransfer?.files ?? []));
  }}
  {...rest}
>
  <label class="cf-file-upload__label" for={inputId}>{label}</label>
  <label class="cf-file-upload__dropzone" data-dragging={dragging || undefined} for={inputId}>
    <input
      {...inputProps}
      id={inputId}
      class={cx("cf-file-upload__input", inputProps.class)}
      type="file"
      {name}
      {accept}
      {multiple}
      {disabled}
      required={required && files.length === 0}
      aria-describedby={[inputProps["aria-describedby"], error ? errorId : undefined]
        .filter(Boolean)
        .join(" ") || undefined}
      onchange={(event) => {
        inputProps.onchange?.(event);
        if (!event.defaultPrevented) addFiles(Array.from(event.currentTarget.files ?? []));
        event.currentTarget.value = "";
      }}
    />
    <span class="cf-file-upload__prompt">{prompt}</span>
    {#if hint}<span class="cf-file-upload__hint">{hint}</span>{/if}
  </label>
  {#if error}<div class="cf-field__error" id={errorId} role="alert">{error}</div>{/if}
  {#if files.length}
    <ul class="cf-file-upload__files" aria-label="Selected files">
      {#each files as file, index (`${file.name}-${file.lastModified}-${index}`)}
        <li class="cf-file-upload__file">
          <span>
            <span>{file.name}</span>
            <span class="cf-file-upload__file-meta"> {formatSize(file.size)}</span>
          </span>
          <button
            class="cf-file-upload__remove"
            type="button"
            aria-label={removeLabel(file)}
            {disabled}
            onclick={() => {
              files = files.filter((_, fileIndex) => fileIndex !== index);
              onFilesChange?.(files);
            }}>Remove</button
          >
        </li>
      {/each}
    </ul>
  {/if}
</div>
