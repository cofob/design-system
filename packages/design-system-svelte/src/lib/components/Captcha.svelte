<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { CAPTCHA_LABELS } from "@cofob/design-system-css";
  import type { CaptchaLabels, CaptchaState } from "@cofob/design-system-css";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLButtonAttributes, "children"> {
    /** Controlled visual state. Verification is intentionally handled by the consumer. */
    state?: CaptchaState;
    labels?: Partial<CaptchaLabels>;
  }

  let {
    state = "idle",
    labels: labelOverrides,
    disabled = false,
    type = "button",
    class: className,
    "aria-label": ariaLabel,
    ...rest
  }: Props = $props();

  const states: CaptchaState[] = ["idle", "verifying", "success", "error"];
  const labels = $derived({ ...CAPTCHA_LABELS, ...labelOverrides });
  const visualState = $derived(disabled ? "idle" : state);
</script>

<!--
  Presentational only: this button performs no proof-of-work, requests, or token handling.
  Consumers own `state` and connect verification through native button event props.
-->
<button
  {type}
  class={cx("cf-captcha", className)}
  data-state={visualState}
  data-disabled={disabled || undefined}
  {disabled}
  aria-label={ariaLabel ?? labels[visualState]}
  aria-busy={visualState === "verifying" || undefined}
  {...rest}
>
  <span class="cf-captcha__indicator" aria-hidden="true">
    <svg class="cf-captcha__progress" viewBox="0 0 32 32">
      <circle class="cf-captcha__progress-track" cx="16" cy="16" r="12"></circle>
      <circle class="cf-captcha__progress-value" cx="16" cy="16" r="12"></circle>
    </svg>
    <svg class="cf-captcha__status cf-captcha__status--success" viewBox="0 0 24 24">
      <path pathLength="1" d="m5 12 4.5 4.5L19 7"></path>
    </svg>
    <svg class="cf-captcha__status cf-captcha__status--error" viewBox="0 0 24 24">
      <path pathLength="1" d="M7 7l10 10M17 7 7 17"></path>
    </svg>
  </span>

  <span class="cf-captcha__copy" aria-hidden="true">
    {#each states as labelState}
      <span class="cf-captcha__label" data-captcha-label={labelState}>{labels[labelState]}</span>
    {/each}
  </span>

  <span class="cf-visually-hidden" aria-live="polite" aria-atomic="true">{labels[visualState]}</span>
</button>
