import type { Controller } from "./types.js";

export type AnimatedStickerState =
  "loading" | "playing" | "paused" | "static" | "disabled" | "reduced-motion" | "fallback";

export type AnimatedStickerController = Controller;
export type AnimatedStickerToggleController = Controller;
export type AnimatedStickersEnabledListener = (enabled: boolean) => void;

export const ANIMATED_STICKERS_ATTRIBUTE = "data-cf-animated-stickers";
export const ANIMATED_STICKERS_STORAGE_KEY = "cf-animated-stickers";

interface AnimatedStickerPreferenceStore {
  enabled: boolean;
  observer: MutationObserver | undefined;
  root: HTMLElement;
  subscribers: Set<AnimatedStickersEnabledListener>;
}

const preferenceStores = new WeakMap<HTMLElement, AnimatedStickerPreferenceStore>();

function defaultPreferenceRoot(): HTMLElement | null {
  return typeof document === "undefined" ? null : document.documentElement;
}

function readAnimatedStickersEnabled(root: HTMLElement): boolean {
  return root.getAttribute(ANIMATED_STICKERS_ATTRIBUTE) !== "disabled";
}

function hydrateAnimatedStickersPreference(root: HTMLElement): void {
  if (root.hasAttribute(ANIMATED_STICKERS_ATTRIBUTE)) return;
  try {
    const stored = root.ownerDocument?.defaultView?.localStorage.getItem(ANIMATED_STICKERS_STORAGE_KEY);
    if (stored === "enabled" || stored === "disabled") {
      root.setAttribute(ANIMATED_STICKERS_ATTRIBUTE, stored);
    }
  } catch {
    // Storage may be denied. The markup/default contract remains usable.
  }
}

function persistAnimatedStickersPreference(root: HTMLElement, enabled: boolean): void {
  try {
    root.ownerDocument?.defaultView?.localStorage.setItem(
      ANIMATED_STICKERS_STORAGE_KEY,
      enabled ? "enabled" : "disabled",
    );
  } catch {
    // Storage denial must not prevent the current document from updating.
  }
}

function getPreferenceStore(root: HTMLElement): AnimatedStickerPreferenceStore {
  const existing = preferenceStores.get(root);
  if (existing) return existing;
  hydrateAnimatedStickersPreference(root);
  const store: AnimatedStickerPreferenceStore = {
    enabled: readAnimatedStickersEnabled(root),
    observer: undefined,
    root,
    subscribers: new Set(),
  };
  preferenceStores.set(root, store);
  return store;
}

function syncPreferenceStore(store: AnimatedStickerPreferenceStore): void {
  const enabled = readAnimatedStickersEnabled(store.root);
  if (enabled === store.enabled) return;
  store.enabled = enabled;
  for (const subscriber of store.subscribers) subscriber(enabled);
}

/** Reads the document-wide animated sticker flag. Missing markup defaults to enabled. */
export function getAnimatedStickersEnabled(root: HTMLElement | null = defaultPreferenceRoot()): boolean {
  if (!root) return true;
  hydrateAnimatedStickersPreference(root);
  return readAnimatedStickersEnabled(root);
}

/** Persists the preference, updates the document flag, and refreshes every mounted sticker. */
export function setAnimatedStickersEnabled(
  enabled: boolean,
  root: HTMLElement | null = defaultPreferenceRoot(),
): void {
  if (!root) return;
  root.setAttribute(ANIMATED_STICKERS_ATTRIBUTE, enabled ? "enabled" : "disabled");
  persistAnimatedStickersPreference(root, enabled);
  syncPreferenceStore(getPreferenceStore(root));
}

