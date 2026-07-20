"use client";

export { CodeBlock, TerminalCodeBlock } from "./code-block.js";
export type { CodeBlockProps, TerminalCodeBlockProps } from "./code-block.js";

import {
  Children,
  cloneElement,
  createContext,
  Fragment,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ButtonHTMLAttributes,
  DialogHTMLAttributes,
  ForwardedRef,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  ReactElement,
  ReactNode,
  VideoHTMLAttributes,
} from "react";
import {
  createAnimatedStickerController,
  createPopoverController,
  createThemeController,
  createTooltipController,
  THEME_STORAGE_KEY,
} from "@cofob/design-system-css";
import type {
  AccordionItem,
  AnimatedStickerModel,
  MenuItem,
  ResolvedTheme,
  Size,
  TabItem,
  ThemePreference,
  ToastInput,
  ToastRecord,
} from "./types.js";
import { useControllableState } from "./client-utils.js";
import { cx } from "./utils.js";

function setForwardedRef<T>(ref: ForwardedRef<T>, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export interface AnimatedStickerProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "dangerouslySetInnerHTML"
> {
  sticker: AnimatedStickerModel;
  alt: string;
  playback?: "auto" | "static";
  preload?: VideoHTMLAttributes<HTMLVideoElement>["preload"];
}

/**
 * Plays a converted Telegram sticker while keeping its trusted first-frame SVG
 * in the server-rendered HTML. Never pass unsanitized user SVG as skeletonSvg.
 */
export const AnimatedSticker = forwardRef<HTMLSpanElement, AnimatedStickerProps>(function AnimatedSticker(
  { sticker, alt, playback = "auto", preload = "metadata", className, ...props },
  forwardedRef,
) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const setRoot = useCallback(
    (node: HTMLSpanElement | null) => {
      rootRef.current = node;
      setForwardedRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  useEffect(() => {
    if (!rootRef.current) return;
    const controller = createAnimatedStickerController(rootRef.current);
    return () => controller.destroy();
  }, [playback, sticker.src]);

  return (
    <span
      {...props}
      ref={setRoot}
      className={cx("cf-animated-sticker", className)}
      data-cf-animated-sticker
      data-cf-animated-sticker-managed="true"
      data-playback={playback}
      data-state={playback === "static" ? "static" : "loading"}
      role="img"
      aria-label={alt}
    >
      <span
        className="cf-animated-sticker__skeleton"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: sticker.skeletonSvg }}
      />
      {playback === "auto" ? (
        <video
          data-cf-animated-sticker-video
          data-cf-animated-sticker-src={sticker.src}
          width={sticker.width}
          height={sticker.height}
          muted
          loop
          playsInline
          preload={preload}
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}
    </span>
  );
});

interface TriggerElementProps extends HTMLAttributes<HTMLElement> {
  disabled?: boolean;
}

interface TriggerOptions {
  trigger: ReactNode;
  className: string;
  label: string;
  controls: string;
  expanded: boolean;
  hasPopup?: "dialog" | "menu" | boolean;
  setTriggerElement?: (element: HTMLElement | null) => void;
  onPress: (event: React.SyntheticEvent<HTMLElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
}

const nativeInteractiveElements = new Set(["a", "button", "input", "select", "summary", "textarea"]);

function Trigger(options: TriggerOptions): ReactElement {
  const { trigger } = options;
  if (isValidElement<TriggerElementProps>(trigger)) {
    if (trigger.type === Fragment) {
      if (Children.count(trigger.props.children) !== 1) {
        throw new Error("A design-system trigger Fragment must contain exactly one element.");
      }
      const child = Children.only(trigger.props.children);
      if (!isValidElement<TriggerElementProps>(child)) {
        throw new Error("A design-system trigger Fragment must contain an element, not plain text.");
      }
      return <Trigger {...options} trigger={child} />;
    }

    const original = trigger.props;
    const needsButtonSemantics =
      typeof trigger.type === "string" && !nativeInteractiveElements.has(trigger.type);
    const disabled =
      original.disabled || original["aria-disabled"] === true || original["aria-disabled"] === "true";
    return cloneElement(trigger, {
      className: cx(options.className, original.className),
      role: needsButtonSemantics ? (original.role ?? "button") : original.role,
      tabIndex: needsButtonSemantics ? (original.tabIndex ?? 0) : original.tabIndex,
      "aria-controls": original["aria-controls"] ?? options.controls,
      "aria-expanded": options.expanded,
      "aria-haspopup": original["aria-haspopup"] ?? options.hasPopup,
      onClick(event) {
        options.setTriggerElement?.(event.currentTarget);
        original.onClick?.(event);
        if (!event.defaultPrevented && !disabled) options.onPress(event);
      },
      onKeyDown(event) {
        options.setTriggerElement?.(event.currentTarget);
        original.onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        if (needsButtonSemantics && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          options.onPress(event);
          return;
        }
        options.onKeyDown?.(event);
      },
    });
  }

  return (
    <button
      type="button"
      className={cx("cf-button", options.className)}
      data-variant="secondary"
      aria-label={typeof trigger === "string" ? undefined : options.label}
      aria-controls={options.controls}
      aria-expanded={options.expanded}
      aria-haspopup={options.hasPopup}
      onClick={(event) => {
        options.setTriggerElement?.(event.currentTarget);
        options.onPress(event);
      }}
      onKeyDown={(event) => {
        options.setTriggerElement?.(event.currentTarget);
        options.onKeyDown?.(event);
      }}
    >
      {trigger}
    </button>
  );
}

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  preference?: ThemePreference;
  defaultPreference?: ThemePreference;
  onPreferenceChange?: (preference: ThemePreference) => void;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  preference,
  defaultPreference = "system",
  onPreferenceChange,
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [currentPreference, setCurrentPreference] = useControllableState({
    value: preference,
    defaultValue: defaultPreference,
    onChange: onPreferenceChange,
  });
  const initialPreference = preference ?? defaultPreference;
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    initialPreference === "dark" ? "dark" : "light",
  );
  const controllerRef = useRef<ReturnType<typeof createThemeController> | null>(null);
  const controlledRef = useRef(preference !== undefined);

  useEffect(() => {
    const controller = createThemeController({
      root: document.documentElement,
      storageKey,
      defaultPreference: currentPreference,
    });
    controllerRef.current = controller;
    if (controlledRef.current) controller.setPreference(currentPreference);
    const unsubscribe = controller.subscribe((state) => {
      if (!controlledRef.current) setCurrentPreference(state.preference);
      setResolvedTheme(state.resolvedTheme);
    });
    return () => {
      unsubscribe();
      controller.destroy();
      controllerRef.current = null;
    };
    // The controller is intentionally recreated only when its storage contract changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (controlledRef.current && controller && controller.getPreference() !== currentPreference) {
      controller.setPreference(currentPreference);
    }
  }, [currentPreference]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setCurrentPreference(next);
      controllerRef.current?.setPreference(next);
    },
    [setCurrentPreference],
  );

  const context = useMemo<ThemeContextValue>(
    () => ({
      preference: currentPreference,
      resolvedTheme,
      setPreference,
    }),
    [currentPreference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={context}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

export interface ThemeToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  cycle?: readonly ThemePreference[];
  labels?: Partial<Record<ThemePreference, string>>;
}

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(function ThemeToggle(
  {
    cycle = ["system", "light", "dark"],
    labels = { system: "System theme", light: "Light theme", dark: "Dark theme" },
    className,
    onClick,
    type = "button",
    "aria-label": ariaLabel,
    ...props
  },
  ref,
) {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const index = Math.max(0, cycle.indexOf(preference));
  const next = cycle[(index + 1) % cycle.length] ?? "system";
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={cx("cf-theme-toggle", className)}
      data-preference={preference}
      data-theme={resolvedTheme}
      aria-label={ariaLabel ?? `${labels[preference] ?? preference}. Switch to ${labels[next] ?? next}.`}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setPreference(next);
      }}
    >
      <span className="cf-theme-toggle__icon" aria-hidden="true" data-cf-theme-icon data-icon={preference} />
      <span
        className="cf-theme-toggle__label"
        aria-hidden="true"
        data-cf-theme-label
        data-label-system={labels.system ?? "System theme"}
        data-label-light={labels.light ?? "Light theme"}
        data-label-dark={labels.dark ?? "Dark theme"}
      />
    </button>
  );
});

