import { createRawSnippet } from "svelte";
import { render } from "svelte/server";
import type {
  ChatMessageModel as CssChatMessageModel,
  LinkModel as CssLinkModel,
  PostModel as CssPostModel,
  ResponsiveImageModel as CssResponsiveImageModel,
} from "@cofob/design-system-css";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import * as system from "../src/lib/index.js";
import type {
  ChatMessage,
  ChatMessageModel,
  LinkItem,
  LinkModel,
  PostModel,
  PostSummary,
  ResponsiveImageModel,
} from "../src/lib/index.js";
import Accordion from "../src/lib/components/Accordion.svelte";
import Alert from "../src/lib/components/Alert.svelte";
import AnimatedSticker from "../src/lib/components/AnimatedSticker.svelte";
import AnimatedStickerToggle from "../src/lib/components/AnimatedStickerToggle.svelte";
import AppShell from "../src/lib/components/AppShell.svelte";
import Avatar from "../src/lib/components/Avatar.svelte";
import BlueLine from "../src/lib/components/BlueLine.svelte";
import Button from "../src/lib/components/Button.svelte";
import Captcha from "../src/lib/components/Captcha.svelte";
import ChatThread from "../src/lib/components/ChatThread.svelte";
import Checkbox from "../src/lib/components/Checkbox.svelte";
import CodeBlock from "../src/lib/components/CodeBlock.svelte";
import Dialog from "../src/lib/components/Dialog.svelte";
import DropdownMenu from "../src/lib/components/DropdownMenu.svelte";
import EmptyState from "../src/lib/components/EmptyState.svelte";
import IconButton from "../src/lib/components/IconButton.svelte";
import InlineEmoji from "../src/lib/components/InlineEmoji.svelte";
import MediaGrid from "../src/lib/components/MediaGrid.svelte";
import Navbar from "../src/lib/components/Navbar.svelte";
import LatestPostCard from "../src/lib/components/LatestPostCard.svelte";
import PostCard from "../src/lib/components/PostCard.svelte";
import Popover from "../src/lib/components/Popover.svelte";
import Prose from "../src/lib/components/Prose.svelte";
import ResponsiveImage from "../src/lib/components/ResponsiveImage.svelte";
import SearchResultCard from "../src/lib/components/SearchResultCard.svelte";
import Select from "../src/lib/components/Select.svelte";
import Switch from "../src/lib/components/Switch.svelte";
import Table from "../src/lib/components/Table.svelte";
import Tabs from "../src/lib/components/Tabs.svelte";
import TerminalCodeBlock from "../src/lib/components/TerminalCodeBlock.svelte";
import Textarea from "../src/lib/components/Textarea.svelte";
import TextField from "../src/lib/components/TextField.svelte";
import ThemeProvider from "../src/lib/components/ThemeProvider.svelte";
import Tooltip from "../src/lib/components/Tooltip.svelte";
import { runComposedEventHandlers } from "../src/lib/internal.js";

const componentNames = [
  "ThemeProvider",
  "ThemeScript",
  "ThemeToggle",
  "SkipLink",
  "AppShell",
  "Heading",
  "Text",
  "Link",
  "Prose",
  "CodeBlock",
  "TerminalCodeBlock",
  "Table",
  "Container",
  "Section",
  "Stack",
  "Inline",
  "Button",
  "IconButton",
  "Field",
  "TextField",
  "Textarea",
  "Select",
  "Checkbox",
  "Switch",
  "Captcha",
  "Badge",
  "Tag",
  "Alert",
  "Card",
  "EmptyState",
  "Pagination",
  "Dialog",
  "Popover",
  "DropdownMenu",
  "Tabs",
  "Accordion",
  "Tooltip",
  "ToastProvider",
  "ToastViewport",
  "BlueLine",
  "Navbar",
  "Footer",
  "PostCard",
  "LatestPostCard",
  "SearchResultCard",
  "ResponsiveImage",
  "Avatar",
  "InlineEmoji",
  "MediaGrid",
  "ChatThread",
  "Sticker",
  "AnimatedSticker",
  "AnimatedStickerToggle",
] as const;

