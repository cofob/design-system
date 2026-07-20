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

interface AnimatedStickerModelBase {
  src: string;
  width: number;
  height: number;
}

/**
 * Converted animated sticker consumed by AnimatedSticker.
 * Vector animations keep a trusted inline SVG first frame, while video-based
 * stickers reference an optimized WebP first frame.
 */
export type AnimatedStickerModel = AnimatedStickerModelBase &
  ({ skeletonSvg: string; firstFrameSrc?: never } | { skeletonSvg?: never; firstFrameSrc: string });

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
  /** Human-readable update date label, for example `20 July 2026`. */
  updated?: string;
  /** Machine-readable update date used by the `<time datetime>` attribute. */
  updatedAt?: string;
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
  linkExternal?: boolean;
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

/** A terminal color selected from the ANSI palette or an exact RGB value. */
export type TerminalColor =
  { mode: "indexed"; index: number } | { mode: "rgb"; red: number; green: number; blue: number };

/** Underline variants supported by modern terminal SGR sequences. */
export type TerminalUnderlineStyle = "single" | "double" | "curly" | "dotted" | "dashed";

/** Presentation state attached to one terminal output token. */
export interface TerminalTextStyle {
  foreground?: TerminalColor;
  background?: TerminalColor;
  underlineColor?: TerminalColor;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: TerminalUnderlineStyle;
  inverse?: boolean;
  concealed?: boolean;
  strikethrough?: boolean;
  overline?: boolean;
}

/** One printable terminal output segment and its active presentation state. */
export interface TerminalOutputToken {
  value: string;
  style: TerminalTextStyle;
  href?: string;
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
