import type { Snippet } from "svelte";
import type {
  ChatMessageModel,
  ChatModel,
  CaptchaLabels as CssCaptchaLabels,
  CaptchaState as CssCaptchaState,
  LinkModel,
  PostModel,
  ResponsiveImageModel,
  Size as CssSize,
  TerminalCodeEntry,
  ThemePreference as CssThemePreference,
  Tone as CssTone,
} from "@cofob/design-system-css";

export type Size = CssSize;
export type Tone = CssTone;
export type ThemePreference = CssThemePreference;
export type CaptchaState = CssCaptchaState;
export type CaptchaLabels = CssCaptchaLabels;
export type { ChatMessageModel, ChatModel, LinkModel, PostModel, ResponsiveImageModel, TerminalCodeEntry };
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type LinkItem = LinkModel;

export type ImageSource = ResponsiveImageModel;

export type PostSummary = PostModel;

/** Svelte composition override for the portable chat message model. */
export interface ChatMessage extends Omit<ChatMessageModel, "id" | "author" | "body"> {
  id: string;
  author: string;
  body?: string | Snippet;
}

export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
  destructive?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
  content?: string | Snippet;
}

export interface AccordionItem {
  id: string;
  heading: string;
  content?: string | Snippet;
  disabled?: boolean;
}

export interface PaginationItem {
  page: number;
  href?: string;
  label?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FooterGroup {
  title: string;
  links: readonly LinkItem[];
}

export interface ToastOptions {
  id?: string;
  title?: string;
  tone?: Tone;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastInput {
  id?: string;
  title: string;
  description?: string | Snippet;
  tone?: Tone;
  duration?: number;
}

export interface ToastRecord extends ToastOptions {
  id: string;
  title: string;
  description?: string | Snippet;
  duration: number;
  state: "open" | "closed";
}
