"use client";

import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { copyText, tokenizeBashCommand } from "@cofob/design-system-css";
import type { BashToken, TerminalCodeEntry } from "@cofob/design-system-css";
import { cx } from "./utils.js";

type CopyState = "idle" | "copied" | "error";

interface CopyButtonProps {
  value: string;
  label: string;
  copiedLabel: string;
  errorLabel: string;
  ariaLabel: string;
  copiedAriaLabel: string;
  errorAriaLabel: string;
  resetAfter: number;
}

function BashTokenView({ token }: { token: BashToken }) {
  if (token.kind === "plain") return token.value;
  return (
    <span className="cf-syntax-token" data-token={token.kind}>
      {token.value}
    </span>
  );
}

function CopyButton({
  value,
  label,
  copiedLabel,
  errorLabel,
  ariaLabel,
  copiedAriaLabel,
  errorAriaLabel,
  resetAfter,
}: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const visibleLabel = state === "copied" ? copiedLabel : state === "error" ? errorLabel : label;
  const activeAriaLabel =
    state === "copied" ? copiedAriaLabel : state === "error" ? errorAriaLabel : ariaLabel;

  return (
    <button
      type="button"
      className="cf-code-copy"
      data-cf-copy-button
      data-cf-copy-managed="true"
      data-copy-state={state}
      aria-label={activeAriaLabel}
      onClick={async () => {
        if (resetTimer.current) clearTimeout(resetTimer.current);
        try {
          await copyText(value);
          setState("copied");
        } catch {
          setState("error");
        }
        resetTimer.current = setTimeout(() => setState("idle"), resetAfter);
      }}
    >
      <span data-cf-copy-label>{visibleLabel}</span>
    </button>
  );
}

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  code: string;
  language?: string;
  showLanguage?: boolean;
  copyable?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
  copyErrorLabel?: string;
  copyResetAfter?: number;
}

export function CodeBlock({
  code,
  language,
  showLanguage,
  copyable = true,
  copyLabel = "Copy",
  copiedLabel = "Copied",
  copyErrorLabel = "Try again",
  copyResetAfter = 1800,
  className,
  ...props
}: CodeBlockProps) {
  const displaysLanguage = Boolean(language) && (showLanguage ?? true);
  const hasToolbar = displaysLanguage || copyable;

  return (
    <div
      className={cx("cf-code-block", className)}
      data-language={language || undefined}
      data-copyable={copyable || undefined}
      data-cf-copy-scope
      {...props}
    >
      {hasToolbar ? (
        <div className="cf-code-block__toolbar">
          {displaysLanguage ? <span className="cf-code-block__language">{language}</span> : <span />}
          {copyable ? (
            <CopyButton
              value={code}
              label={copyLabel}
              copiedLabel={copiedLabel}
              errorLabel={copyErrorLabel}
              ariaLabel={`Copy${language ? ` ${language}` : ""} code`}
              copiedAriaLabel="Code copied to clipboard"
              errorAriaLabel="Could not copy code. Try again"
              resetAfter={copyResetAfter}
            />
          ) : null}
        </div>
      ) : null}
      <pre
        className="cf-code-block__pre"
        role="region"
        aria-label={language ? `${language} code` : "Code"}
        tabIndex={0}
      >
        <code data-cf-copy-source>{code}</code>
        <span className="cf-visually-hidden" aria-live="polite" data-cf-copy-status />
      </pre>
    </div>
  );
}

export interface TerminalCodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  entries: readonly TerminalCodeEntry[];
  label?: string;
  prompt?: string;
  copyable?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
  copyErrorLabel?: string;
  copyResetAfter?: number;
  outputLabel?: string;
}

export function TerminalCodeBlock({
  entries,
  label = "Terminal",
  prompt = "$",
  copyable = true,
  copyLabel = "Copy command",
  copiedLabel = "Copied",
  copyErrorLabel = "Try again",
  copyResetAfter = 1800,
  outputLabel = "Command output",
  className,
  ...props
}: TerminalCodeBlockProps) {
  return (
    <div className={cx("cf-terminal-code-block", className)} role="region" aria-label={label} {...props}>
      <div className="cf-terminal-code-block__toolbar">
        <span className="cf-terminal-code-block__label">{label}</span>
      </div>
      <div className="cf-terminal-code-block__entries">
        {entries.map((entry, index) => (
          <div className="cf-terminal-code-block__entry" data-cf-copy-scope key={`${entry.command}:${index}`}>
            <div className="cf-terminal-code-block__command-row">
              <span className="cf-terminal-code-block__prompt" aria-hidden="true">
                {prompt}
              </span>
              <pre className="cf-terminal-code-block__command">
                <code data-cf-copy-source data-language="bash">
                  {tokenizeBashCommand(entry.command).map((token, tokenIndex) => (
                    <BashTokenView token={token} key={tokenIndex} />
                  ))}
                </code>
              </pre>
              {copyable ? (
                <CopyButton
                  value={entry.command}
                  label={copyLabel}
                  copiedLabel={copiedLabel}
                  errorLabel={copyErrorLabel}
                  ariaLabel={`Copy command ${index + 1}`}
                  copiedAriaLabel={`Command ${index + 1} copied to clipboard`}
                  errorAriaLabel={`Could not copy command ${index + 1}. Try again`}
                  resetAfter={copyResetAfter}
                />
              ) : null}
            </div>
            {entry.output !== undefined ? (
              <pre
                className="cf-terminal-code-block__output"
                role="region"
                tabIndex={0}
                aria-label={`${outputLabel} ${index + 1}`}
              >
                <code>{entry.output}</code>
              </pre>
            ) : null}
            <span className="cf-visually-hidden" aria-live="polite" data-cf-copy-status />
          </div>
        ))}
      </div>
    </div>
  );
}