export interface DialogProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "open" | "title"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  triggerLabel?: string;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
}

export function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  trigger,
  triggerLabel = "Open dialog",
  title,
  description,
  footer,
  closeLabel = "Close dialog",
  id: providedId,
  className,
  children,
  onCancel,
  onClose,
  onClick,
  ...props
}: DialogProps) {
  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const generatedDialogId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const dialogId = providedId ?? generatedDialogId;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  return (
    <>
      {trigger ? (
        <Trigger
          trigger={trigger}
          className="cf-dialog__trigger"
          label={triggerLabel}
          controls={dialogId}
          expanded={open}
          hasPopup="dialog"
          setTriggerElement={setTriggerElement}
          onPress={() => setOpen(true)}
        />
      ) : null}
      <dialog
        ref={dialogRef}
        id={dialogId}
        className={cx("cf-dialog", className)}
        data-state={open ? "open" : "closed"}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onCancel={(event) => {
          onCancel?.(event);
          if (event.defaultPrevented) return;
          event.preventDefault();
          setOpen(false);
        }}
        onClose={(event) => {
          onClose?.(event);
          setOpen(false);
          (triggerElement ?? previousFocusRef.current)?.focus();
        }}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && event.target === event.currentTarget) setOpen(false);
        }}
        {...props}
      >
        <div className="cf-dialog__surface">
          <header className="cf-dialog__header">
            <div>
              <h2 className="cf-dialog__title" id={titleId}>
                {title}
              </h2>
              {description ? (
                <p className="cf-dialog__description" id={descriptionId}>
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="cf-dialog__close"
              aria-label={closeLabel}
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div className="cf-dialog__body">{children}</div>
          {footer ? <footer className="cf-dialog__footer">{footer}</footer> : null}
        </div>
      </dialog>
    </>
  );
}

