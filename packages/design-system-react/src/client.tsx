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
  useSyncExternalStore,
} from "react";
import type {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  CSSProperties,
  DialogHTMLAttributes,
  ForwardedRef,
  HTMLAttributes,
  InputHTMLAttributes,
  AudioHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  ReactElement,
  ReactNode,
  VideoHTMLAttributes,
} from "react";
import {
  ANIMATED_STICKERS_ATTRIBUTE,
  createAnimatedStickerController,
  createPopoverController,
  createThemeController,
  createTooltipController,
  getAnimatedStickersEnabled,
  setAnimatedStickersEnabled,
  subscribeAnimatedStickersEnabled,
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
import { cx, slugId } from "./utils.js";

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
 * Plays a converted Telegram sticker over its server-rendered first frame.
 * Never pass unsanitized user SVG as skeletonSvg.
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
      {sticker.skeletonSvg ? (
        <span
          className="cf-animated-sticker__skeleton"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: sticker.skeletonSvg }}
        />
      ) : (
        <span className="cf-animated-sticker__skeleton" aria-hidden="true">
          <img
            src={sticker.firstFrameSrc}
            alt=""
            width={sticker.width}
            height={sticker.height}
            decoding="async"
          />
        </span>
      )}
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

export interface AnimatedStickerToggleProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "checked" | "defaultChecked" | "children" | "size" | "type"
> {
  enabled?: boolean;
  defaultEnabled?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  size?: Size;
  onEnabledChange?: (enabled: boolean) => void;
}