/** Subscribes to API changes and direct mutations of the global HTML flag. */
export function subscribeAnimatedStickersEnabled(
  listener: AnimatedStickersEnabledListener,
  root: HTMLElement | null = defaultPreferenceRoot(),
): () => void {
  if (!root) {
    listener(true);
    return () => undefined;
  }
  const store = getPreferenceStore(root);
  syncPreferenceStore(store);
  store.subscribers.add(listener);
  listener(store.enabled);
  if (!store.observer) {
    const MutationObserverConstructor = root.ownerDocument?.defaultView?.MutationObserver;
    if (MutationObserverConstructor) {
      store.observer = new MutationObserverConstructor(() => syncPreferenceStore(store));
      store.observer.observe(root, { attributes: true, attributeFilter: [ANIMATED_STICKERS_ATTRIBUTE] });
    }
  }
  return () => {
    store.subscribers.delete(listener);
    if (store.subscribers.size === 0) {
      store.observer?.disconnect();
      store.observer = undefined;
    }
  };
}

function setState(root: HTMLElement, state: AnimatedStickerState): void {
  root.dataset.state = state;
}

export function createAnimatedStickerController(root: HTMLElement): AnimatedStickerController {
  const initialState = root.getAttribute("data-state");
  const skeleton = root.querySelector<HTMLElement>(".cf-animated-sticker__skeleton");
  const skeletonParent = skeleton?.parentNode ?? null;
  const skeletonNextSibling = skeleton?.nextSibling ?? null;
  const video = root.querySelector<HTMLVideoElement>("[data-cf-animated-sticker-video]");
  const initialSrc = video?.getAttribute("src") ?? null;
  const source = video?.dataset.cfAnimatedStickerSrc ?? initialSrc;
  if (root.dataset.playback === "static") {
    video?.pause();
    video?.removeAttribute("src");
    setState(root, "static");
    return {
      destroy() {
        video?.pause();
        if (video && initialSrc !== null) video.setAttribute("src", initialSrc);
        if (initialState === null) root.removeAttribute("data-state");
        else root.setAttribute("data-state", initialState);
      },
    };
  }
  const view = root.ownerDocument?.defaultView;
  const preferenceRoot = root.ownerDocument?.documentElement ?? null;
  const motion = view?.matchMedia?.("(prefers-reduced-motion: reduce)");
  let destroyed = false;
  let attempt = 0;
  let visible = false;
  let assignedSource = false;
  let skeletonRemoved = false;
  let animationsEnabled = getAnimatedStickersEnabled(preferenceRoot);

  const removeSkeleton = () => {
    if (!skeleton?.parentNode) return;
    skeleton.remove();
    skeletonRemoved = true;
  };

  const restoreSkeleton = () => {
    if (!skeletonRemoved || !skeleton || !skeletonParent || skeleton.parentNode) return;
    const reference = skeletonNextSibling?.parentNode === skeletonParent ? skeletonNextSibling : null;
    skeletonParent.insertBefore(skeleton, reference);
    skeletonRemoved = false;
  };

  const pause = (state: Exclude<AnimatedStickerState, "loading" | "playing" | "paused">) => {
    attempt += 1;
    video?.pause();
    if (video) {
      try {
        video.currentTime = 0;
      } catch {
        // An unloaded media element may reject seeking; the SVG remains visible.
      }
    }
    restoreSkeleton();
    if (!destroyed) setState(root, state);
  };

  const pauseOutsideViewport = () => {
    if (!animationsEnabled) {
      disablePlayback();
      return;
    }
    if (motion?.matches) {
      pause("reduced-motion");
      return;
    }
    attempt += 1;
    video?.pause();
    if (!destroyed) setState(root, skeletonRemoved ? "paused" : "loading");
  };

  const disablePlayback = () => {
    attempt += 1;
    video?.pause();
    if (video) {
      try {
        video.currentTime = 0;
      } catch {
        // An unloaded media element may reject seeking; the SVG remains visible.
      }
      if (video.hasAttribute("src")) {
        video.removeAttribute("src");
        assignedSource = false;
        try {
          video.load();
        } catch {
          // Some DOM implementations do not provide media loading; removing src is sufficient.
        }
      }
    }
    restoreSkeleton();
    if (!destroyed) setState(root, "disabled");
  };

  const start = () => {
    if (!video || !source) {
      setState(root, "fallback");
      return;
    }
    if (!animationsEnabled) {
      disablePlayback();
      return;
    }
    if (motion?.matches) {
      pause("reduced-motion");
      return;
    }
    if (!visible) {
      setState(root, "loading");
      return;
    }
    if (!video.hasAttribute("src")) {
      video.src = source;
      assignedSource = true;
    }
    const currentAttempt = ++attempt;
    setState(root, skeletonRemoved ? "paused" : "loading");
    try {
      const playback = video.play();
      void playback?.catch(() => {
        if (!destroyed && attempt === currentAttempt) pause("fallback");
      });
    } catch {
      if (!destroyed && attempt === currentAttempt) pause("fallback");
    }
  };

  const onPlaying = () => {
    if (!destroyed && animationsEnabled && visible && !motion?.matches) {
      setState(root, "playing");
      removeSkeleton();
    }
  };
  const onError = () => {
    if (animationsEnabled) pause("fallback");
  };
  const onMotionChange = () => {
    if (!animationsEnabled) disablePlayback();
    else if (motion?.matches) pause("reduced-motion");
    else start();
  };

  const observer =
    video && typeof view?.IntersectionObserver === "function"
      ? new view.IntersectionObserver(
          (entries) => {
            const entry = entries.find((candidate) => candidate.target === root);
            if (!entry) return;
            const nextVisible = entry.isIntersecting;
            if (visible === nextVisible) return;
            visible = nextVisible;
            if (visible) start();
            else pauseOutsideViewport();
          },
          { rootMargin: "0px" },
        )
      : undefined;

  video?.addEventListener("playing", onPlaying);
  video?.addEventListener("error", onError);
  motion?.addEventListener("change", onMotionChange);
  if (observer) {
    observer.observe(root);
    if (motion?.matches) pause("reduced-motion");
    else setState(root, "loading");
  } else {
    visible = true;
  }
  const unsubscribePreference = subscribeAnimatedStickersEnabled((enabled) => {
    animationsEnabled = enabled;
    if (enabled) start();
    else disablePlayback();
  }, preferenceRoot);

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      attempt += 1;
      video?.removeEventListener("playing", onPlaying);
      video?.removeEventListener("error", onError);
      motion?.removeEventListener("change", onMotionChange);
      observer?.disconnect();
      unsubscribePreference();
      video?.pause();
      restoreSkeleton();
      if (video && assignedSource) video.removeAttribute("src");
      if (video && initialSrc !== null) video.setAttribute("src", initialSrc);
      if (initialState === null) root.removeAttribute("data-state");
      else root.setAttribute("data-state", initialState);
    },
  };
}