type PopoverElement = HTMLElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
};

function isNativePopoverOpen(element: PopoverElement): boolean {
  try {
    return element.matches(":popover-open");
  } catch {
    return false;
  }
}

function usePopoverElement(open: boolean, setOpen: (open: boolean) => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current as PopoverElement | null;
    if (!element) return;
    if (typeof element.showPopover === "function") {
      try {
        const isOpen = isNativePopoverOpen(element);
        if (open && !isOpen) element.showPopover();
        if (!open && isOpen) element.hidePopover?.();
      } catch {
        // `hidden` and data-cf-fallback-open keep the surface usable without the native API.
      }
    }
  }, [open]);
  useEffect(() => {
    const element = ref.current as PopoverElement | null;
    if (!element) return;
    const handleToggle = (event: Event) => {
      const newState = (event as Event & { newState?: "open" | "closed" }).newState;
      if (newState) setOpen(newState === "open");
    };
    element.addEventListener("toggle", handleToggle);
    return () => element.removeEventListener("toggle", handleToggle);
  }, [setOpen]);
  return ref;
}

function useFloatingPositioning(
  open: boolean,
  surfaceRef: React.RefObject<HTMLDivElement | null>,
  rootRef: React.RefObject<HTMLDivElement | null>,
  triggerSelector: string,
  placement: "top" | "right" | "bottom" | "left",
) {
  useEffect(() => {
    const surface = surfaceRef.current;
    const trigger = rootRef.current?.querySelector(triggerSelector) ?? null;
    if (!open || !surface || !trigger) return;
    const controller = createPopoverController(surface, { triggers: [], anchor: trigger, placement });
    return () => controller.destroy();
  }, [open, placement, rootRef, surfaceRef, triggerSelector]);
}

export interface PopoverProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: ReactNode;
  triggerLabel?: string;
  placement?: "top" | "right" | "bottom" | "left";
}

