import { forwardRef, Fragment } from "react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  ImgHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TableHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { getThemeScript, THEME_STORAGE_KEY } from "@cofob/design-system-css";
import type { NavbarCollapseAt, NavbarMenuVariant, NavbarSurface } from "@cofob/design-system-css";
import type {
  ButtonVariant,
  ChatMessage,
  FooterGroup,
  ImageSource,
  LinkItem,
  LucideIcon,
  PaginationItem,
  PostSummary,
  Size,
  SurfaceVariant,
  Tone,
} from "./types.js";
import { cx, externalLinkProps, slugId } from "./utils.js";

export { Captcha } from "./captcha.js";
export type { CaptchaProps } from "./captcha.js";

export interface ThemeScriptProps {
  storageKey?: string;
  nonce?: string;
}

/** Place in document head before styles/content to prevent a theme flash. */
export function ThemeScript({ storageKey = THEME_STORAGE_KEY, nonce }: ThemeScriptProps) {
  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: getThemeScript(storageKey) }}
    />
  );
}

export interface SkipLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId?: string;
}

export function SkipLink({
  targetId = "main-content",
  className,
  children = "Skip to content",
  ...props
}: SkipLinkProps) {
  return (
    <a className={cx("cf-skip-link", className)} href={`#${targetId}`} {...props}>
      {children}
    </a>
  );
}

export function AppShell({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("cf-app-shell", className)} {...props} />;
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: Size | "xl" | "2xl";
}

export function Heading({ level = 2, size, className, ...props }: HeadingProps) {
  const Component = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return <Component className={cx("cf-heading", className)} data-size={size} data-level={level} {...props} />;
}

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: "p" | "span" | "div";
  size?: Size;
  tone?: "default" | "muted" | "subtle";
}

export function Text({ as: Component = "p", size = "md", tone = "default", className, ...props }: TextProps) {
  return (
    <Component
      className={cx("cf-text", className)}
      data-size={size}
      data-tone={tone === "default" ? undefined : tone}
      {...props}
    />
  );
}

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  external?: boolean;
  quiet?: boolean;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { external, quiet = false, className, children, ...props },
  ref,
) {
  return (
    <a
      ref={ref}
      className={cx("cf-link", className)}
      data-quiet={quiet || undefined}
      {...externalLinkProps(external)}
      {...props}
    >
      {children}
      {external ? <span className="cf-visually-hidden"> (opens in a new tab)</span> : null}
    </a>
  );
});

export function Prose({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cx("cf-prose", className)} {...props} />;
}

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  label: string;
  caption?: ReactNode;
  density?: "comfortable" | "compact";
  headerTone?: "strong" | "muted";
  striped?: boolean;
  minWidth?: string;
  containerClassName?: string;
}

export function Table({
  label,
  caption,
  density = "comfortable",
  headerTone = "strong",
  striped = true,
  minWidth = "36rem",
  containerClassName,
  className,
  children,
  ...props
}: TableProps) {
  return (
    <div
      className={cx("cf-table-container", containerClassName)}
      role="region"
      aria-label={label}
      tabIndex={0}
      style={{ "--cf-table-min-width": minWidth } as CSSProperties}
    >
      <table
        className={cx("cf-table", className)}
        data-density={density}
        data-header-tone={headerTone}
        data-striped={striped || undefined}
        {...props}
      >
        {caption ? <caption>{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "full";
}

export function Container({ size = "lg", className, ...props }: ContainerProps) {
  return (
    <div
      className={cx("cf-container", className)}
      data-size={size}
      data-width={size === "sm" ? "narrow" : size}
      {...props}
    />
  );
}

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  spacing?: Size;
  surface?: "canvas" | "subtle" | "accent";
}

export function Section({ spacing = "lg", surface = "canvas", className, ...props }: SectionProps) {
  return (
    <section
      className={cx("cf-section", className)}
      data-spacing={spacing}
      data-surface={surface}
      {...props}
    />
  );
}

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: Size;
  align?: "start" | "center" | "end" | "stretch";
}

export function Stack({ gap = "md", align = "stretch", className, ...props }: StackProps) {
  return <div className={cx("cf-stack", className)} data-gap={gap} data-align={align} {...props} />;
}

export interface InlineProps extends HTMLAttributes<HTMLDivElement> {
  gap?: Size;
  align?: "start" | "center" | "end" | "baseline";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
}

export function Inline({
  gap = "md",
  align = "center",
  justify = "start",
  wrap = true,
  className,
  ...props
}: InlineProps) {
  return (
    <div
      className={cx("cf-inline", className)}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap}
      {...props}
    />
  );
}

