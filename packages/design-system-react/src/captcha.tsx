import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { CAPTCHA_LABELS } from "@cofob/design-system-css";
import type { CaptchaLabels, CaptchaState } from "@cofob/design-system-css";
import { cx } from "./utils.js";

export interface CaptchaProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Controlled visual state. Verification is intentionally handled by the consumer. */
  state?: CaptchaState;
  /** Localized copy for the four visual states. */
  labels?: Partial<CaptchaLabels>;
}

/**
 * Presentational CAPTCHA surface inspired by Cap's public widget.
 *
 * This component performs no proof-of-work, requests, or token handling. Consumers
 * own `state` and connect their verification implementation through native button props.
 */
export const Captcha = forwardRef<HTMLButtonElement, CaptchaProps>(function Captcha(
  {
    state = "idle",
    labels: labelOverrides,
    className,
    disabled = false,
    type = "button",
    "aria-label": ariaLabel,
    ...props
  },
  ref,
) {
  const labels = { ...CAPTCHA_LABELS, ...labelOverrides };
  const visualState = disabled ? "idle" : state;

  return (
    <button
      ref={ref}
      type={type}
      className={cx("cf-captcha", className)}
      data-state={visualState}
      data-disabled={disabled || undefined}
      disabled={disabled}
      aria-label={ariaLabel ?? labels[visualState]}
      aria-busy={visualState === "verifying" || undefined}
      {...props}
    >
      <span className="cf-captcha__indicator" aria-hidden="true">
        <svg className="cf-captcha__progress" viewBox="0 0 32 32">
          <circle className="cf-captcha__progress-track" cx="16" cy="16" r="12" />
          <circle className="cf-captcha__progress-value" cx="16" cy="16" r="12" />
        </svg>
        <svg className="cf-captcha__status cf-captcha__status--success" viewBox="0 0 24 24">
          <path pathLength={1} d="m5 12 4.5 4.5L19 7" />
        </svg>
        <svg className="cf-captcha__status cf-captcha__status--error" viewBox="0 0 24 24">
          <path pathLength={1} d="M7 7l10 10M17 7 7 17" />
        </svg>
      </span>

      <span className="cf-captcha__copy" aria-hidden="true">
        {(Object.keys(CAPTCHA_LABELS) as CaptchaState[]).map((labelState) => (
          <span className="cf-captcha__label" data-captcha-label={labelState} key={labelState}>
            {labels[labelState]}
          </span>
        ))}
      </span>

      <span className="cf-visually-hidden" aria-live="polite" aria-atomic="true">
        {labels[visualState]}
      </span>
    </button>
  );
});
