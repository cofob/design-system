import {
  terminalColorToCss,
  tokenizeTerminalOutput,
  type TerminalOutputToken,
  type TerminalTextStyle,
} from "@cofob/design-system-css";

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function renderToken(token: TerminalOutputToken): string {
  if (Object.keys(token.style).length === 0) return escapeHtml(token.value);
  const style = token.style;
  const attributes: string[] = ['class="cf-terminal-output__token"'];
  const properties: string[] = [];
  const flags: (keyof TerminalTextStyle)[] = [
    "bold",
    "dim",
    "italic",
    "inverse",
    "concealed",
    "strikethrough",
    "overline",
  ];
  for (const flag of flags) if (style[flag]) attributes.push(`data-${flag}="true"`);
  if (style.underline) attributes.push(`data-underline="${style.underline}"`);
  if (style.concealed) attributes.push('aria-hidden="true"');
  if (style.foreground) {
    properties.push(`--cf-terminal-token-foreground:${terminalColorToCss(style.foreground)}`);
  }
  if (style.background) {
    properties.push(`--cf-terminal-token-background:${terminalColorToCss(style.background, "background")}`);
  }
  if (style.underlineColor) {
    properties.push(`--cf-terminal-token-underline:${terminalColorToCss(style.underlineColor)}`);
  }
  const decorations = [
    style.underline ? "underline" : undefined,
    style.strikethrough ? "line-through" : undefined,
    style.overline ? "overline" : undefined,
  ].filter(Boolean);
  if (decorations.length) {
    properties.push(`--cf-terminal-token-decoration-line:${decorations.join(" ")}`);
  }
  if (style.underline) {
    properties.push(
      `--cf-terminal-token-decoration-style:${style.underline === "curly" ? "wavy" : style.underline === "single" ? "solid" : style.underline}`,
    );
  }
  if (properties.length) attributes.push(`style="${escapeHtml(properties.join(";"))}"`);
  return `<span ${attributes.join(" ")}>${escapeHtml(token.value)}</span>`;
}

export function renderTerminalOutput(output: string): string {
  const tokens = tokenizeTerminalOutput(output);
  const runs: { href?: string; tokens: TerminalOutputToken[] }[] = [];
  for (const token of tokens) {
    const previous = runs.at(-1);
    if (previous && previous.href === token.href) previous.tokens.push(token);
    else runs.push({ ...(token.href ? { href: token.href } : {}), tokens: [token] });
  }

  return `<code>${runs
    .map((run) => {
      const content = run.tokens.map(renderToken).join("");
      if (!run.href || run.tokens.every((token) => token.style.concealed)) return content;
      return `<a class="cf-terminal-output__link" href="${escapeHtml(run.href)}" target="_blank" rel="noopener noreferrer">${content}</a>`;
    })
    .join("")}</code>`;
}