function Icon({ icon: Icon, node }: { icon?: LucideIcon; node?: ReactNode }) {
  if (node)
    return (
      <span className="cf-icon" aria-hidden="true">
        {node}
      </span>
    );
  if (Icon) return <Icon className="cf-icon" aria-hidden="true" focusable="false" />;
  return null;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
  loading?: boolean;
  startIcon?: LucideIcon;
  endIcon?: LucideIcon;
  startIconNode?: ReactNode;
  endIconNode?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    startIcon,
    endIcon,
    startIconNode,
    endIconNode,
    disabled,
    className,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx("cf-button", className)}
      data-variant={variant}
      data-tone={variant === "danger" ? "danger" : undefined}
      data-size={size}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="cf-button__spinner" aria-hidden="true" /> : null}
      {!loading ? <Icon icon={startIcon} node={startIconNode} /> : null}
      <span className="cf-button__label">{children}</span>
      {!loading ? <Icon icon={endIcon} node={endIconNode} /> : null}
    </button>
  );
});

export interface IconButtonProps extends Omit<
  ButtonProps,
  "children" | "startIcon" | "endIcon" | "startIconNode" | "endIconNode"
> {
  label: string;
  icon?: LucideIcon;
  children?: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    icon,
    children,
    variant = "secondary",
    size = "md",
    loading = false,
    disabled,
    className,
    type = "button",
    title,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx("cf-icon-button", className)}
      data-variant={variant === "secondary" ? undefined : variant}
      data-tone={variant === "danger" ? "danger" : undefined}
      data-size={size}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      aria-label={label}
      aria-busy={loading || undefined}
      title={title ?? label}
      {...props}
    >
      {loading ? (
        <span className="cf-button__spinner" aria-hidden="true" />
      ) : (
        <Icon icon={icon} node={children} />
      )}
    </button>
  );
});

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  hintId?: string;
  errorId?: string;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  hintId,
  errorId,
  className,
  children,
  ...props
}: FieldProps) {
  return (
    <div className={cx("cf-field", className)} data-invalid={Boolean(error) || undefined} {...props}>
      <label className="cf-field__label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="cf-field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <div className="cf-field__error" id={errorId} role="alert">
          {error}
        </div>
      ) : null}
      {!error && hint ? (
        <div className="cf-field__hint" id={hintId}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

interface FormControlPresentation {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  size?: Size;
}

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">, FormControlPresentation {}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    hint,
    error,
    size = "md",
    className,
    id,
    name,
    required,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const controlId = id ?? name;
  const hintId = controlId && hint ? `${controlId}-hint` : undefined;
  const errorId = controlId && error ? `${controlId}-error` : undefined;
  const input = (
    <input
      ref={ref}
      id={controlId}
      name={name}
      className={cx("cf-input", className)}
      data-size={size}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={[ariaDescribedBy, errorId ?? hintId].filter(Boolean).join(" ") || undefined}
      required={required}
      {...props}
    />
  );
  if (!label) return input;
  return (
    <Field
      label={label}
      htmlFor={controlId}
      hint={hint}
      error={error}
      required={required}
      hintId={hintId}
      errorId={errorId}
    >
      {input}
    </Field>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FormControlPresentation {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    size = "md",
    className,
    id,
    name,
    required,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const controlId = id ?? name;
  const hintId = controlId && hint ? `${controlId}-hint` : undefined;
  const errorId = controlId && error ? `${controlId}-error` : undefined;
  const control = (
    <textarea
      ref={ref}
      id={controlId}
      name={name}
      className={cx("cf-textarea", className)}
      data-size={size}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={[ariaDescribedBy, errorId ?? hintId].filter(Boolean).join(" ") || undefined}
      required={required}
      {...props}
    />
  );
  return label ? (
    <Field
      label={label}
      htmlFor={controlId}
      hint={hint}
      error={error}
      required={required}
      hintId={hintId}
      errorId={errorId}
    >
      {control}
    </Field>
  ) : (
    control
  );
});

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">, FormControlPresentation {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    error,
    size = "md",
    className,
    id,
    name,
    required,
    children,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const controlId = id ?? name;
  const hintId = controlId && hint ? `${controlId}-hint` : undefined;
  const errorId = controlId && error ? `${controlId}-error` : undefined;
  const control = (
    <span className="cf-select" data-size={size} data-invalid={Boolean(error) || undefined}>
      <select
        ref={ref}
        id={controlId}
        name={name}
        className={className}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={[ariaDescribedBy, errorId ?? hintId].filter(Boolean).join(" ") || undefined}
        required={required}
        {...props}
      >
        {children}
      </select>
    </span>
  );
  return label ? (
    <Field
      label={label}
      htmlFor={controlId}
      hint={hint}
      error={error}
      required={required}
      hintId={hintId}
      errorId={errorId}
    >
      {control}
    </Field>
  ) : (
    control
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label: ReactNode;
  description?: ReactNode;
  size?: Size;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, size = "md", className, ...props },
  ref,
) {
  return (
    <label
      className={cx("cf-checkbox", className)}
      data-size={size}
      data-disabled={props.disabled || undefined}
    >
      <input ref={ref} type="checkbox" {...props} />
      <span className="cf-checkbox__control" aria-hidden="true" />
      <span className="cf-checkbox__content">
        <span className="cf-checkbox__label">{label}</span>
        {description ? <span className="cf-checkbox__description">{description}</span> : null}
      </span>
    </label>
  );
});