export function Popover({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  trigger,
  triggerLabel = "Toggle popover",
  placement = "bottom",
  id: providedId,
  hidden: hiddenProp,
  popover: popoverMode = "manual",
  className,
  children,
  ...props
}: PopoverProps) {
  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const ref = usePopoverElement(open, setOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const id = providedId ?? generatedId;
  useFloatingPositioning(open, ref, rootRef, ".cf-popover__trigger", placement);
  return (
    <div ref={rootRef} className="cf-popover-root">
      <Trigger
        trigger={trigger}
        className="cf-popover__trigger"
        label={triggerLabel}
        controls={id}
        expanded={open}
        onPress={() => setOpen((value) => !value)}
      />
      <div
        {...props}
        ref={ref}
        id={id}
        className={cx("cf-popover", className)}
        data-state={open ? "open" : "closed"}
        data-cf-fallback-open={open ? "true" : undefined}
        data-cf-positioned="anchor"
        data-placement={placement}
        hidden={hiddenProp ?? !open}
        popover={popoverMode}
      >
        {children}
      </div>
    </div>
  );
}

export interface DropdownMenuProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  items: readonly MenuItem[];
  trigger: ReactNode;
  triggerLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: MenuItem) => void;
  size?: Size;
  placement?: "top" | "right" | "bottom" | "left";
}

