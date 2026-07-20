"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
  type MutableRefObject,
  type Ref,
} from "react";

import {
  createAsciinemaPlayerController,
  resolveAsciinemaPlayerLabels,
  type AsciinemaPlayerLabels,
  type Options,
  type Player,
  type Source,
} from "../index.js";
import { cx } from "../internal.js";

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as MutableRefObject<T | null>).current = value;
}

export interface AsciinemaPlayerProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  source: Source;
  options?: Options;
  label?: string;
  fallbackHref?: string;
  labels?: Partial<AsciinemaPlayerLabels>;
  onPlayerReady?: (player: Player) => void;
  onPlayerLoadError?: (error: unknown) => void;
}

/** SSR-safe design-system shell that mounts asciinema-player after hydration. */
export const AsciinemaPlayer = forwardRef<HTMLElement, AsciinemaPlayerProps>(function AsciinemaPlayer(
  {
    source,
    options,
    label = "Terminal recording",
    fallbackHref,
    labels,
    onPlayerReady,
    onPlayerLoadError,
    className,
    ...props
  },
  forwardedRef,
) {
  const rootRef = useRef<HTMLElement | null>(null);
  const readyCallbackRef = useRef(onPlayerReady);
  const errorCallbackRef = useRef(onPlayerLoadError);
  readyCallbackRef.current = onPlayerReady;
  errorCallbackRef.current = onPlayerLoadError;

  const setRoot = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      setRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  const loadingTitle = labels?.loadingTitle;
  const errorTitle = labels?.errorTitle;
  const fallbackLink = labels?.fallbackLink;
  const resolvedLabels = useMemo(
    () =>
      resolveAsciinemaPlayerLabels({
        ...(loadingTitle === undefined ? {} : { loadingTitle }),
        ...(errorTitle === undefined ? {} : { errorTitle }),
        ...(fallbackLink === undefined ? {} : { fallbackLink }),
      }),
    [loadingTitle, errorTitle, fallbackLink],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const controller = createAsciinemaPlayerController(root, {
      source,
      ...(options ? { options } : {}),
      ...(fallbackHref ? { fallbackHref } : {}),
      labels: resolvedLabels,
      onPlayerReady: (player) => readyCallbackRef.current?.(player),
      onPlayerLoadError: (error) => errorCallbackRef.current?.(error),
    });
    return () => controller.destroy();
  }, [source, options, fallbackHref, resolvedLabels]);

  return (
    <figure
      {...props}
      ref={setRoot}
      className={cx("cf-asciinema-player", className)}
      aria-label={label}
      aria-busy="true"
      data-cf-asciinema-player
      data-state="loading"
    >
      <div className="cf-stack" data-gap="sm" data-align="stretch" data-cf-asciinema-player-shell>
        <div
          className="cf-card cf-asciinema-player__stage"
          data-variant="default"
          data-padding="none"
          hidden
          data-cf-asciinema-player-stage
        >
          <div data-cf-asciinema-player-mount />
        </div>
        <div
          className="cf-alert cf-asciinema-player__fallback"
          data-tone="info"
          role="status"
          data-cf-asciinema-player-fallback
        >
          <div className="cf-alert__content">
            <div className="cf-alert__title" data-cf-asciinema-player-fallback-title>
              {resolvedLabels.loadingTitle}
            </div>
            <div className="cf-alert__description">
              {fallbackHref ? (
                <a className="cf-link" href={fallbackHref} data-cf-asciinema-player-fallback-link>
                  {resolvedLabels.fallbackLink}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
});