export type SwitchProps = CheckboxProps;

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, description, size = "md", className, ...props },
  ref,
) {
  return (
    <label
      className={cx("cf-switch", className)}
      data-size={size}
      data-disabled={props.disabled || undefined}
    >
      <input ref={ref} className="cf-switch__control" type="checkbox" role="switch" {...props} />
      <span className="cf-switch__track" aria-hidden="true">
        <span className="cf-switch__thumb" />
      </span>
      <span className="cf-switch__content">
        <span className="cf-switch__label">{label}</span>
        {description ? <span className="cf-switch__description">{description}</span> : null}
      </span>
    </label>
  );
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: Size;
}

export function Badge({ tone = "neutral", size = "md", className, ...props }: BadgeProps) {
  return <span className={cx("cf-badge", className)} data-tone={tone} data-size={size} {...props} />;
}

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  removable?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
}

export function Tag({
  tone = "neutral",
  removable = false,
  onRemove,
  removeLabel = "Remove",
  className,
  children,
  ...props
}: TagProps) {
  return (
    <span className={cx("cf-tag", className)} data-tone={tone} {...props}>
      <span className="cf-tag__label">{children}</span>
      {removable ? (
        <button type="button" className="cf-tag__remove" onClick={onRemove} aria-label={removeLabel}>
          ×
        </button>
      ) : null}
    </span>
  );
}

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: Tone;
  title?: ReactNode;
  icon?: LucideIcon;
  dismissLabel?: string;
  onDismiss?: () => void;
}