export function DropdownMenu({
  items,
  trigger,
  triggerLabel = "Open menu",
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  size = "md",
  placement = "bottom",
  id: providedId,
  hidden: hiddenProp,
  popover: popoverMode = "manual",
  onKeyDown: onMenuKeyDown,
  onToggle: onMenuToggle,
  className,
  ...props
}: DropdownMenuProps) {
  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const ref = usePopoverElement(open, setOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const typeahead = useRef("");
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const firstEnabled = items.findIndex((item) => !item.disabled);
  const lastEnabled = items.reduce((found, item, index) => (item.disabled ? found : index), -1);
  const [activeIndex, setActiveIndex] = useState(firstEnabled);
  const safeActiveIndex = items[activeIndex] && !items[activeIndex]?.disabled ? activeIndex : firstEnabled;
  useFloatingPositioning(open, ref, rootRef, ".cf-dropdown-menu__trigger", placement);

  useEffect(
    () => () => {
      if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
    },
    [],
  );

  const focusAt = (index: number) => {
    if (index < 0 || items[index]?.disabled) return;
    setActiveIndex(index);
    itemRefs.current[index]?.focus();
  };

  const focusRelative = (from: number, direction: 1 | -1) => {
    let index = from;
    for (let count = 0; count < items.length; count += 1) {
      index = (index + direction + items.length) % items.length;
      if (!items[index]?.disabled) {
        focusAt(index);
        break;
      }
    }
  };

  const closeAndReturnFocus = () => {
    setOpen(false);
    queueMicrotask(() => triggerElement?.focus());
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onMenuKeyDown?.(event);
    if (event.defaultPrevented) return;
    const index = itemRefs.current.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusRelative(index, 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusRelative(index < 0 ? firstEnabled : index, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(firstEnabled);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(lastEnabled);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAndReturnFocus();
    } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      typeahead.current += event.key.toLocaleLowerCase();
      if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
      typeaheadTimer.current = setTimeout(() => {
        typeahead.current = "";
      }, 500);
      for (let offset = 1; offset <= items.length; offset += 1) {
        const found = (Math.max(index, -1) + offset) % items.length;
        const item = items[found];
        if (item && !item.disabled && item.label.toLocaleLowerCase().startsWith(typeahead.current)) {
          focusAt(found);
          break;
        }
      }
    }
  };

  return (
    <div ref={rootRef} className="cf-dropdown-menu-root">
      <Trigger
        trigger={trigger}
        className="cf-dropdown-menu__trigger"
        label={triggerLabel}
        controls={id}
        expanded={open}
        hasPopup="menu"
        setTriggerElement={setTriggerElement}
        onPress={() => {
          if (open) setOpen(false);
          else {
            setOpen(true);
            queueMicrotask(() => focusAt(firstEnabled));
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            queueMicrotask(() => focusAt(firstEnabled));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            queueMicrotask(() => focusAt(lastEnabled));
          }
        }}
      />
      <div
        {...props}
        ref={ref}
        id={id}
        role="menu"
        className={cx("cf-menu", "cf-dropdown-menu", className)}
        data-state={open ? "open" : "closed"}
        data-cf-fallback-open={open ? "true" : undefined}
        data-cf-positioned="anchor"
        data-placement={placement}
        data-size={size}
        hidden={hiddenProp ?? !open}
        onKeyDown={handleMenuKeyDown}
        onToggle={onMenuToggle}
        popover={popoverMode}
      >
        {items.map((item, index) => {
          const itemProps = {
            className: "cf-menu__item cf-dropdown-menu__item",
            role: "menuitem" as const,
            tabIndex: !item.disabled && index === safeActiveIndex ? 0 : -1,
            "aria-disabled": item.disabled || undefined,
            "data-destructive": item.destructive || undefined,
            "data-tone": item.destructive ? "danger" : undefined,
            ref: (node: HTMLElement | null) => {
              itemRefs.current[index] = node;
            },
            onFocus: () => {
              if (!item.disabled) setActiveIndex(index);
            },
            onClick: (event: React.MouseEvent) => {
              if (item.disabled) {
                event.preventDefault();
                return;
              }
              onSelect?.(item);
              closeAndReturnFocus();
            },
          };
          return item.href ? (
            <a key={item.id} href={item.disabled ? undefined : item.href} {...itemProps}>
              {item.label}
            </a>
          ) : (
            <button key={item.id} type="button" disabled={item.disabled} {...itemProps}>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface ReactTabItem extends TabItem {
  content: ReactNode;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  items: readonly ReactTabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  orientation?: "horizontal" | "vertical";
  activation?: "automatic" | "manual";
}

export function Tabs({
  items,
  value: controlledValue,
  defaultValue,
  onValueChange,
  label = "Tabs",
  orientation = "horizontal",
  activation = "automatic",
  className,
  ...props
}: TabsProps) {
  const first = items.find((item) => !item.disabled)?.id ?? "";
  const [value, setValue] = useControllableState({
    value: controlledValue,
    defaultValue: defaultValue ?? first,
    onChange: onValueChange,
  });
  const id = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const moveFocus = (index: number, direction: 1 | -1) => {
    let next = index;
    for (let count = 0; count < items.length; count += 1) {
      next = (next + direction + items.length) % items.length;
      const item = items[next];
      if (item && !item.disabled) {
        refs.current[next]?.focus();
        if (activation === "automatic") setValue(item.id);
        break;
      }
    }
  };
  return (
    <div className={cx("cf-tabs", className)} data-orientation={orientation} {...props}>
      <div className="cf-tabs__list" role="tablist" aria-label={label} aria-orientation={orientation}>
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            id={`${id}-tab-${item.id}`}
            className="cf-tabs__tab"
            type="button"
            role="tab"
            disabled={item.disabled}
            tabIndex={value === item.id ? 0 : -1}
            aria-selected={value === item.id}
            aria-controls={`${id}-panel-${item.id}`}
            data-state={value === item.id ? "active" : "inactive"}
            onClick={() => setValue(item.id)}
            onKeyDown={(event) => {
              const previous = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
              const next = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
              if (event.key === previous) {
                event.preventDefault();
                moveFocus(index, -1);
              }
              if (event.key === next) {
                event.preventDefault();
                moveFocus(index, 1);
              }
              if (event.key === "Home") {
                event.preventDefault();
                moveFocus(-1, 1);
              }
              if (event.key === "End") {
                event.preventDefault();
                moveFocus(0, -1);
              }
              if (activation === "manual" && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                setValue(item.id);
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          id={`${id}-panel-${item.id}`}
          className="cf-tabs__panel"
          role="tabpanel"
          aria-labelledby={`${id}-tab-${item.id}`}
          tabIndex={0}
          hidden={value !== item.id}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}

export interface ReactAccordionItem extends AccordionItem {
  content: ReactNode;
}

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  items: readonly ReactAccordionItem[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: readonly string[]) => void;
  multiple?: boolean;
}

export function Accordion({
  items,
  value: controlledValue,
  defaultValue = [],
  onValueChange,
  multiple = false,
  className,
  ...props
}: AccordionProps) {
  const [value, setValue] = useControllableState<readonly string[]>({
    value: controlledValue,
    defaultValue,
    onChange: onValueChange,
  });
  const baseId = useId();
  const summaryRefs = useRef<Array<HTMLElement | null>>([]);
  const toggle = (id: string, open: boolean) =>
    setValue((current) =>
      open ? (multiple ? [...new Set([...current, id])] : [id]) : current.filter((entry) => entry !== id),
    );
  const focusSummary = (from: number, direction: 1 | -1) => {
    let index = from;
    for (let count = 0; count < items.length; count += 1) {
      index = (index + direction + items.length) % items.length;
      if (!items[index]?.disabled) {
        summaryRefs.current[index]?.focus();
        return;
      }
    }
  };
  return (
    <div className={cx("cf-accordion", className)} data-multiple={multiple || undefined} {...props}>
      {items.map((item, index) => (
        <details
          className="cf-accordion__item"
          key={item.id}
          open={value.includes(item.id)}
          data-state={value.includes(item.id) ? "open" : "closed"}
          data-disabled={item.disabled || undefined}
        >
          <summary
            ref={(node) => {
              summaryRefs.current[index] = node;
            }}
            className="cf-accordion__trigger"
            id={`${baseId}-trigger-${item.id}`}
            aria-controls={`${baseId}-panel-${item.id}`}
            aria-expanded={value.includes(item.id)}
            aria-disabled={item.disabled || undefined}
            tabIndex={item.disabled ? -1 : 0}
            onClick={(event) => {
              event.preventDefault();
              if (!item.disabled) toggle(item.id, !value.includes(item.id));
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                focusSummary(index, 1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                focusSummary(index, -1);
              } else if (event.key === "Home") {
                event.preventDefault();
                focusSummary(-1, 1);
              } else if (event.key === "End") {
                event.preventDefault();
                focusSummary(0, -1);
              }
            }}
          >
            {item.heading}
            <span className="cf-accordion__icon" aria-hidden="true" />
          </summary>
          <div
            className="cf-accordion__content"
            id={`${baseId}-panel-${item.id}`}
            role="region"
            aria-labelledby={`${baseId}-trigger-${item.id}`}
          >
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
}

export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "content" | "children"> {
  content: ReactNode;
  children: ReactElement;
  delay?: number;
  placement?: "top" | "right" | "bottom" | "left";
}

export function Tooltip({
  content,
  children,
  delay = 1000,
  placement = "top",
  className,
  ...props
}: TooltipProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const surfaceRef = useRef<HTMLSpanElement>(null);
  const id = useId();
  useEffect(() => {
    const surface = surfaceRef.current;
    const wrapper = rootRef.current?.querySelector<HTMLElement>(".cf-tooltip__trigger") ?? null;
    const trigger =
      wrapper?.querySelector<HTMLElement>(
        'a[href], button, input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
      ) ?? wrapper;
    if (!surface || !trigger) return;
    const controller = createTooltipController(surface, { triggers: trigger, delay, placement });
    return () => controller.destroy();
  }, [delay, placement]);

  const trigger = Children.only(children);
  return (
    <span ref={rootRef} className="cf-tooltip-root">
      <span className="cf-tooltip__trigger">{trigger}</span>
      <span
        ref={surfaceRef}
        id={id}
        role="tooltip"
        className={cx("cf-tooltip", className)}
        data-state="closed"
        data-placement={placement}
        popover="manual"
        {...props}
      >
        {content}
      </span>
    </span>
  );
}

type AnimatedToastRecord = ToastRecord & { state: "open" | "closed" };

interface ToastContextValue {
  toasts: readonly AnimatedToastRecord[];
  add: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  finishDismissal: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_EVENT = "cf:toast";
let toastSequence = 0;
const TOAST_EXIT_FALLBACK_MS = 250;

function createToastId(): string {
  toastSequence += 1;
  return `cf-toast-${toastSequence}`;
}

/** Dispatch a toast to mounted providers and return its stable dismissal ID. */
export function toast(input: ToastInput): string {
  const id = input.id ?? createToastId();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<ToastInput>(TOAST_EVENT, { detail: { ...input, id } }));
  }
  return id;
}

export interface ToastProviderProps {
  children: ReactNode;
  limit?: number;
  defaultDuration?: number;
}

export function ToastProvider({ children, limit = 5, defaultDuration = 5000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<AnimatedToastRecord[]>([]);
  const toastsRef = useRef<AnimatedToastRecord[]>([]);
  const timers = useRef(new Map<string, number>());

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const finishDismissal = useCallback(
    (id: string) => {
      clearTimer(id);
      const next = toastsRef.current.filter((item) => item.id !== id);
      toastsRef.current = next;
      setToasts(next);
    },
    [clearTimer],
  );

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      const current = toastsRef.current.find((item) => item.id === id);
      if (!current || current.state === "closed") return;
      const shouldAnimate =
        typeof window.AnimationEvent === "function" &&
        typeof window.matchMedia === "function" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!shouldAnimate) {
        finishDismissal(id);
        return;
      }
      const next = toastsRef.current.map((item) =>
        item.id === id ? { ...item, state: "closed" as const } : item,
      );
      toastsRef.current = next;
      setToasts(next);
      timers.current.set(
        id,
        window.setTimeout(() => finishDismissal(id), TOAST_EXIT_FALLBACK_MS),
      );
    },
    [clearTimer, finishDismissal],
  );

  const add = useCallback(
    (input: ToastInput) => {
      const id = input.id ?? createToastId();
      const record: AnimatedToastRecord = {
        id,
        title: input.title,
        tone: input.tone ?? "neutral",
        duration: input.duration ?? defaultDuration,
        state: "open",
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.action === undefined ? {} : { action: input.action }),
      };
      clearTimer(id);
      const previous = toastsRef.current;
      const boundedLimit = Math.max(0, limit);
      const candidates = [...previous.filter((item) => item.id !== id), record];
      const next = boundedLimit === 0 ? [] : candidates.slice(-boundedLimit);
      const retained = new Set(next.map((item) => item.id));
      for (const item of previous) if (!retained.has(item.id)) clearTimer(item.id);
      toastsRef.current = next;
      setToasts(next);
      if (record.duration > 0 && retained.has(id)) {
        timers.current.set(
          id,
          window.setTimeout(() => dismiss(id), record.duration),
        );
      }
      return id;
    },
    [clearTimer, defaultDuration, dismiss, limit],
  );

  useEffect(() => {
    const listener = (event: Event) => add((event as CustomEvent<ToastInput>).detail);
    window.addEventListener(TOAST_EVENT, listener);
    return () => window.removeEventListener(TOAST_EVENT, listener);
  }, [add]);

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) clearTimeout(timer);
      timers.current.clear();
      toastsRef.current = [];
    },
    [],
  );

  const context = useMemo(
    () => ({ toasts, add, dismiss, finishDismissal }),
    [toasts, add, dismiss, finishDismissal],
  );
  return <ToastContext.Provider value={context}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return { toast: context.add, dismiss: context.dismiss };
}

export interface ToastViewportProps extends HTMLAttributes<HTMLOListElement> {
  label?: string;
  closeLabel?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function ToastViewport({
  label = "Notifications",
  closeLabel = "Dismiss notification",
  position = "bottom-right",
  className,
  ...props
}: ToastViewportProps) {
  const context = useContext(ToastContext);
  if (!context) throw new Error("ToastViewport must be used inside ToastProvider");
  return (
    <ol
      className={cx("cf-toast-viewport", className)}
      data-position={position}
      aria-label={label}
      aria-live="polite"
      aria-relevant="additions removals"
      {...props}
    >
      {context.toasts.map((item) => (
        <li
          className="cf-toast"
          data-state={item.state}
          data-tone={item.tone}
          key={item.id}
          role={item.tone === "danger" ? "alert" : "status"}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget && item.state === "closed") {
              context.finishDismissal(item.id);
            }
          }}
        >
          <div className="cf-toast__content">
            <strong className="cf-toast__title">{item.title}</strong>
            {item.description ? <div className="cf-toast__description">{item.description}</div> : null}
          </div>
          {item.action ? (
            <button
              type="button"
              className="cf-toast__action"
              onClick={() => {
                item.action?.onClick();
                context.dismiss(item.id);
              }}
            >
              {item.action.label}
            </button>
          ) : null}
          <button
            type="button"
            className="cf-toast__close"
            aria-label={closeLabel}
            onClick={() => context.dismiss(item.id)}
          >
            ×
          </button>
        </li>
      ))}
    </ol>
  );
}
