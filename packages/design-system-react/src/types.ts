import type { ComponentType, ReactNode, SVGProps } from "react";
import type {
  ChatMessageModel,
  ChatModel,
  CaptchaLabels as CssCaptchaLabels,
  CaptchaState as CssCaptchaState,
  LinkModel,
  PostModel,
  ResolvedTheme as CssResolvedTheme,
  ResponsiveImageModel,
  Size as CssSize,
  ThemePreference as CssThemePreference,
  ToastInput as CssToastInput,
  TerminalCodeEntry as CssTerminalCodeEntry,
  Tone as CssTone,
} from "@cofob/design-system-css";

export type ThemePreference = CssThemePreference;
export type ResolvedTheme = CssResolvedTheme;
export type Size = CssSize;
export type Tone = CssTone;
export type CaptchaState = CssCaptchaState;
export type CaptchaLabels = CssCaptchaLabels;
export type { ChatMessageModel, ChatModel, LinkModel, PostModel, ResponsiveImageModel };
export type TerminalCodeEntry = CssTerminalCodeEntry;

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type SurfaceVariant =
  | "default"
  | "elevated"
  | "outlined"
  | "interactive"
  /** @deprecated Use `default`. */
  | "plain"
  /** @deprecated Use `elevated`. */
  | "raised"
  /** @deprecated Use `default`. */
  | "muted";
export type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type LinkItem = LinkModel;

export type ImageSource = ResponsiveImageModel;

export type PostSummary = PostModel;

/** React composition override for the portable chat message model. */
export interface ChatMessage extends Omit<ChatMessageModel, "id" | "author" | "body"> {
  id: string;
  author: string;
  body?: ReactNode;
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
}

export interface AccordionItem {
  id: string;
  heading: string;
  disabled?: boolean;
}

export interface PaginationItem {
  page: number;
  href?: string;
  label?: string;
}

export interface FooterGroup {
  title: string;
  links: readonly LinkItem[];
}

export interface IconContent {
  icon?: LucideIcon;
  iconNode?: ReactNode;
}

/** React composition override for portable toast descriptions. */
export interface ToastInput extends Omit<CssToastInput, "description"> {
  description?: ReactNode;
}

export interface ToastRecord extends Required<Pick<ToastInput, "id" | "title" | "tone">> {
  description?: ReactNode;
  duration: number;
  action?: CssToastInput["action"];
}