export function Alert({
  tone = "info",
  title,
  icon,
  dismissLabel = "Dismiss",
  onDismiss,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={cx("cf-alert", className)}
      data-tone={tone}
      role={tone === "danger" ? "alert" : "status"}
      {...props}
    >
      {icon ? (
        <span className="cf-alert__icon">
          <Icon icon={icon} />
        </span>
      ) : null}
      <div className="cf-alert__content">
        {title ? <div className="cf-alert__title">{title}</div> : null}
        <div className="cf-alert__description">{children}</div>
      </div>
      {onDismiss ? (
        <button type="button" className="cf-alert__dismiss" onClick={onDismiss} aria-label={dismissLabel}>
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  );
}

export type CardPadding = "none" | "sm" | "md" | "lg";

interface CardPresentationProps {
  variant?: SurfaceVariant;
  padding?: CardPadding;
}

export type CardProps =
  | (CardPresentationProps &
      Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
        href: string;
        as?: never;
      })
  | (CardPresentationProps &
      HTMLAttributes<HTMLElement> & {
        href?: undefined;
        as?: "article" | "section" | "div";
      });

function normalizeCardVariant(variant: SurfaceVariant): "default" | "elevated" | "outlined" | "interactive" {
  if (variant === "raised") return "elevated";
  if (variant === "plain" || variant === "muted") return "default";
  return variant;
}

export function Card({
  as = "div",
  href,
  variant = "default",
  padding = "md",
  className,
  ...props
}: CardProps) {
  const normalizedVariant = normalizeCardVariant(variant);
  if (href) {
    return (
      <a
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        href={href}
        className={cx("cf-card", className)}
        data-variant={normalizedVariant}
        data-padding={padding}
      />
    );
  }
  const Component = as;
  return (
    <Component
      {...(props as HTMLAttributes<HTMLElement>)}
      className={cx("cf-card", className)}
      data-variant={normalizedVariant}
      data-padding={padding}
    />
  );
}

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action, className, ...props }: EmptyStateProps) {
  return (
    <div className={cx("cf-empty-state", className)} {...props}>
      <Icon icon={icon} />
      <h2 className="cf-empty-state__title">{title}</h2>
      {description ? <p className="cf-empty-state__description">{description}</p> : null}
      {action ? <div className="cf-empty-state__action">{action}</div> : null}
    </div>
  );
}

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  items: readonly PaginationItem[];
  currentPage: number;
  previousHref?: string;
  nextHref?: string;
  onPageChange?: (page: number) => void;
  label?: string;
}

export function Pagination({
  items,
  currentPage,
  previousHref,
  nextHref,
  onPageChange,
  label = "Pagination",
  className,
  ...props
}: PaginationProps) {
  const lastPage = Math.max(currentPage, ...items.map((entry) => entry.page));
  const item = (
    page: number,
    href: string | undefined,
    content: ReactNode,
    current = false,
    disabled = false,
    accessibleLabel?: string,
  ) =>
    href && !disabled ? (
      <a
        className="cf-pagination__link"
        href={href}
        aria-current={current ? "page" : undefined}
        aria-label={accessibleLabel}
      >
        {content}
      </a>
    ) : (
      <button
        className="cf-pagination__link"
        type="button"
        disabled={disabled}
        onClick={() => onPageChange?.(page)}
        aria-current={current ? "page" : undefined}
        aria-label={accessibleLabel}
      >
        {content}
      </button>
    );
  return (
    <nav className={cx("cf-pagination", className)} aria-label={label} {...props}>
      {item(currentPage - 1, previousHref, "Previous", false, currentPage <= 1)}
      {items.map((entry) => (
        <Fragment key={entry.page}>
          {item(
            entry.page,
            entry.href,
            entry.label ?? entry.page,
            entry.page === currentPage,
            false,
            entry.label ? undefined : `Page ${entry.page}`,
          )}
        </Fragment>
      ))}
      {item(currentPage + 1, nextHref, "Next", false, currentPage >= lastPage)}
    </nav>
  );
}

export interface BlueLineProps extends HTMLAttributes<HTMLSpanElement> {
  animate?: boolean;
  rainbow?: boolean;
}

