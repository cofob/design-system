import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Alert,
  AppShell,
  Avatar,
  BlueLine,
  Button,
  Captcha,
  Card,
  ChatThread,
  Checkbox,
  EmptyState,
  IconButton,
  InlineEmoji,
  LatestPostCard,
  Navbar,
  MediaGrid,
  Pagination,
  PostCard,
  Prose,
  SearchResultCard,
  Select,
  Table,
  ResponsiveImage,
} from "./static.js";

describe("static components", () => {
  it("exposes explicit prose width choices", () => {
    const { container, rerender } = render(<Prose size="default">Article body</Prose>);
    expect(container.querySelector(".cf-prose")).toHaveAttribute("data-size", "default");

    rerender(<Prose size="full">Article body</Prose>);
    expect(container.querySelector(".cf-prose")).toHaveAttribute("data-size", "full");
  });

  it("renders without a browser and exposes semantic state", () => {
    const html = renderToString(<Button loading>Save</Button>);
    expect(html).toContain("cf-button");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
  });

  it("renders Captcha as a controlled presentational state without verification logic", () => {
    const { rerender } = render(<Captcha state="verifying" />);
    const captcha = screen.getByRole("button", { name: "Verifying…" });

    expect(captcha).toHaveClass("cf-captcha");
    expect(captcha).toHaveAttribute("data-state", "verifying");
    expect(captcha).toHaveAttribute("aria-busy", "true");
    expect(captcha.querySelector(".cf-captcha__progress-value")).not.toBeNull();
    expect(captcha.querySelector(".cf-captcha__brand")).toBeNull();

    rerender(<Captcha state="success" />);
    expect(screen.getByRole("button", { name: "Verification complete" })).toHaveAttribute(
      "data-state",
      "success",
    );
  });

  it("renders native form controls", () => {
    render(<Checkbox label="Updates" defaultChecked />);
    expect(screen.getByRole("checkbox", { name: "Updates" })).toBeChecked();
  });

  it("renders an accessible responsive table with explicit presentation options", () => {
    const { container } = render(
      <Table label="Package comparison" density="compact" minWidth="28rem">
        <thead>
          <tr>
            <th scope="col">Package</th>
            <th scope="col">Adapter</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">CSS</th>
            <td>Native</td>
          </tr>
        </tbody>
      </Table>,
    );

    const region = screen.getByRole("region", { name: "Package comparison" });
    const table = screen.getByRole("table");
    expect(region).toHaveClass("cf-table-container");
    expect(region).toHaveStyle({ "--cf-table-min-width": "28rem" });
    expect(table).toHaveClass("cf-table");
    expect(table).toHaveAttribute("data-density", "compact");
    expect(table).toHaveAttribute("data-header-tone", "strong");
    expect(table).toHaveAttribute("data-striped", "true");
    expect(container.querySelector("th[scope='row']")).toHaveTextContent("CSS");
  });

  it("keeps loading actions and icon buttons on the shared minimal DOM contract", () => {
    const { container } = render(
      <>
        <Button
          loading
          startIconNode={<span data-testid="leading" />}
          endIconNode={<span data-testid="trailing" />}
        >
          Loading
        </Button>
        <IconButton label="Add item">+</IconButton>
        <IconButton label="Loading item" loading>
          +
        </IconButton>
      </>,
    );

    expect(screen.queryByTestId("leading")).toBeNull();
    expect(screen.queryByTestId("trailing")).toBeNull();
    expect(screen.getByRole("button", { name: "Add item" })).toHaveClass("cf-icon-button");
    expect(screen.getByRole("button", { name: "Add item" })).not.toHaveClass("cf-button");
    expect(screen.getByRole("button", { name: "Loading item" })).toHaveAttribute("data-loading", "true");
    expect(container.querySelectorAll("button button")).toHaveLength(0);
  });

  it("aligns select, checkbox, empty state, BlueLine, and theme-aware image markup", () => {
    const { container } = render(
      <>
        <Select aria-label="Theme">
          <option>System</option>
        </Select>
        <Checkbox label="Option" />
        <EmptyState title="No posts yet" />
        <BlueLine>cofob</BlueLine>
        <ResponsiveImage
          image={{ src: "/light.webp", alt: "Light" }}
          darkImage={{ src: "/dark.webp", alt: "Dark" }}
        />
      </>,
    );

    expect(screen.getByRole("combobox", { name: "Theme" }).parentElement).toHaveClass("cf-select");
    expect(container.querySelector(".cf-checkbox > input + .cf-checkbox__control")).not.toBeNull();
    expect(container.querySelector(".cf-empty-state__title")).not.toHaveAttribute("data-size");
    expect(container.querySelector(".cf-blue-line__content")).toHaveTextContent("cofob");
    expect(
      container.querySelector(".cf-responsive-image__media > .cf-responsive-image__light"),
    ).toHaveAttribute("src", "/light.webp");
    expect(container.querySelector(".cf-responsive-image__dark")).toHaveAttribute("src", "/dark.webp");
  });

  it("uses the shared dismiss and pagination control contracts", () => {
    const { container } = render(
      <>
        <Alert title="Saved" onDismiss={() => undefined}>
          Preferences updated.
        </Alert>
        <Pagination currentPage={1} items={[{ page: 1, label: "One" }]} onPageChange={() => undefined} />
      </>,
    );

    expect(screen.getByRole("button", { name: "Dismiss" })).toHaveClass("cf-alert__dismiss");
    expect(
      screen.getByRole("button", { name: "Dismiss" }).querySelector("[aria-hidden='true']"),
    ).not.toBeNull();
    for (const control of screen.getAllByRole("button", { name: /Previous|One|Next/ })) {
      expect(control).toHaveClass("cf-pagination__link");
    }
    expect(container.querySelector(".cf-alert__content")).not.toBeNull();
  });

  it("does not couple navigation to a router", () => {
    const { container } = render(
      <Navbar
        links={[{ href: "/notes", label: "Notes", current: true }]}
        actions={<button>Search</button>}
        collapseAt="tablet"
        menuVariant="flush"
        surface="translucent"
      />,
    );
    expect(screen.getAllByRole("link", { name: "Notes" })[0]).toHaveAttribute("href", "/notes");
    expect(
      container.querySelector("details.cf-navbar__mobile > summary.cf-navbar__menu-trigger"),
    ).not.toBeNull();
    expect(container.querySelector(".cf-navbar__mobile + .cf-navbar__navigation")).not.toBeNull();
    expect(container.querySelector(".cf-navbar__navigation .cf-navbar__actions")).toHaveTextContent("Search");
    expect(container.querySelector("[data-cf-navbar]")).toHaveAttribute("data-collapse-at", "tablet");
    expect(container.querySelector("[data-cf-navbar]")).toHaveAttribute("data-menu-variant", "flush");
    expect(container.querySelector("[data-cf-navbar]")).toHaveAttribute("data-surface", "translucent");
    expect(container.querySelector("[data-cf-navbar-trigger]")).toHaveAttribute("aria-expanded", "false");
  });

  it("renders content models", () => {
    render(<PostCard post={{ href: "/hello", title: "Hello", tags: ["design"] }} />);
    expect(screen.getByRole("link", { name: "Hello" })).toHaveAttribute("href", "/hello");
  });

  it("renders application and portable media foundations", () => {
    const { container } = render(
      <AppShell>
        <main>Main content</main>
        <footer>Footer</footer>
        <Avatar name="Egor Ternovoi" image={{ src: "/avatar.webp", alt: "Egor" }} />
        <Avatar name="Reader Name" alt="Reader profile" />
        <InlineEmoji image={{ src: "/wave.webp", alt: ":wave:", width: 20, height: 20 }} />
        <MediaGrid aria-label="Attachments">
          <li>Attachment</li>
        </MediaGrid>
      </AppShell>,
    );

    expect(container.querySelector(".cf-app-shell > main")).toHaveTextContent("Main content");
    expect(container.querySelector(".cf-avatar > img")).toHaveAttribute("src", "/avatar.webp");
    expect(screen.getByRole("img", { name: "Reader profile" })).toHaveTextContent("RN");
    expect(container.querySelector(".cf-inline-emoji")).toHaveAttribute("width", "20");
    expect(screen.getByRole("list", { name: "Attachments" })).toHaveClass("cf-media-grid");
  });

  it("aligns Card variants, padding, and linked surfaces with the CSS contract", () => {
    render(
      <Card href="/card" variant="raised" padding="lg" target="_blank">
        Linked card
      </Card>,
    );
    const card = screen.getByRole("link", { name: "Linked card" });
    expect(card).toHaveClass("cf-card");
    expect(card).toHaveAttribute("data-variant", "elevated");
    expect(card).toHaveAttribute("data-padding", "lg");
    expect(card).toHaveAttribute("target", "_blank");
  });

  it("renders canonical post fields through component-specific BEM contracts", () => {
    const post = {
      href: "/canonical",
      title: "Canonical design",
      description: "Shared package model",
      published: "19 July 2026",
      publishedAt: "2026-07-19",
      updated: "20 July 2026",
      updatedAt: "2026-07-20",
      readingTime: "4 min",
      tags: ["design systems"],
      cover: { src: "/cover.webp", alt: "Cover", srcset: "/cover.webp 1x" },
    };
    const { container } = render(
      <>
        <PostCard post={post} />
        <LatestPostCard post={post} target="_blank" />
        <SearchResultCard result={post} query="design" />
      </>,
    );

    expect(container.querySelector(".cf-post-card__media .cf-post-card__cover")).toHaveAttribute(
      "srcset",
      "/cover.webp 1x",
    );
    expect(container.querySelector(".cf-latest-post-card__title")).toHaveTextContent("Canonical design");
    expect(container.querySelector(".cf-latest-post-card__description")).toHaveTextContent(
      "Shared package model",
    );
    const latestPostCard = container.querySelector("a.cf-latest-post-card");
    expect(latestPostCard).toHaveAttribute("href", "/canonical");
    expect(latestPostCard).toHaveAttribute("aria-label", "Canonical design");
    expect(latestPostCard).toHaveAttribute("target", "_blank");
    expect(latestPostCard?.querySelectorAll("a")).toHaveLength(0);
    expect(container.querySelector(".cf-search-result-card__title mark")).toHaveTextContent("design");
    expect(container.querySelector(".cf-search-result-card__tags mark")).toHaveTextContent("design");
    expect(container.querySelector(".cf-search-result-card .cf-post-card__content")).toBeNull();
    expect(container.querySelectorAll('time[datetime="2026-07-19"]')).toHaveLength(3);
    expect(container.querySelectorAll('time[datetime="2026-07-20"]')).toHaveLength(3);
  });

  it("groups consecutive chat senders without adding accessible noise", () => {
    const { container } = render(
      <ChatThread
        messages={[
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
        ]}
      />,
    );

    const rows = container.querySelectorAll(".cf-chat__row");
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveAttribute("data-group-start", "true");
    expect(rows[0]).not.toHaveAttribute("data-group-end");
    expect(rows[1]).not.toHaveAttribute("data-group-start");
    expect(rows[1]).toHaveAttribute("data-group-end", "true");
    expect(rows[2]).toHaveAttribute("data-group-start", "true");
    expect(rows[2]).not.toHaveAttribute("data-group-end");
    expect(rows[3]).not.toHaveAttribute("data-group-start");
    expect(rows[3]).toHaveAttribute("data-group-end", "true");
    expect(container.querySelectorAll(".cf-chat__author")).toHaveLength(2);
    expect(container.querySelectorAll(".cf-chat__timestamp")).toHaveLength(4);
    expect(container.querySelectorAll(".cf-chat__bubble .cf-visually-hidden")).toHaveLength(2);
    expect(container.querySelector("span.cf-chat__avatar")).toHaveTextContent("C");
    expect(container.querySelector("img.cf-chat__avatar")).toHaveAttribute("src", "/avatar.webp");
    expect(container.querySelector("img.cf-chat__avatar")).toHaveAttribute("alt", "");
    expect(screen.getByRole("link", { name: "Open source" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Open source" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelector(".cf-chat__bubble")).toHaveTextContent("Text avatar");
    expect(container.querySelectorAll(".cf-chat__bubble")[3]).toHaveTextContent("Source code");
  });
});