describe("Svelte adapter contract", () => {
  it("server-renders explicit prose width choices", () => {
    const output = render(Prose, { props: { size: "default" } });
    expect(output.body).toContain('class="cf-prose" data-size="default"');
  });

  it("server-renders the animated sticker SVG inline without img or poster", () => {
    const sticker = {
      src: "/stickers/chris.123456789abc.webm",
      skeletonSvg: '<svg viewBox="0 0 512 512"><path d="M0 0h10v10z"/></svg>',
      width: 512,
      height: 512,
    };
    const output = render(AnimatedSticker, {
      props: {
        sticker,
        alt: "Animated Chris",
      },
    });

    expect(output.body).toContain('role="img"');
    expect(output.body).toContain('aria-label="Animated Chris"');
    expect(output.body).toMatch(/class="cf-animated-sticker__skeleton" aria-hidden="true">[\s\S]*?<svg/u);
    expect(output.body).toContain("<video");
    expect(output.body).toContain('data-cf-animated-sticker-src="/stickers/chris.123456789abc.webm"');
    expect(output.body).not.toMatch(/<video[^>]*\ssrc=/u);
    expect(output.body).not.toContain("<img");
    expect(output.body).not.toContain("poster=");
    expect(output.body).not.toContain("data:image");

    const staticOutput = render(AnimatedSticker, {
      props: { sticker, alt: "Static Chris", playback: "static" },
    });
    expect(staticOutput.body).toContain('data-playback="static"');
    expect(staticOutput.body).toContain('data-state="static"');
    expect(staticOutput.body).toContain("<svg");
    expect(staticOutput.body).not.toContain("<video");
  });

  it("server-renders a WebP first frame for video-based stickers", () => {
    const output = render(AnimatedSticker, {
      props: {
        sticker: {
          src: "/stickers/vibe.webm",
          firstFrameSrc: "/stickers/vibe.first-frame.123456789abc.webp",
          width: 192,
          height: 192,
        },
        alt: "Vibe flag",
        playback: "static",
      },
    });
    expect(output.body).toContain('src="/stickers/vibe.first-frame.123456789abc.webp"');
    expect(output.body).not.toContain("<svg");
    expect(output.body).not.toContain("<video");
  });

  it("server-renders the global animated sticker switch", () => {
    const output = render(AnimatedStickerToggle, {
      props: { defaultEnabled: false, label: "Animated stickers" },
    });
    expect(output.body).toContain("cf-animated-sticker-toggle");
    expect(output.body).toContain('role="switch"');
    expect(output.body).toContain('aria-checked="false"');
    expect(output.body).toContain("Animated stickers");
  });

  it("exports every documented component", () => {
    for (const name of componentNames) expect(system[name]).toBeTypeOf("function");
  });

  it("server-renders static components with the shared class contract", () => {
    const output = render(Button, { props: { variant: "secondary", size: "lg" } });
    expect(output.body).toContain("cf-button");
    expect(output.body).toContain('data-variant="secondary"');
    expect(output.body).toContain('data-size="lg"');
  });

  it("server-renders Captcha as a controlled visual state without verification logic", () => {
    const output = render(Captcha, { props: { state: "verifying" } });

    expect(output.body).toContain("cf-captcha");
    expect(output.body).toContain('data-state="verifying"');
    expect(output.body).toContain('aria-label="Verifying…"');
    expect(output.body).toContain('aria-busy="true"');
    expect(output.body).toContain("cf-captcha__progress-value");
    expect(output.body).not.toContain("cf-captcha__brand");
  });

  it("server-renders default copy actions, optional language, and separated terminal output", () => {
    const plainCode = render(CodeBlock, { props: { code: "plain text" } });
    const staticCode = render(CodeBlock, { props: { code: "plain text", copyable: false } });
    const code = render(CodeBlock, {
      props: { code: 'const theme = "dark";', language: "typescript" },
    });
    const terminal = render(TerminalCodeBlock, {
      props: {
        entries: [
          {
            command: "npm run build",
            output:
              "\u001b[1;32mBuild\u001b[0m complete <strong>as text</strong> · \u001b]8;;https://design.cofob.dev\u0007report\u001b]8;;\u0007",
          },
        ],
      },
    });

    expect(plainCode.body).toContain("cf-code-block__toolbar");
    expect(plainCode.body).toContain("Copy");
    expect(staticCode.body).not.toContain("cf-code-block__toolbar");
    expect(code.body).toContain("cf-code-block__language");
    expect(code.body).toContain("typescript");
    expect(code.body).toContain("data-cf-copy-source");
    expect(code.body).toContain("Copy");
    expect(terminal.body).toContain("cf-terminal-code-block__command");
    expect(terminal.body).toContain("cf-terminal-code-block__output");
    expect(terminal.body).toContain('data-language="bash"');
    expect(terminal.body).toContain('class="cf-syntax-token" data-token="command">npm</span>');
    expect(terminal.body.match(/class="cf-syntax-token"/g)).toHaveLength(1);
    expect(terminal.body).toContain(" run build");
    expect(terminal.body).toContain(">Build</span>");
    expect(terminal.body).toContain(" complete");
    expect(terminal.body).toContain("&lt;strong>as text&lt;/strong>");
    expect(terminal.body).toContain('class="cf-terminal-output__token"');
    expect(terminal.body).toContain('data-bold="true"');
    expect(terminal.body).toContain(
      'class="cf-terminal-output__link" href="https://design.cofob.dev" target="_blank" rel="noopener noreferrer"',
    );
    expect(terminal.body).not.toContain("\u001b");
  });

  it("server-renders an accessible responsive table contract", () => {
    const output = render(Table, {
      props: {
        label: "Package comparison",
        density: "compact",
        minWidth: "28rem",
        children: createRawSnippet(() => ({ render: () => "<tbody><tr><td>CSS</td></tr></tbody>" })),
      },
    });

    expect(output.body).toContain('class="cf-table-container"');
    expect(output.body).toContain('aria-label="Package comparison"');
    expect(output.body).toContain("--cf-table-min-width:28rem");
    expect(output.body).toContain('class="cf-table"');
    expect(output.body).toContain('data-density="compact"');
    expect(output.body).toContain('data-header-tone="strong"');
    expect(output.body).toContain('data-striped="true"');
  });

  it("renders BlueLine as the shared inline text marker", () => {
    const output = render(BlueLine, { props: { animate: true, rainbow: true } });
    expect(output.body).toContain("<span");
    expect(output.body).toContain("cf-blue-line");
    expect(output.body).toContain('data-animate="true"');
    expect(output.body).toContain('data-rainbow="true"');
    expect(output.body).not.toContain("<hr");
    expect(output.body).toContain("cf-blue-line__content");
  });

  it("server-renders application and media foundations", () => {
    const shell = render(AppShell, {
      props: {
        children: createRawSnippet(() => ({ render: () => "<main>Main</main><footer>Footer</footer>" })),
      },
    });
    const imageAvatar = render(Avatar, {
      props: { name: "Egor", image: { src: "/avatar.webp", alt: "Egor" } },
    });
    const fallbackAvatar = render(Avatar, { props: { name: "Reader Name", alt: "Reader profile" } });
    const emoji = render(InlineEmoji, {
      props: { image: { src: "/wave.webp", alt: ":wave:", width: 20, height: 20 } },
    });
    const media = render(MediaGrid, {
      props: {
        "aria-label": "Attachments",
        children: createRawSnippet(() => ({ render: () => "<li>Attachment</li>" })),
      },
    });

    expect(shell.body).toContain('<div class="cf-app-shell"><main>Main</main>');
    expect(shell.body).toContain("<footer>Footer</footer>");
    expect(imageAvatar.body).toContain('<span class="cf-avatar" data-size="md">');
    expect(imageAvatar.body).toContain('<img src="/avatar.webp" alt="Egor"');
    expect(imageAvatar.body).toContain('referrerpolicy="no-referrer"');
    expect(fallbackAvatar.body).toContain('role="img" aria-label="Reader profile"');
    expect(fallbackAvatar.body).toContain("RN");
    expect(emoji.body).toContain('class="cf-inline-emoji" src="/wave.webp" alt=":wave:" width="20"');
    expect(emoji.body).toContain('referrerpolicy="no-referrer"');
    expect(media.body).toContain('<ul class="cf-media-grid" aria-label="Attachments"><li>Attachment</li>');
  });

  it("aligns action, selection, and empty-state DOM with the shared adapter contract", () => {
    const iconButton = render(IconButton, { props: { label: "Loading item", loading: true } });
    const checkbox = render(Checkbox, { props: { label: "Unavailable", disabled: true } });
    const switchControl = render(Switch, { props: { label: "Managed", checked: true, disabled: true } });
    const emptyState = render(EmptyState, { props: { title: "No posts yet" } });

    expect(iconButton.body).toContain("cf-icon-button");
    expect(iconButton.body).not.toContain("cf-button__label");
    expect(checkbox.body).toContain('data-disabled="true"');
    expect(checkbox.body).toContain('<input type="checkbox" aria-checked="false" disabled');
    expect(switchControl.body).toContain('class="cf-switch__control" type="checkbox" role="switch"');
    expect(switchControl.body).toContain("cf-switch__track");
    expect(switchControl.body).toContain('data-disabled="true"');
    expect(emptyState.body).toContain('<h2 class="cf-empty-state__title">No posts yet</h2>');
  });

  it("renders Navbar with the shared responsive controller contract", () => {
    const output = render(Navbar, {
      props: {
        links: [{ href: "/notes", label: "Notes", current: true }],
        collapseAt: "tablet",
        menuVariant: "flush",
        surface: "translucent",
      },
    });
    expect(output.body).toContain("data-cf-navbar");
    expect(output.body).toContain('data-collapse-at="tablet"');
    expect(output.body).toContain('data-menu-variant="flush"');
    expect(output.body).toContain('data-surface="translucent"');
    expect(output.body).toContain("cf-navbar__mobile");
    expect(output.body).toContain("data-cf-navbar-trigger");
    expect(output.body).toContain("data-cf-navbar-panel");
    expect(output.body).toContain("cf-navbar__menu-trigger");
    expect(output.body).toContain("cf-navbar__navigation");
    expect(output.body).toContain('aria-current="page"');
  });

  it("server-renders stateful components without browser globals", () => {
    const output = render(Dialog, { props: { title: "SSR dialog", defaultOpen: false } });
    expect(output.body).toContain("cf-dialog");
    expect(output.body).toContain("SSR dialog");
  });

  it("links tabs and panels with stable ids and exposes activation mode", () => {
    const output = render(Tabs, {
      props: {
        id: "settings-tabs",
        label: "Settings sections",
        activationMode: "manual",
        tabs: [
          { id: "profile", label: "Profile", content: "Profile panel" },
          { id: "security", label: "Security", content: "Security panel" },
        ],
      },
    });

    expect(output.body).toContain('data-activation-mode="manual"');
    expect(output.body).toContain('role="tablist" tabindex="-1" aria-label="Settings sections"');
    expect(output.body).toContain('id="settings-tabs-tab-profile"');
    expect(output.body).toContain('aria-controls="settings-tabs-panel-profile"');
    expect(output.body).toContain('id="settings-tabs-panel-profile"');
    expect(output.body).toContain('aria-labelledby="settings-tabs-tab-profile"');
    expect(output.body).toContain('id="settings-tabs-panel-security"');
  });

  it("associates a dialog with its visible title and description", () => {
    const output = render(Dialog, {
      props: {
        id: "confirm-dialog",
        title: "Confirm change",
        description: "This action cannot be undone.",
      },
    });

    expect(output.body).toContain('aria-labelledby="confirm-dialog-title"');
    expect(output.body).toContain('aria-describedby="confirm-dialog-description"');
    expect(output.body).toContain('id="confirm-dialog-title"');
    expect(output.body).toContain('id="confirm-dialog-description"');
    expect(output.body).not.toContain('aria-label="Confirm change"');
  });

  it("connects the default menu trigger and emits a roving tab stop", () => {
    const output = render(DropdownMenu, {
      props: {
        id: "actions-menu",
        label: "Post actions",
        items: [
          { id: "edit", label: "Edit" },
          { id: "duplicate", label: "Duplicate" },
          { id: "archive", label: "Archive", disabled: true },
        ],
      },
    });

    expect(output.body).toContain('id="actions-menu-trigger"');
    expect(output.body).toContain('aria-controls="actions-menu"');
    expect(output.body).toContain('id="actions-menu"');
    expect(output.body).toContain('data-menu-item-id="edit"');
    expect(output.body).toContain('data-menu-item-id="edit" role="menuitem" tabindex="0"');
    expect(output.body).toContain('data-menu-item-id="duplicate" role="menuitem" tabindex="-1"');
  });

  it("emits anchored overlay wrappers and placement data during SSR", () => {
    const popover = render(Popover, { props: { label: "More details", placement: "right" } });
    const menu = render(DropdownMenu, {
      props: {
        label: "Actions",
        placement: "top",
        items: [{ id: "edit", label: "Edit" }],
      },
    });

    expect(popover.body).toContain("cf-popover-root");
    expect(popover.body).toContain("cf-popover__anchor");
    expect(popover.body).toContain('data-cf-positioned="anchor"');
    expect(popover.body).toContain('data-placement="right"');
    expect(menu.body).toContain("cf-dropdown-menu-root");
    expect(menu.body).toContain("cf-dropdown-menu__anchor");
    expect(menu.body).toContain('data-placement="top"');
  });

  it("renders an accessible dismiss control through the shared alert contract", () => {
    const output = render(Alert, {
      props: { title: "Saved", dismissible: true, dismissLabel: "Dismiss saved alert" },
    });

    expect(output.body).toContain("cf-alert__content");
    expect(output.body).toContain("cf-alert__dismiss");
    expect(output.body).toContain('aria-label="Dismiss saved alert"');
    expect(output.body).toContain('<span aria-hidden="true">×</span>');
  });

  it("associates a switch button with its visible label", () => {
    const output = render(Switch, { props: { label: "Enable notifications" } });
    const labelId = output.body.match(/aria-labelledby="([^"]+)"/)?.[1];

    expect(labelId).toBeTruthy();
    expect(output.body).toContain(`id="${labelId}"`);
    expect(output.body).toContain('role="switch"');
  });

  it("generates and exposes a tooltip description id during SSR", () => {
    const output = render(Tooltip, { props: { content: "More information" } });
    const tooltipId = output.body.match(/id="(cf-tooltip-[^"]+)"/)?.[1];

    expect(tooltipId).toBeTruthy();
    expect(output.body).toContain(`aria-describedby="${tooltipId}"`);
    expect(output.body).toContain(`id="${tooltipId}"`);
  });

  it("links accordion summaries and panels while removing disabled triggers from tab order", () => {
    const output = render(Accordion, {
      props: {
        id: "faq",
        items: [
          { id: "shared", heading: "What is shared?", content: "Tokens" },
          { id: "disabled", heading: "Unavailable", content: "Later", disabled: true },
        ],
      },
    });

    expect(output.body).toContain('id="faq-trigger-0"');
    expect(output.body).toContain('aria-controls="faq-panel-0"');
    expect(output.body).toContain('id="faq-panel-0"');
    expect(output.body).toContain('aria-labelledby="faq-trigger-0"');
    expect(output.body).toContain('id="faq-trigger-1"');
    expect(output.body).toContain('aria-disabled="true" tabindex="-1"');
  });

  it("re-exports the canonical portable content models with Svelte composition overrides", () => {
    expectTypeOf<LinkItem>().toEqualTypeOf<CssLinkModel>();
    expectTypeOf<LinkModel>().toEqualTypeOf<CssLinkModel>();
    expectTypeOf<PostSummary>().toEqualTypeOf<CssPostModel>();
    expectTypeOf<PostModel>().toEqualTypeOf<CssPostModel>();
    expectTypeOf<ResponsiveImageModel>().toEqualTypeOf<CssResponsiveImageModel>();
    expectTypeOf<ChatMessageModel>().toEqualTypeOf<CssChatMessageModel>();
    expectTypeOf<ChatMessage["body"]>().toEqualTypeOf<string | Snippet | undefined>();
    expectTypeOf<ChatMessage["link"]>().toEqualTypeOf<string | undefined>();
  });

  it("links generated form hints and errors without discarding consumer descriptions", () => {
    const textField = render(TextField, {
      props: {
        id: "email",
        label: "Email",
        description: "Used for replies.",
        "aria-describedby": "shared-help",
      },
    });
    const textarea = render(Textarea, {
      props: { id: "note", label: "Note", error: "A note is required." },
    });
    const select = render(Select, {
      props: {
        id: "theme",
        label: "Theme",
        error: "Choose a theme.",
        options: [{ value: "system", label: "System" }],
      },
    });

    expect(textField.body).toContain('aria-describedby="shared-help email-description"');
    expect(textField.body).toContain('id="email-description"');
    expect(textarea.body).toContain('aria-describedby="note-error"');
    expect(textarea.body).toContain('id="note-error"');
    expect(select.body).toContain('aria-describedby="theme-error"');
    expect(select.body).toContain('id="theme-error"');
  });

  it("renders lowercase srcset aliases and canonical post fallbacks", () => {
    const image = { src: "/cover.jpg", alt: "Cover", srcset: "/cover-2x.jpg 2x" };
    const responsiveImage = render(ResponsiveImage, { props: { image } });
    const postCard = render(PostCard, {
      props: {
        post: {
          href: "/post",
          title: "Canonical post",
          description: "Portable description",
          published: "2026-07-19",
          cover: image,
        },
      },
    });

    expect(responsiveImage.body).toContain('srcset="/cover-2x.jpg 2x"');
    expect(postCard.body).toContain('srcset="/cover-2x.jpg 2x"');
    expect(postCard.body).toContain("Portable description");
  });

  it("renders the latest post card as one accessible anchor", () => {
    const output = render(LatestPostCard, {
      props: {
        post: { href: "/post", title: "Canonical post", description: "Portable description" },
        target: "_blank",
      },
    });

    expect(output.body).toContain(
      '<a class="cf-latest-post-card" href="/post" aria-label="Canonical post" target="_blank">',
    );
    expect(output.body).not.toContain("<article");
    expect(output.body.match(/<a(?:\s|>)/g)).toHaveLength(1);
    expect(output.body).toContain('<span class="cf-link" aria-hidden="true">Read article');
  });

  it("renders post and search result cards as single accessible anchors", () => {
    const post = {
      href: "/post",
      title: "Canonical design",
      description: "Portable description",
      cover: { src: "/cover.webp", alt: "Cover" },
    };
    const postCard = render(PostCard, { props: { post, target: "_blank" } });
    const searchResultCard = render(SearchResultCard, { props: { result: post, query: "design" } });

    expect(postCard.body).toContain(
      '<a class="cf-post-card" href="/post" aria-label="Canonical design" target="_blank">',
    );
    expect(postCard.body).not.toContain("<article");
    expect(postCard.body.match(/<a(?:\s|>)/g)).toHaveLength(1);
    expect(postCard.body).toContain('<span class="cf-post-card__media"');
    expect(searchResultCard.body).toContain(
      '<a class="cf-search-result-card" href="/post" aria-label="Canonical design" data-query="design">',
    );
    expect(searchResultCard.body).not.toContain("<article");
    expect(searchResultCard.body.match(/<a(?:\s|>)/g)).toHaveLength(1);
    expect(searchResultCard.body).toContain("Canonical ");
    expect(searchResultCard.body).toContain("<mark>design</mark>");
  });

  it("renders theme-aware image layers and preserves canonical dates", () => {
    const image = { src: "/light.jpg", alt: "Light" };
    const darkImage = { src: "/dark.jpg", alt: "Dark" };
    const responsiveImage = render(ResponsiveImage, { props: { image, darkImage } });
    const postCard = render(PostCard, {
      props: {
        post: {
          href: "/post",
          title: "Canonical post",
          published: "19 July 2026",
          publishedAt: "2026-07-19",
          updated: "20 July 2026",
          updatedAt: "2026-07-20",
          readingTime: "4 min read",
          tags: ["design systems"],
        },
      },
    });

    expect(responsiveImage.body).toContain("cf-responsive-image__media");
    expect(responsiveImage.body).toContain('class="cf-responsive-image__light" src="/light.jpg"');
    expect(responsiveImage.body).toContain('class="cf-responsive-image__dark" src="/dark.jpg"');
    expect(postCard.body).toContain('<time datetime="2026-07-19">19 July 2026</time>');
    expect(postCard.body).toContain('<time datetime="2026-07-20">20 July 2026</time>');
    expect(postCard.body).toContain("4 min read");
  });

  it("groups consecutive chat senders and keeps avatars decorative", () => {
    const output = render(ChatThread, {
      props: {
        messages: [
          { id: "text", author: "cofob", body: "Text avatar", timestamp: "19:19" },
          { id: "text-two", author: "cofob", body: "Grouped text", timestamp: "19:20" },
          {
            id: "image",
            author: "reader",
            body: "Image avatar",
            avatar: { src: "/avatar.webp", alt: "Reader avatar", width: 40, height: 40 },
            own: true,
            timestamp: "19:21",
          },
          {
            id: "link",
            author: "reader",
            text: "Source code",
            link: "https://example.com/source",
            linkLabel: "Open source",
            linkExternal: true,
            avatar: { src: "/avatar.webp", alt: "Reader avatar", width: 40, height: 40 },
            own: true,
            timestamp: "19:22",
          },
        ],
      },
    });

    expect(output.body.match(/class="cf-chat__row"/g)).toHaveLength(4);
    expect(output.body.match(/data-group-start="true"/g)).toHaveLength(2);
    expect(output.body.match(/data-group-end="true"/g)).toHaveLength(2);
    expect(output.body.match(/class="cf-chat__author"/g)).toHaveLength(2);
    expect(output.body.match(/class="cf-chat__timestamp"/g)).toHaveLength(4);
    expect(output.body.match(/class="cf-visually-hidden"/g)).toHaveLength(2);
    expect(output.body).toContain('aria-hidden="true">C</span>');
    expect(output.body).toContain('class="cf-chat__avatar" src="/avatar.webp" alt=""');
    expect(output.body).toContain(
      '<a class="cf-link" href="https://example.com/source" target="_blank" rel="noopener noreferrer">Open source</a>',
    );
    expect(output.body).toContain("Source code");
  });

  it("composes consumer and internal event handlers and respects cancellation", () => {
    const calls: string[] = [];
    const consumer = vi.fn((event: Event) => {
      calls.push("consumer");
      event.preventDefault();
    });
    const internal = vi.fn(() => calls.push("internal"));
    const event = new Event("cancel", { cancelable: true });

    runComposedEventHandlers(event, consumer, internal, true);
    expect(calls).toEqual(["consumer"]);
    expect(internal).not.toHaveBeenCalled();

    const uncancelled = new Event("toggle");
    runComposedEventHandlers(uncancelled, () => calls.push("consumer-2"), internal);
    expect(calls.slice(-2)).toEqual(["consumer-2", "internal"]);
  });

  it("accepts an explicit theme preference separately from the uncontrolled default during SSR", () => {
    expect(() =>
      render(ThemeProvider, { props: { preference: "dark", defaultPreference: "light" } }),
    ).not.toThrow();
  });
});
