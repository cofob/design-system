import type { Options, Player, Source } from "asciinema-player";

export type {
  BuiltInParser,
  DataSource,
  InputEvent,
  Logger,
  Marker,
  MarkerEvent,
  Options,
  Parser,
  ParserOptions,
  Player,
  Recording,
  RecordingData,
  RecordingEvent,
  RecordingEventCode,
  SeekLocation,
  Source,
  UrlSource,
} from "asciinema-player";

export const DEFAULT_ASCIINEMA_PLAYER_LABELS: Readonly<AsciinemaPlayerLabels> = Object.freeze({
  loadingTitle: "Terminal recording",
  errorTitle: "Player failed to load",
  fallbackLink: "Open recording",
});

export interface AsciinemaPlayerLabels {
  loadingTitle: string;
  errorTitle: string;
  fallbackLink: string;
}

export interface AsciinemaPlayerConfig {
  source: Source;
  options?: Options;
  labels?: Partial<AsciinemaPlayerLabels>;
  fallbackHref?: string;
  onPlayerReady?: (player: Player) => void;
  onPlayerLoadError?: (error: unknown) => void;
}

export interface AsciinemaPlayerController {
  readonly ready: Promise<Player>;
  readonly player: Player | undefined;
  destroy(): void;
}

interface ElementSnapshot {
  ariaBusy: string | null;
  fallbackHidden: HTMLElement["hidden"];
  fallbackRole: string | null;
  fallbackTone: string | undefined;
  linkHidden?: HTMLElement["hidden"];
  linkHref?: string | null;
  linkText?: string;
  rootState: string | undefined;
  stageHidden: HTMLElement["hidden"];
  titleText: string;
}

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Asciinema player root is missing ${selector}`);
  return element;
}

function createAbortError(): Error {
  const error = new Error("Asciinema player mounting was aborted");
  error.name = "AbortError";
  return error;
}

export function resolveAsciinemaPlayerLabels(
  labels: Partial<AsciinemaPlayerLabels> = {},
): AsciinemaPlayerLabels {
  return { ...DEFAULT_ASCIINEMA_PLAYER_LABELS, ...labels };
}

/**
 * Mounts asciinema-player into the shared data-attribute shell.
 * Importing this module is SSR-safe; browser code is loaded only after this function is called.
 */
export function createAsciinemaPlayerController(
  root: HTMLElement,
  config: AsciinemaPlayerConfig,
): AsciinemaPlayerController {
  const stage = requiredElement<HTMLElement>(root, "[data-cf-asciinema-player-stage]");
  const mount = requiredElement<HTMLElement>(root, "[data-cf-asciinema-player-mount]");
  const fallback = requiredElement<HTMLElement>(root, "[data-cf-asciinema-player-fallback]");
  const title = requiredElement<HTMLElement>(root, "[data-cf-asciinema-player-fallback-title]");
  const link = root.querySelector<HTMLAnchorElement>("[data-cf-asciinema-player-fallback-link]");
  const labels = resolveAsciinemaPlayerLabels(config.labels);
  const snapshot: ElementSnapshot = {
    ariaBusy: root.getAttribute("aria-busy"),
    fallbackHidden: fallback.hidden,
    fallbackRole: fallback.getAttribute("role"),
    fallbackTone: fallback.dataset.tone,
    rootState: root.dataset.state,
    stageHidden: stage.hidden,
    titleText: title.textContent ?? "",
    ...(link
      ? { linkHidden: link.hidden, linkHref: link.getAttribute("href"), linkText: link.textContent ?? "" }
      : {}),
  };

  let destroyed = false;
  let player: Player | undefined;

  const showLoading = () => {
    root.dataset.state = "loading";
    root.setAttribute("aria-busy", "true");
    stage.hidden = true;
    fallback.hidden = false;
    fallback.dataset.tone = "info";
    fallback.setAttribute("role", "status");
    title.textContent = labels.loadingTitle;
    if (link) {
      link.hidden = !config.fallbackHref;
      if (config.fallbackHref) link.href = config.fallbackHref;
      else link.removeAttribute("href");
      link.textContent = labels.fallbackLink;
    }
  };

  const showReady = () => {
    root.dataset.state = "ready";
    root.removeAttribute("aria-busy");
    stage.hidden = false;
    fallback.hidden = true;
  };

  const showError = () => {
    root.dataset.state = "error";
    root.removeAttribute("aria-busy");
    stage.hidden = true;
    fallback.hidden = false;
    fallback.dataset.tone = "warning";
    fallback.setAttribute("role", "alert");
    title.textContent = labels.errorTitle;
  };

  const restore = () => {
    if (snapshot.rootState === undefined) delete root.dataset.state;
    else root.dataset.state = snapshot.rootState;
    if (snapshot.ariaBusy === null) root.removeAttribute("aria-busy");
    else root.setAttribute("aria-busy", snapshot.ariaBusy);
    stage.hidden = snapshot.stageHidden;
    fallback.hidden = snapshot.fallbackHidden;
    if (snapshot.fallbackTone === undefined) delete fallback.dataset.tone;
    else fallback.dataset.tone = snapshot.fallbackTone;
    if (snapshot.fallbackRole === null) fallback.removeAttribute("role");
    else fallback.setAttribute("role", snapshot.fallbackRole);
    title.textContent = snapshot.titleText;
    if (link) {
      link.hidden = snapshot.linkHidden ?? false;
      if (snapshot.linkHref === null || snapshot.linkHref === undefined) link.removeAttribute("href");
      else link.setAttribute("href", snapshot.linkHref);
      link.textContent = snapshot.linkText ?? "";
    }
  };

  showLoading();

  const ready = import("asciinema-player")
    .then((module) => {
      if (destroyed) throw createAbortError();
      const options: Options =
        config.options?.theme === undefined ? { ...config.options, theme: "cofob" } : { ...config.options };
      const createdPlayer = module.create(config.source, mount, options);
      if (destroyed) {
        createdPlayer.dispose();
        throw createAbortError();
      }
      player = createdPlayer;
      showReady();
      config.onPlayerReady?.(createdPlayer);
      return createdPlayer;
    })
    .catch((error: unknown) => {
      if (!destroyed) {
        showError();
        config.onPlayerLoadError?.(error);
      }
      throw error;
    });

  // The promise remains observable to callers while intentional fire-and-forget use stays quiet.
  void ready.catch(() => undefined);

  return {
    ready,
    get player() {
      return player;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      player?.dispose();
      player = undefined;
      restore();
    },
  };
}