export function BlueLine({ animate = false, rainbow = false, className, ...props }: BlueLineProps) {
  const { children, ...spanProps } = props;
  return (
    <span
      className={cx("cf-blue-line", className)}
      data-animate={animate || undefined}
      data-rainbow={rainbow || undefined}
      {...spanProps}
    >
      <span className="cf-blue-line__content">{children}</span>
    </span>
  );
}

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  brand?: ReactNode;
  brandLabel?: string;
  homeHref?: string;
  links: readonly LinkItem[];
  actions?: ReactNode;
  menuLabel?: string;
  menuToggleLabel?: string;
  collapseAt?: NavbarCollapseAt;
  menuVariant?: NavbarMenuVariant;
  surface?: NavbarSurface;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Navbar({
  brand = "cofob",
  brandLabel,
  homeHref = "/",
  links,
  actions,
  menuLabel = "Navigation",
  menuToggleLabel = "Menu",
  collapseAt = "mobile",
  menuVariant = "floating",
  surface = "solid",
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  ...props
}: NavbarProps) {
  const resolvedOpen = open ?? defaultOpen;
  const navigation = (
    <ul className="cf-navbar__links">
      {links.map((item) => (
        <li key={`${item.href}:${item.label}`}>
          <a
            className="cf-navbar__link"
            href={item.href}
            aria-current={item.current ? "page" : undefined}
            {...externalLinkProps(item.external)}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
  return (
    <nav
      className={cx("cf-navbar", className)}
      data-cf-navbar
      data-collapse-at={collapseAt}
      data-menu-variant={menuVariant}
      data-surface={surface}
      data-state={resolvedOpen ? "open" : "closed"}
      aria-label={menuLabel}
      {...props}
    >
      <a
        className="cf-navbar__brand"
        href={homeHref}
        aria-label={brandLabel ?? (typeof brand === "string" ? `${brand} home` : "Home")}
      >
        {brand}
      </a>
      <details
        className="cf-navbar__mobile"
        data-cf-navbar-disclosure
        open={resolvedOpen || undefined}
        onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
      >
        <summary className="cf-navbar__menu-trigger" data-cf-navbar-trigger aria-expanded={resolvedOpen}>
          <span className="cf-navbar__menu-icon" aria-hidden="true" />
          <span className="cf-visually-hidden">{menuToggleLabel}</span>
        </summary>
      </details>
      <div className="cf-navbar__navigation" data-cf-navbar-panel>
        {navigation}
        {actions ? <div className="cf-navbar__actions">{actions}</div> : null}
      </div>
    </nav>
  );
}

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  brand?: ReactNode;
  description?: ReactNode;
  groups?: readonly FooterGroup[];
  legal?: ReactNode;
}

export function Footer({
  brand = "cofob",
  description,
  groups = [],
  legal,
  className,
  ...props
}: FooterProps) {
  return (
    <footer className={cx("cf-footer", className)} {...props}>
      <div className="cf-footer__main">
        <div className="cf-footer__brand">
          <strong>{brand}</strong>
          {description ? <p>{description}</p> : null}
        </div>
        {groups.map((group) => (
          <section
            className="cf-footer__group"
            key={group.title}
            aria-labelledby={`footer-${slugId(group.title)}`}
          >
            <h2 id={`footer-${slugId(group.title)}`} className="cf-footer__heading">
              {group.title}
            </h2>
            <ul>
              {group.links.map((item) => (
                <li key={`${item.href}:${item.label}`}>
                  <a href={item.href} {...externalLinkProps(item.external)}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {legal ? <div className="cf-footer__legal">{legal}</div> : null}
    </footer>
  );
}

export interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  image: ImageSource;
  darkImage?: ImageSource;
  caption?: ReactNode;
  aspectRatio?: string;
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  image?: ImageSource;
  name: string;
  alt?: string;
  size?: Size;
  loading?: "eager" | "lazy";
  referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
}

function avatarInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.slice(0, 1).toLocaleUpperCase())
      .join("") || "?"
  );
}

export function Avatar({
  image,
  name,
  alt = image?.alt ?? name,
  size = "md",
  loading = "lazy",
  referrerPolicy = "no-referrer",
  className,
  ...props
}: AvatarProps) {
  return (
    <span
      className={cx("cf-avatar", className)}
      data-size={size}
      role={!image && alt ? "img" : undefined}
      aria-label={!image && alt ? alt : undefined}
      aria-hidden={!alt ? true : undefined}
      {...props}
    >
      {image ? (
        <img
          src={image.src}
          alt={alt}
          width={image.width}
          height={image.height}
          srcSet={image.srcSet ?? image.srcset}
          sizes={image.sizes}
          loading={loading}
          decoding="async"
          referrerPolicy={referrerPolicy}
        />
      ) : (
        avatarInitials(name)
      )}
    </span>
  );
}

export interface InlineEmojiProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "width" | "height" | "srcSet"
> {
  image: ImageSource;
  alt?: string;
}

export function InlineEmoji({
  image,
  alt = image.alt,
  referrerPolicy = "no-referrer",
  className,
  ...props
}: InlineEmojiProps) {
  return (
    <img
      className={cx("cf-inline-emoji", className)}
      src={image.src}
      alt={alt}
      width={image.width}
      height={image.height}
      srcSet={image.srcSet ?? image.srcset}
      sizes={image.sizes}
      loading="lazy"
      decoding="async"
      referrerPolicy={referrerPolicy}
      {...props}
    />
  );
}

export interface MediaGridProps extends HTMLAttributes<HTMLElement> {
  as?: "ul" | "div";
}

export function MediaGrid({ as: Component = "ul", className, ...props }: MediaGridProps) {
  return <Component className={cx("cf-media-grid", className)} {...props} />;
}

export function ResponsiveImage({
  image,
  darkImage,
  caption,
  aspectRatio,
  className,
  style,
  ...props
}: ResponsiveImageProps) {
  const figureStyle = { "--cf-image-aspect": aspectRatio, ...style } as CSSProperties;
  return (
    <figure
      className={cx("cf-responsive-image", className)}
      data-has-dark-image={darkImage ? "true" : undefined}
      style={figureStyle}
    >
      <span className="cf-responsive-image__media">
        <img
          className="cf-responsive-image__light"
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          srcSet={image.srcSet ?? image.srcset}
          sizes={image.sizes}
          loading="lazy"
          decoding="async"
          {...props}
        />
        {darkImage ? (
          <img
            className="cf-responsive-image__dark"
            src={darkImage.src}
            alt={darkImage.alt}
            width={darkImage.width}
            height={darkImage.height}
            srcSet={darkImage.srcSet ?? darkImage.srcset}
            sizes={darkImage.sizes ?? image.sizes}
            loading="lazy"
            decoding="async"
            {...props}
          />
        ) : null}
      </span>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export interface PostCardProps extends HTMLAttributes<HTMLElement> {
  post: PostSummary;
  headingLevel?: 2 | 3 | 4;
}

function postImage(post: PostSummary): ImageSource | undefined {
  return post.image ?? post.cover;
}

function postDateTime(post: PostSummary): string | undefined {
  return post.publishedAt ?? post.published;
}

function postDateLabel(post: PostSummary): string | undefined {
  return post.published ?? post.publishedAt;
}

function postUpdatedDateTime(post: PostSummary): string | undefined {
  return post.updatedAt ?? post.updated;
}

function postUpdatedDateLabel(post: PostSummary): string | undefined {
  return post.updated ?? post.updatedAt;
}

function postDescription(post: PostSummary): string | undefined {
  return post.excerpt ?? post.description;
}

function PostImage({
  image,
  className,
  alt = image.alt,
  loading = "lazy",
}: {
  image: ImageSource;
  className: string;
  alt?: string;
  loading?: "eager" | "lazy";
}) {
  return (
    <img
      className={className}
      src={image.src}
      alt={alt}
      width={image.width}
      height={image.height}
      srcSet={image.srcSet ?? image.srcset}
      sizes={image.sizes}
      loading={loading}
      decoding="async"
    />
  );
}

function PostCardBody({ post, headingLevel = 2 }: Pick<PostCardProps, "post" | "headingLevel">) {
  const image = postImage(post);
  const publishedAt = postDateTime(post);
  const published = postDateLabel(post);
  const updatedAt = postUpdatedDateTime(post);
  const updated = postUpdatedDateLabel(post);
  const description = postDescription(post);
  return (
    <>
      {image ? (
        <a className="cf-post-card__media" href={post.href} tabIndex={-1} aria-hidden="true">
          <PostImage image={image} className="cf-post-card__cover" alt="" />
        </a>
      ) : null}
      <div className="cf-post-card__content">
        {published || updated || post.readingTime ? (
          <p className="cf-post-card__meta">
            {published ? (
              <span>
                Published <time dateTime={publishedAt}>{published}</time>
              </span>
            ) : null}
            {updated ? (
              <span>
                Updated <time dateTime={updatedAt}>{updated}</time>
              </span>
            ) : null}
            {post.readingTime ? <span>{post.readingTime}</span> : null}
          </p>
        ) : null}
        <Heading level={headingLevel} className="cf-post-card__title">
          <a href={post.href}>{post.title}</a>
        </Heading>
        {description ? (
          <Text tone="muted" className="cf-post-card__excerpt">
            {description}
          </Text>
        ) : null}
        {post.tags?.length ? (
          <div className="cf-post-card__tags" aria-label="Tags">
            {post.tags.map((tag) => (
              <span className="cf-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

export function PostCard({ post, headingLevel = 2, className, ...props }: PostCardProps) {
  return (
    <article className={cx("cf-post-card", className)} {...props}>
      <PostCardBody post={post} headingLevel={headingLevel} />
    </article>
  );
}

export interface LatestPostCardProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "title"> {
  post: PostSummary;
  headingLevel?: 2 | 3 | 4;
  eyebrow?: ReactNode;
}

export function LatestPostCard({
  post,
  headingLevel = 2,
  eyebrow = "Latest post",
  className,
  ...props
}: LatestPostCardProps) {
  const image = postImage(post);
  const publishedAt = postDateTime(post);
  const published = postDateLabel(post);
  const updatedAt = postUpdatedDateTime(post);
  const updated = postUpdatedDateLabel(post);
  const description = postDescription(post);
  return (
    <a className={cx("cf-latest-post-card", className)} href={post.href} aria-label={post.title} {...props}>
      <div className="cf-latest-post-card__content">
        <p className="cf-latest-post-card__eyebrow">{eyebrow}</p>
        <Heading level={headingLevel} className="cf-latest-post-card__title">
          {post.title}
        </Heading>
        {description ? <p className="cf-latest-post-card__description">{description}</p> : null}
        {published || updated || post.readingTime ? (
          <p className="cf-latest-post-card__meta">
            {published ? (
              <span>
                Published <time dateTime={publishedAt}>{published}</time>
              </span>
            ) : null}
            {published && (updated || post.readingTime) ? (
              <span className="cf-post-meta__separator" aria-hidden="true">
                ·
              </span>
            ) : null}
            {updated ? (
              <span>
                Updated <time dateTime={updatedAt}>{updated}</time>
              </span>
            ) : null}
            {updated && post.readingTime ? (
              <span className="cf-post-meta__separator" aria-hidden="true">
                ·
              </span>
            ) : null}
            {post.readingTime}
          </p>
        ) : null}
        <span className="cf-link" aria-hidden="true">
          Read article <span aria-hidden="true">→</span>
        </span>
      </div>
      {image ? <PostImage image={image} className="cf-latest-post-card__image" loading="eager" /> : null}
    </a>
  );
}

export interface SearchResultCardProps extends Omit<PostCardProps, "post"> {
  result: PostSummary;
  query?: string;
}

function highlightText(value: string, query: string | undefined): ReactNode {
  const normalizedQuery = query?.trim();
  if (!normalizedQuery) return value;
  const escaped = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return value
    .split(new RegExp(`(${escaped})`, "gi"))
    .map((part, index) =>
      part.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase() ? (
        <mark key={`${part}:${index}`}>{part}</mark>
      ) : (
        part
      ),
    );
}

export function SearchResultCard({
  result,
  query,
  headingLevel = 2,
  className,
  ...props
}: SearchResultCardProps) {
  const publishedAt = postDateTime(result);
  const published = postDateLabel(result);
  const updatedAt = postUpdatedDateTime(result);
  const updated = postUpdatedDateLabel(result);
  const description = postDescription(result);
  return (
    <article className={cx("cf-search-result-card", className)} data-query={query || undefined} {...props}>
      {published || updated || result.readingTime ? (
        <p className="cf-search-result-card__meta">
          {published ? (
            <span>
              Published <time dateTime={publishedAt}>{published}</time>
            </span>
          ) : null}
          {published && (updated || result.readingTime) ? (
            <span className="cf-post-meta__separator" aria-hidden="true">
              ·
            </span>
          ) : null}
          {updated ? (
            <span>
              Updated <time dateTime={updatedAt}>{updated}</time>
            </span>
          ) : null}
          {updated && result.readingTime ? (
            <span className="cf-post-meta__separator" aria-hidden="true">
              ·
            </span>
          ) : null}
          {result.readingTime}
        </p>
      ) : null}
      <Heading level={headingLevel} className="cf-search-result-card__title">
        <a href={result.href}>{highlightText(result.title, query)}</a>
      </Heading>
      {description ? (
        <p className="cf-search-result-card__description">{highlightText(description, query)}</p>
      ) : null}
      {result.tags?.length ? (
        <div className="cf-search-result-card__tags" aria-label="Tags">
          {result.tags.map((tag) => (
            <span className="cf-tag" key={tag}>
              {highlightText(tag, query)}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export interface ChatThreadProps extends HTMLAttributes<HTMLOListElement> {
  messages: readonly ChatMessage[];
  label?: string;
}

function isSameChatSender(left: ChatMessage | undefined, right: ChatMessage | undefined) {
  return Boolean(left && right && left.author === right.author && Boolean(left.own) === Boolean(right.own));
}

export function ChatThread({ messages, label = "Conversation", className, ...props }: ChatThreadProps) {
  return (
    <ol className={cx("cf-chat-thread", className)} aria-label={label} {...props}>
      {messages.map((message, index) => {
        const groupStart = !isSameChatSender(messages[index - 1], message);
        const groupEnd = !isSameChatSender(message, messages[index + 1]);
        return (
          <li
            className="cf-chat__row"
            data-own={message.own || undefined}
            data-group-start={groupStart || undefined}
            data-group-end={groupEnd || undefined}
            key={message.id}
          >
            {message.avatar ? (
              <PostImage image={message.avatar} className="cf-chat__avatar" alt="" />
            ) : (
              <span className="cf-chat__avatar" aria-hidden="true">
                {message.author.slice(0, 1).toLocaleUpperCase()}
              </span>
            )}
            <div className="cf-chat__message">
              {groupStart ? (
                <p className="cf-chat__author">
                  <strong>{message.author}</strong>
                </p>
              ) : null}
              <div className="cf-chat__bubble">
                {!groupStart ? <span className="cf-visually-hidden">{message.author}: </span> : null}
                {message.body ?? message.text}
                {message.link ? (
                  <>
                    {message.body !== undefined || message.text ? <br /> : null}
                    <a
                      className="cf-link"
                      href={message.link}
                      target={message.linkExternal ? "_blank" : undefined}
                      rel={message.linkExternal ? "noopener noreferrer" : undefined}
                    >
                      {message.linkLabel ?? message.link}
                    </a>
                  </>
                ) : null}
                {message.timestamp ? (
                  <time className="cf-chat__timestamp" dateTime={message.timestamp}>
                    {message.timestamp}
                  </time>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export interface StickerProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  rotation?: -6 | -3 | 0 | 3 | 6;
}

export function Sticker({ tone = "accent", rotation = -3, className, style, ...props }: StickerProps) {
  return (
    <span
      className={cx("cf-sticker", className)}
      data-tone={tone}
      style={{ "--cf-sticker-rotation": `${rotation}deg`, ...style } as CSSProperties}
      {...props}
    />
  );
}
