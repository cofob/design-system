export type Size = "sm" | "md" | "lg";

export type Tone = "neutral" | "accent" | "info" | "success" | "warning" | "danger";

export type ThemePreference = "light" | "dark" | "system";

export type ResolvedTheme = Exclude<ThemePreference, "system">;

/** Visual-only states exposed by the presentational Captcha component. */
export type CaptchaState = "idle" | "verifying" | "success" | "error";

/** Copy displayed for each visual Captcha state. */
export interface CaptchaLabels {
  idle: string;
  verifying: string;
  success: string;
  error: string;
}

export interface ThemeState {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
}

export interface LinkModel {
  href: string;
  label: string;
  external?: boolean;
  current?: boolean;
}

export interface ResponsiveImageModel {
  src: string;
  alt: string;
  /** JSX-style alias. Portable consumers may use either spelling. */
  srcSet?: string;
  srcset?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

export interface PostModel {
  slug?: string;
  href: string;
  title: string;
  description?: string;
  excerpt?: string;
  /** Human-readable date label, for example `19 July 2026`. */
  published?: string;
  /** Machine-readable date used by the `<time datetime>` attribute. */
  publishedAt?: string;
  updated?: string;
  lang?: string;
  readingTime?: string;
  tags?: readonly string[];
  cover?: ResponsiveImageModel;
  image?: ResponsiveImageModel;
}

export interface ChatMessageModel {
  id?: string;
  author?: string;
  body?: string;
  text?: string;
  link?: string;
  linkLabel?: string;
  timestamp?: string;
  own?: boolean;
  avatar?: ResponsiveImageModel;
}

export interface ChatModel {
  author?: string;
  avatar?: string;
  messages: readonly ChatMessageModel[];
  label?: string;
}

/** A terminal command and its optional captured output. */
export interface TerminalCodeEntry {
  command: string;
  output?: string;
}

export type BashTokenKind =
  "plain" | "command" | "option" | "string" | "variable" | "operator" | "comment" | "number";

/** One exact source segment produced by the presentation-only Bash tokenizer. */
export interface BashToken {
  kind: BashTokenKind;
  value: string;
}

export interface Controller {
  destroy(): void;
}

export type DesignSystemRoot = Document | Element | ShadowRoot;

export interface ToastAction {
  label: string;
  onClick(): void;
}

export interface ToastInput {
  id?: string;
  title: string;
  description?: string;
  tone?: Tone;
  duration?: number;
  action?: ToastAction;
}