/** Controls the document-wide animated sticker flag. Static SVG/WebP stickers are unaffected. */
export const AnimatedStickerToggle = forwardRef<HTMLInputElement, AnimatedStickerToggleProps>(
  function AnimatedStickerToggle(
    {
      enabled,
      defaultEnabled = true,
      label = "Animated stickers",
      description,
      size = "md",
      className,
      disabled,
      onChange,
      onEnabledChange,
      ...props
    },
    ref,
  ) {
    const [uncontrolledEnabled, setUncontrolledEnabled] = useState(defaultEnabled);
    const controlled = enabled !== undefined;
    const currentEnabled = enabled ?? uncontrolledEnabled;
    const initialEnabled = useRef(currentEnabled);

    useEffect(() => {
      const preferenceRoot = document.documentElement;
      getAnimatedStickersEnabled(preferenceRoot);
      if (controlled || !preferenceRoot.hasAttribute(ANIMATED_STICKERS_ATTRIBUTE)) {
        setAnimatedStickersEnabled(initialEnabled.current, preferenceRoot);
      }
      return subscribeAnimatedStickersEnabled((nextEnabled) => {
        if (!controlled) setUncontrolledEnabled(nextEnabled);
      }, preferenceRoot);
      // The initial global contract is established once; controlled updates are synchronized below.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (controlled) setAnimatedStickersEnabled(currentEnabled);
    }, [controlled, currentEnabled]);

    return (
      <label
        className={cx("cf-switch", "cf-animated-sticker-toggle", className)}
        data-cf-animated-sticker-toggle-root
        data-size={size}
        data-state={currentEnabled ? "checked" : "unchecked"}
        data-disabled={disabled || undefined}
      >
        <input
          {...props}
          ref={ref}
          className="cf-switch__control"
          type="checkbox"
          role="switch"
          checked={currentEnabled}
          disabled={disabled}
          aria-checked={currentEnabled}
          data-cf-animated-sticker-toggle
          data-cf-animated-sticker-toggle-managed="true"
          onChange={(event) => {
            onChange?.(event);
            if (event.defaultPrevented) return;
            const nextEnabled = event.currentTarget.checked;
            if (!controlled) setUncontrolledEnabled(nextEnabled);
            if (nextEnabled !== currentEnabled) onEnabledChange?.(nextEnabled);
            setAnimatedStickersEnabled(nextEnabled);
          }}
        />
        <span className="cf-switch__track" aria-hidden="true">
          <span className="cf-switch__thumb" />
        </span>
        <span className="cf-switch__content">
          <span className="cf-switch__label">{label}</span>
          {description ? <span className="cf-switch__description">{description}</span> : null}
        </span>
      </label>
    );
  },
);

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

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ComboboxProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  label: ReactNode;
  options: readonly ComboboxOption[];
  value?: string;
  defaultValue?: string;
  inputValue?: string;
  defaultInputValue?: string;
  name?: string;
  placeholder?: string;
  hint?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  noResultsLabel?: string;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "name">;
  onValueChange?: (value: string, option: ComboboxOption) => void;
  onInputValueChange?: (value: string) => void;
}

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    label,
    options,
    value: controlledValue,
    defaultValue = "",
    inputValue: controlledInputValue,
    defaultInputValue,
    name,
    placeholder,
    hint,
    disabled = false,
    required = false,
    noResultsLabel = "No results found",
    inputProps,
    onValueChange,
    onInputValueChange,
    className,
    onBlur,
    ...props
  },
  forwardedRef,
) {
  const [value, setValue] = useControllableState({
    value: controlledValue,
    defaultValue,
  });
  const selectedOption = options.find((option) => option.value === value);
  const [query, setQuery] = useControllableState({
    value: controlledInputValue,
    defaultValue: defaultInputValue ?? selectedOption?.label ?? "",
    onChange: onInputValueChange,
  });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const generatedId = useId().replaceAll(":", "");
  const inputId = inputProps?.id ?? `cf-combobox-${generatedId}`;
  const listboxId = `${inputId}-listbox`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized || selectedOption?.label === query) return options;
    return options.filter((option) =>
      `${option.label} ${option.description ?? ""}`.toLocaleLowerCase().includes(normalized),
    );
  }, [options, query, selectedOption?.label]);
  const enabledOptions = filteredOptions.filter((option) => !option.disabled);
  const activeOption = enabledOptions[Math.min(activeIndex, Math.max(0, enabledOptions.length - 1))];

  const choose = useCallback(
    (option: ComboboxOption) => {
      if (option.disabled) return;
      setValue(option.value);
      setQuery(option.label);
      setOpen(false);
      onValueChange?.(option.value, option);
    },
    [onValueChange, setQuery, setValue],
  );
  const move = (offset: number) => {
    if (enabledOptions.length === 0) return;
    setOpen(true);
    setActiveIndex((current) => {
      const next = current + offset;
      return ((next % enabledOptions.length) + enabledOptions.length) % enabledOptions.length;
    });
  };

  return (
    <div
      className={cx("cf-combobox", className)}
      data-state={open ? "open" : "closed"}
      data-value={value || undefined}
      {...props}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.defaultPrevented && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="cf-combobox__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="cf-combobox__input-wrap">
        <input
          {...inputProps}
          ref={(node) => {
            inputRef.current = node;
            setForwardedRef(forwardedRef, node);
          }}
          id={inputId}
          className={cx("cf-input", "cf-combobox__input", inputProps?.className)}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-activedescendant={
            open && activeOption ? `${listboxId}-${slugId(activeOption.value)}` : undefined
          }
          aria-describedby={[inputProps?.["aria-describedby"], hintId].filter(Boolean).join(" ") || undefined}
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          required={required}
          onFocus={(event) => {
            inputProps?.onFocus?.(event);
            if (!event.defaultPrevented && !disabled) {
              setActiveIndex(0);
              setOpen(true);
            }
          }}
          onChange={(event) => {
            inputProps?.onChange?.(event);
            if (event.defaultPrevented) return;
            setQuery(event.currentTarget.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            inputProps?.onKeyDown?.(event);
            if (event.defaultPrevented) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              move(event.key === "ArrowDown" ? 1 : -1);
            } else if (event.key === "Home" && open) {
              event.preventDefault();
              setActiveIndex(0);
            } else if (event.key === "End" && open) {
              event.preventDefault();
              setActiveIndex(Math.max(0, enabledOptions.length - 1));
            } else if (event.key === "Enter" && open && activeOption) {
              event.preventDefault();
              choose(activeOption);
            } else if (event.key === "Escape" && open) {
              event.preventDefault();
              setOpen(false);
            }
          }}
        />
      </div>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {hint ? (
        <div className="cf-combobox__hint" id={hintId}>
          {hint}
        </div>
      ) : null}
      <div className="cf-combobox__listbox" id={listboxId} role="listbox" hidden={!open}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => {
            const enabledIndex = enabledOptions.indexOf(option);
            const active = enabledIndex >= 0 && option === activeOption;
            return (
              <div
                className="cf-combobox__option"
                id={`${listboxId}-${slugId(option.value)}`}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                data-active={active || undefined}
                key={option.value}
                onPointerDown={(event) => {
                  event.preventDefault();
                  choose(option);
                  inputRef.current?.focus();
                }}
                onPointerMove={() => {
                  if (enabledIndex >= 0) setActiveIndex(enabledIndex);
                }}
              >
                <span>{option.label}</span>
                {option.description ? (
                  <span className="cf-combobox__option-description">{option.description}</span>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="cf-combobox__empty">{noResultsLabel}</div>
        )}
      </div>
    </div>
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

export interface DrawerProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "open" | "title"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  triggerLabel?: string;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  side?: "left" | "right" | "top" | "bottom";
}

export function Drawer({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  trigger,
  triggerLabel = "Open drawer",
  title,
  description,
  footer,
  closeLabel = "Close drawer",
  side = "right",
  id: providedId,
  className,
  children,
  onCancel,
  onClose,
  onClick,
  ...props
}: DrawerProps) {
  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const drawerRef = useRef<HTMLDialogElement>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const generatedId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const drawerId = providedId ?? generatedId;

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (open && !drawer.open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      if (typeof drawer.showModal === "function") drawer.showModal();
      else drawer.setAttribute("open", "");
    }
    if (!open && drawer.open) {
      if (typeof drawer.close === "function") drawer.close();
      else drawer.removeAttribute("open");
    }
  }, [open]);

  return (
    <>
      {trigger ? (
        <Trigger
          trigger={trigger}
          className="cf-drawer__trigger"
          label={triggerLabel}
          controls={drawerId}
          expanded={open}
          hasPopup="dialog"
          setTriggerElement={setTriggerElement}
          onPress={() => setOpen(true)}
        />
      ) : null}
      <dialog
        ref={drawerRef}
        id={drawerId}
        className={cx("cf-drawer", className)}
        data-state={open ? "open" : "closed"}
        data-side={side}
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
        <div className="cf-drawer__surface">
          <header className="cf-drawer__header">
            <div>
              <h2 className="cf-drawer__title" id={titleId}>
                {title}
              </h2>
              {description ? (
                <p className="cf-drawer__description" id={descriptionId}>
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="cf-drawer__close"
              aria-label={closeLabel}
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div className="cf-drawer__body">{children}</div>
          {footer ? <footer className="cf-drawer__footer">{footer}</footer> : null}
        </div>
      </dialog>
    </>
  );
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function acceptsFile(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  return accept.split(",").some((entry) => {
    const rule = entry.trim().toLocaleLowerCase();
    if (!rule) return false;
    if (rule.startsWith(".")) return file.name.toLocaleLowerCase().endsWith(rule);
    if (rule.endsWith("/*")) return file.type.toLocaleLowerCase().startsWith(rule.slice(0, -1));
    return file.type.toLocaleLowerCase() === rule;
  });
}

export interface FileUploadProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  label: ReactNode;
  files?: readonly File[];
  defaultFiles?: readonly File[];
  name?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  maxFiles?: number;
  maxSize?: number;
  prompt?: ReactNode;
  hint?: ReactNode;
  removeLabel?: (file: File) => string;
  onFilesChange?: (files: readonly File[]) => void;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "name" | "accept" | "multiple">;
}

export function FileUpload({
  label,
  files: controlledFiles,
  defaultFiles = [],
  name,
  accept,
  multiple = false,
  disabled = false,
  required = false,
  maxFiles = multiple ? Number.POSITIVE_INFINITY : 1,
  maxSize,
  prompt = "Choose files or drag them here",
  hint,
  removeLabel = (file) => `Remove ${file.name}`,
  onFilesChange,
  inputProps,
  className,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: FileUploadProps) {
  const [files, setFiles] = useControllableState<readonly File[]>({
    value: controlledFiles,
    defaultValue: defaultFiles,
    onChange: onFilesChange,
  });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId().replaceAll(":", "");
  const inputId = inputProps?.id ?? `cf-file-upload-${generatedId}`;
  const errorId = `${inputId}-error`;

  const addFiles = (incoming: readonly File[]) => {
    const accepted = incoming.filter(
      (file) => acceptsFile(file, accept) && (!maxSize || file.size <= maxSize),
    );
    const rejectedCount = incoming.length - accepted.length;
    const next = (multiple ? [...files, ...accepted] : accepted.slice(0, 1)).slice(0, maxFiles);
    setFiles(next);
    setError(
      rejectedCount > 0
        ? `${rejectedCount} ${rejectedCount === 1 ? "file was" : "files were"} not accepted.`
        : incoming.length > accepted.length ||
            next.length < (multiple ? files.length + accepted.length : accepted.length)
          ? "Some files exceed the upload limit."
          : "",
    );
  };

  return (
    <div
      className={cx("cf-file-upload", className)}
      data-disabled={disabled || undefined}
      onDragEnter={(event) => {
        onDragEnter?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (!event.defaultPrevented) event.preventDefault();
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event);
        if (event.defaultPrevented) return;
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        onDrop?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        setDragging(false);
        if (!disabled) addFiles(Array.from(event.dataTransfer.files));
      }}
      {...props}
    >
      <label className="cf-file-upload__label" htmlFor={inputId}>
        {label}
      </label>
      <label className="cf-file-upload__dropzone" data-dragging={dragging || undefined} htmlFor={inputId}>
        <input
          {...inputProps}
          ref={inputRef}
          className={cx("cf-file-upload__input", inputProps?.className)}
          id={inputId}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          required={required && files.length === 0}
          aria-describedby={
            [inputProps?.["aria-describedby"], error ? errorId : undefined].filter(Boolean).join(" ") ||
            undefined
          }
          onChange={(event) => {
            inputProps?.onChange?.(event);
            if (!event.defaultPrevented) addFiles(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = "";
          }}
        />
        <span className="cf-file-upload__prompt">{prompt}</span>
        {hint ? <span className="cf-file-upload__hint">{hint}</span> : null}
      </label>
      {error ? (
        <div className="cf-field__error" id={errorId} role="alert">
          {error}
        </div>
      ) : null}
      {files.length > 0 ? (
        <ul className="cf-file-upload__files" aria-label="Selected files">
          {files.map((file, index) => (
            <li className="cf-file-upload__file" key={`${file.name}-${file.lastModified}-${index}`}>
              <span>
                <span>{file.name}</span>{" "}
                <span className="cf-file-upload__file-meta">{formatFileSize(file.size)}</span>
              </span>
              <button
                className="cf-file-upload__remove"
                type="button"
                aria-label={removeLabel(file)}
                disabled={disabled}
                onClick={() => setFiles(files.filter((_, fileIndex) => fileIndex !== index))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "size" | "onChange"
> {
  label: ReactNode;
  value?: number;
  defaultValue?: number;
  showValue?: boolean;
  hint?: ReactNode;
  formatValue?: (value: number) => ReactNode;
  onValueChange?: (value: number) => void;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  containerClassName?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    label,
    value: controlledValue,
    defaultValue = 0,
    min = 0,
    max = 100,
    step = 1,
    showValue = true,
    hint,
    formatValue = (current) => String(current),
    onValueChange,
    onChange,
    containerClassName,
    className,
    id,
    name,
    ...props
  },
  ref,
) {
  const [value, setValue] = useControllableState({
    value: controlledValue,
    defaultValue,
    onChange: onValueChange,
  });
  const generatedId = useId().replaceAll(":", "");
  const inputId = id ?? `cf-slider-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div className={cx("cf-slider", containerClassName)}>
      <div className="cf-slider__header">
        <label className="cf-slider__label" htmlFor={inputId}>
          {label}
        </label>
        {showValue ? (
          <output className="cf-slider__value" htmlFor={inputId}>
            {formatValue(value)}
          </output>
        ) : null}
      </div>
      <input
        {...props}
        ref={ref}
        className={cx("cf-slider__control", className)}
        id={inputId}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-describedby={hintId}
        onChange={(event) => {
          onChange?.(event);
          if (!event.defaultPrevented) setValue(event.currentTarget.valueAsNumber);
        }}
      />
      {hint ? (
        <div className="cf-slider__hint" id={hintId}>
          {hint}
        </div>
      ) : null}
    </div>
  );
});

export interface AudioPlayerLabels {
  play: string;
  pause: string;
  timeline: string;
  mute: string;
  unmute: string;
  volume: string;
}

export interface AudioPlayerProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  durationHint?: number;
  disabled?: boolean;
  labels?: Partial<AudioPlayerLabels>;
  audioProps?: Omit<AudioHTMLAttributes<HTMLAudioElement>, "src" | "controls">;
}

type AudioRangeStyle = CSSProperties & { "--cf-audio-progress": string };

function finiteAudioDuration(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatAudioTime(value: number): string {
  const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function AudioPlayer({
  src,
  durationHint = 0,
  disabled = false,
  labels,
  audioProps,
  className,
  ...props
}: AudioPlayerProps) {
  const copy: AudioPlayerLabels = {
    play: labels?.play ?? "Play audio",
    pause: labels?.pause ?? "Pause audio",
    timeline: labels?.timeline ?? "Playback position",
    mute: labels?.mute ?? "Mute audio",
    unmute: labels?.unmute ?? "Unmute audio",
    volume: labels?.volume ?? "Volume",
  };
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousVolumeRef = useRef(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationHint);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const resolvedDuration = finiteAudioDuration(duration) || finiteAudioDuration(durationHint);
  const timelineMax = Math.max(resolvedDuration, 0.01);
  const timelineValue = Math.min(currentTime, timelineMax);
  const timelineProgress = resolvedDuration > 0 ? (timelineValue / resolvedDuration) * 100 : 0;
  const volumeProgress = muted ? 0 : volume * 100;

  const syncDuration = () => {
    const audio = audioRef.current;
    if (audio) setDuration(finiteAudioDuration(audio.duration) || finiteAudioDuration(durationHint));
  };
  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || disabled) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch {
      setPlaying(false);
    }
  };
  const seek = (nextTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };
  const changeVolume = (nextVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = nextVolume;
    audio.muted = nextVolume === 0;
    if (nextVolume > 0) previousVolumeRef.current = nextVolume;
    setVolume(nextVolume);
    setMuted(nextVolume === 0);
  };
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio || disabled) return;
    if (audio.muted || volume === 0) {
      const restored = previousVolumeRef.current || 1;
      audio.muted = false;
      audio.volume = restored;
      setVolume(restored);
      setMuted(false);
    } else {
      previousVolumeRef.current = volume;
      audio.muted = true;
      setMuted(true);
    }
  };

  return (
    <div
      className={cx("cf-audio-player", className)}
      data-state={playing ? "playing" : "paused"}
      data-muted={muted || volume === 0}
      data-cf-audio-player-managed="true"
      {...props}
    >
      <audio
        {...audioProps}
        ref={audioRef}
        src={src}
        preload={audioProps?.preload ?? "metadata"}
        onDurationChange={(event) => {
          audioProps?.onDurationChange?.(event);
          if (!event.defaultPrevented) syncDuration();
        }}
        onLoadedMetadata={(event) => {
          audioProps?.onLoadedMetadata?.(event);
          if (!event.defaultPrevented) syncDuration();
        }}
        onEnded={(event) => {
          audioProps?.onEnded?.(event);
          setPlaying(false);
        }}
        onPause={(event) => {
          audioProps?.onPause?.(event);
          setPlaying(false);
        }}
        onPlay={(event) => {
          audioProps?.onPlay?.(event);
          setPlaying(true);
        }}
        onTimeUpdate={(event) => {
          audioProps?.onTimeUpdate?.(event);
          setCurrentTime(event.currentTarget.currentTime);
        }}
      />
      <button
        className="cf-audio-player__button"
        type="button"
        aria-label={playing ? copy.pause : copy.play}
        disabled={disabled}
        onClick={() => void togglePlayback()}
      >
        <span className="cf-audio-player__icon cf-audio-player__play-icon" aria-hidden="true" />
      </button>
      <input
        className="cf-audio-player__range cf-audio-player__timeline"
        type="range"
        min={0}
        max={timelineMax}
        step="0.01"
        value={timelineValue}
        aria-label={copy.timeline}
        aria-valuetext={`${formatAudioTime(timelineValue)} of ${formatAudioTime(resolvedDuration)}`}
        disabled={disabled}
        style={{ "--cf-audio-progress": `${timelineProgress}%` } as AudioRangeStyle}
        onChange={(event) => seek(event.currentTarget.valueAsNumber)}
      />
      <span className="cf-audio-player__time">
        {formatAudioTime(timelineValue)} / {formatAudioTime(resolvedDuration)}
      </span>
      <div className="cf-audio-player__volume">
        <button
          className="cf-audio-player__button"
          type="button"
          aria-label={muted || volume === 0 ? copy.unmute : copy.mute}
          disabled={disabled}
          onClick={toggleMute}
        >
          <span className="cf-audio-player__icon cf-audio-player__volume-icon" aria-hidden="true" />
        </button>
        <input
          className="cf-audio-player__range"
          type="range"
          min={0}
          max={1}
          step="0.01"
          value={muted ? 0 : volume}
          aria-label={copy.volume}
          aria-valuetext={`${Math.round(volumeProgress)}%`}
          disabled={disabled}
          style={{ "--cf-audio-progress": `${volumeProgress}%` } as AudioRangeStyle}
          onChange={(event) => changeVolume(event.currentTarget.valueAsNumber)}
        />
      </div>
    </div>
  );
}

export interface VideoPlayerLabels {
  play: string;
  pause: string;
  timeline: string;
  mute: string;
  unmute: string;
  volume: string;
  fullscreen: string;
  exitFullscreen: string;
}

export interface VideoPlayerProps extends HTMLAttributes<HTMLElement> {
  src: string;
  label: string;
  caption?: ReactNode;
  aspectRatio?: CSSProperties["aspectRatio"];
  durationHint?: number;
  disabled?: boolean;
  labels?: Partial<VideoPlayerLabels>;
  videoProps?: Omit<VideoHTMLAttributes<HTMLVideoElement>, "src" | "controls">;
}

type VideoRangeStyle = CSSProperties & { "--cf-video-progress": string };

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function VideoPlayer({
  src,
  label,
  caption,
  aspectRatio = "16 / 9",
  durationHint = 0,
  disabled = false,
  labels,
  videoProps,
  className,
  style,
  tabIndex = -1,
  onKeyDown,
  ...props
}: VideoPlayerProps) {
  const copy: VideoPlayerLabels = {
    play: labels?.play ?? "Play video",
    pause: labels?.pause ?? "Pause video",
    timeline: labels?.timeline ?? "Playback position",
    mute: labels?.mute ?? "Mute video",
    unmute: labels?.unmute ?? "Unmute video",
    volume: labels?.volume ?? "Volume",
    fullscreen: labels?.fullscreen ?? "Enter fullscreen",
    exitFullscreen: labels?.exitFullscreen ?? "Exit fullscreen",
  };
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const fullscreenButtonRef = useRef<HTMLButtonElement>(null);
  const previousVolumeRef = useRef(1);
  const enhanced = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationHint);
  const [muted, setMuted] = useState(Boolean(videoProps?.muted));
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const resolvedDuration = finiteAudioDuration(duration) || finiteAudioDuration(durationHint);
  const timelineMax = Math.max(resolvedDuration, 0.01);
  const timelineValue = Math.min(currentTime, timelineMax);
  const timelineProgress = resolvedDuration > 0 ? (timelineValue / resolvedDuration) * 100 : 0;
  const volumeProgress = muted ? 0 : volume * 100;

  useEffect(() => {
    let wasFullscreen = document.fullscreenElement === rootRef.current;
    const syncFullscreen = () => {
      const isFullscreen = document.fullscreenElement === rootRef.current;
      setFullscreen(isFullscreen);
      if (isFullscreen) rootRef.current?.focus({ preventScroll: true });
      else if (wasFullscreen) fullscreenButtonRef.current?.focus({ preventScroll: true });
      wasFullscreen = isFullscreen;
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const syncDuration = () => {
    const video = videoRef.current;
    if (video) setDuration(finiteAudioDuration(video.duration) || finiteAudioDuration(durationHint));
  };
  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || disabled) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    try {
      await video.play();
      setStarted(true);
      if (document.activeElement === startButtonRef.current) {
        playButtonRef.current?.focus({ preventScroll: true });
      }
    } catch {
      setPlaying(false);
    }
  };
  const seek = (nextTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    const normalized = Math.max(0, Math.min(nextTime, timelineMax));
    video.currentTime = normalized;
    setCurrentTime(normalized);
  };
  const changeVolume = (nextVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    const normalized = Math.max(0, Math.min(nextVolume, 1));
    video.volume = normalized;
    video.muted = normalized === 0;
    if (normalized > 0) previousVolumeRef.current = normalized;
    setVolume(normalized);
    setMuted(normalized === 0);
  };
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video || disabled) return;
    if (video.muted || volume === 0) {
      const restored = previousVolumeRef.current || 1;
      video.muted = false;
      video.volume = restored;
      setVolume(restored);
      setMuted(false);
    } else {
      previousVolumeRef.current = volume;
      video.muted = true;
      setMuted(true);
    }
  };
  const toggleFullscreen = async () => {
    const root = rootRef.current;
    if (!root || disabled) return;
    try {
      if (document.fullscreenElement === root) await document.exitFullscreen?.();
      else await root.requestFullscreen?.();
    } finally {
      const isFullscreen = document.fullscreenElement === root;
      setFullscreen(isFullscreen);
      if (isFullscreen) root.focus({ preventScroll: true });
    }
  };
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || disabled) return;
    const target = event.target as Element;
    if (target.closest("input, select, textarea, [contenteditable]:not([contenteditable='false'])")) return;
    if (target.closest("button, a[href]") && (event.key === " " || event.key === "Enter")) return;

    const key = event.key.toLowerCase();
    const video = videoRef.current;
    if (!video) return;
    if (key === " " || key === "k") {
      event.preventDefault();
      void togglePlayback();
    } else if (key === "arrowleft") {
      event.preventDefault();
      seek(video.currentTime - 5);
    } else if (key === "arrowright") {
      event.preventDefault();
      seek(video.currentTime + 5);
    } else if (key === "arrowup") {
      event.preventDefault();
      changeVolume((video.muted ? previousVolumeRef.current : video.volume) + 0.1);
    } else if (key === "arrowdown") {
      event.preventDefault();
      changeVolume((video.muted ? previousVolumeRef.current : video.volume) - 0.1);
    } else if (key === "m") {
      event.preventDefault();
      toggleMute();
    } else if (key === "f") {
      event.preventDefault();
      void toggleFullscreen();
    }
  };

  return (
    <figure
      ref={rootRef}
      className={cx("cf-video-player", className)}
      data-enhanced={enhanced}
      data-state={playing ? "playing" : "paused"}
      data-muted={muted || volume === 0}
      data-fullscreen={fullscreen}
      data-started={started}
      data-cf-video-player-managed="true"
      style={{ "--cf-video-aspect-ratio": aspectRatio, ...style } as CSSProperties}
      {...props}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
    >
      <div className="cf-video-player__frame">
        <video
          {...videoProps}
          ref={videoRef}
          className={cx("cf-video-player__media", videoProps?.className)}
          src={src}
          controls={!enhanced}
          playsInline={videoProps?.playsInline ?? true}
          preload={videoProps?.preload ?? "metadata"}
          aria-label={videoProps?.["aria-label"] ?? label}
          onClick={(event) => {
            videoProps?.onClick?.(event);
            if (!event.defaultPrevented) void togglePlayback();
          }}
          onDurationChange={(event) => {
            videoProps?.onDurationChange?.(event);
            if (!event.defaultPrevented) syncDuration();
          }}
          onLoadedMetadata={(event) => {
            videoProps?.onLoadedMetadata?.(event);
            if (!event.defaultPrevented) syncDuration();
          }}
          onEnded={(event) => {
            videoProps?.onEnded?.(event);
            setPlaying(false);
          }}
          onPause={(event) => {
            videoProps?.onPause?.(event);
            setPlaying(false);
          }}
          onPlay={(event) => {
            videoProps?.onPlay?.(event);
            setPlaying(true);
            setStarted(true);
          }}
          onTimeUpdate={(event) => {
            videoProps?.onTimeUpdate?.(event);
            setCurrentTime(event.currentTarget.currentTime);
          }}
        />
        <button
          ref={startButtonRef}
          className="cf-video-player__start"
          type="button"
          aria-label={copy.play}
          disabled={disabled}
          onClick={() => void togglePlayback()}
        >
          <span className="cf-video-player__start-icon" aria-hidden="true" />
        </button>
        <div className="cf-video-player__controls">
          <input
            className="cf-video-player__range cf-video-player__timeline"
            type="range"
            min={0}
            max={timelineMax}
            step="0.01"
            value={timelineValue}
            aria-label={copy.timeline}
            aria-valuetext={`${formatAudioTime(timelineValue)} of ${formatAudioTime(resolvedDuration)}`}
            disabled={disabled}
            style={{ "--cf-video-progress": `${timelineProgress}%` } as VideoRangeStyle}
            onChange={(event) => seek(event.currentTarget.valueAsNumber)}
          />
          <button
            ref={playButtonRef}
            className="cf-video-player__button"
            type="button"
            aria-label={playing ? copy.pause : copy.play}
            disabled={disabled}
            onClick={() => void togglePlayback()}
          >
            <span className="cf-video-player__icon cf-video-player__play-icon" aria-hidden="true" />
          </button>
          <span className="cf-video-player__time">
            {formatAudioTime(timelineValue)} / {formatAudioTime(resolvedDuration)}
          </span>
          <div className="cf-video-player__volume">
            <button
              className="cf-video-player__button"
              type="button"
              aria-label={muted || volume === 0 ? copy.unmute : copy.mute}
              disabled={disabled}
              onClick={toggleMute}
            >
              <span className="cf-video-player__icon cf-video-player__volume-icon" aria-hidden="true" />
            </button>
            <input
              className="cf-video-player__range"
              type="range"
              min={0}
              max={1}
              step="0.01"
              value={muted ? 0 : volume}
              aria-label={copy.volume}
              aria-valuetext={`${Math.round(volumeProgress)}%`}
              disabled={disabled}
              style={{ "--cf-video-progress": `${volumeProgress}%` } as VideoRangeStyle}
              onChange={(event) => changeVolume(event.currentTarget.valueAsNumber)}
            />
          </div>
          <button
            ref={fullscreenButtonRef}
            className="cf-video-player__button cf-video-player__fullscreen"
            type="button"
            aria-label={fullscreen ? copy.exitFullscreen : copy.fullscreen}
            disabled={disabled}
            onClick={() => void toggleFullscreen()}
          >
            <span className="cf-video-player__icon cf-video-player__fullscreen-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
      {caption ? <figcaption className="cf-video-player__caption">{caption}</figcaption> : null}
    </figure>
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