/** Connects a native checkbox/switch to the global animated sticker flag. */
export function createAnimatedStickerToggleController(
  toggle: HTMLInputElement,
): AnimatedStickerToggleController {
  const preferenceRoot = toggle.ownerDocument?.documentElement ?? null;
  const container = toggle.closest<HTMLElement>("[data-cf-animated-sticker-toggle-root]");
  const initialChecked = toggle.checked;
  const initialAriaChecked = toggle.getAttribute("aria-checked");
  const initialState = container?.getAttribute("data-state") ?? null;

  const render = (enabled: boolean) => {
    toggle.checked = enabled;
    toggle.setAttribute("aria-checked", String(enabled));
    if (container) container.dataset.state = enabled ? "checked" : "unchecked";
  };
  const onChange = () => setAnimatedStickersEnabled(toggle.checked, preferenceRoot);
  const unsubscribe = subscribeAnimatedStickersEnabled(render, preferenceRoot);
  toggle.addEventListener("change", onChange);

  return {
    destroy() {
      toggle.removeEventListener("change", onChange);
      unsubscribe();
      toggle.checked = initialChecked;
      if (initialAriaChecked === null) toggle.removeAttribute("aria-checked");
      else toggle.setAttribute("aria-checked", initialAriaChecked);
      if (container) {
        if (initialState === null) container.removeAttribute("data-state");
        else container.setAttribute("data-state", initialState);
      }
    },
  };
}
