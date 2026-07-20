import * as DS from "@cofob/design-system-react";
import { Plus } from "lucide-react";

interface Props {
  name: string;
  animatedSticker?: DS.AnimatedStickerModel;
}

const post: DS.PostSummary = {
  href: "#post",
  title: "Building a calmer interface",
  excerpt: "A practical note about content-first design.",
  published: "19 July 2026",
  publishedAt: "2026-07-19",
  updated: "20 July 2026",
  updatedAt: "2026-07-20",
  readingTime: "4 min read",
  tags: ["design", "css"],
};

const codeBlockExample = `const preference = "system";
applyTheme(preference);`;

const terminalEntries: readonly DS.TerminalCodeEntry[] = [
  { command: "npm install @cofob/design-system-css", output: "added 1 package in 842ms" },
  { command: "npm run build -- --mode production", output: "✓ 51 pages built" },
];

const lightImage: DS.ResponsiveImageModel = {
  src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%230ea5e9'/%3E%3Ccircle cx='490' cy='90' r='150' fill='%237dd3fc'/%3E%3Cpath d='M0 300 220 110l170 150 90-85 160 145v40H0z' fill='%23e0f2fe'/%3E%3C/svg%3E",
  alt: "Abstract blue geometric landscape",
  width: 640,
  height: 360,
};

const darkImage: DS.ResponsiveImageModel = {
  src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23090f1e'/%3E%3Ccircle cx='490' cy='90' r='150' fill='%230c4a6e'/%3E%3Cpath d='M0 300 220 110l170 150 90-85 160 145v40H0z' fill='%231e3a5f'/%3E%3Cpath d='M0 330 180 205l120 88 90-64 160 111v20H0z' fill='%230ea5e9' opacity='.55'/%3E%3C/svg%3E",
  alt: "Abstract blue geometric landscape at night",
  width: 640,
  height: 360,
};

const menuItems: DS.MenuItem[] = [
  { id: "edit", label: "Edit" },
  { id: "duplicate", label: "Duplicate" },
  { id: "archive", label: "Archive", destructive: true },
  { id: "unavailable", label: "Unavailable", disabled: true },
];

function ToastExample() {
  const api = DS.useToast();
  return (
    <>
      <DS.Button
        onClick={() =>
          api.toast({
            title: "Saved",
            description: "Your preferences are up to date.",
            tone: "success",
            duration: 4000,
          })
        }
      >
        Show toast
      </DS.Button>
      <DS.ToastViewport />
    </>
  );
}

function ThemeExample({ toggle = false }: { toggle?: boolean }) {
  return (
    <DS.ThemeProvider>
      {toggle ? (
        <DS.ThemeToggle />
      ) : (
        <div className="astro-theme-context">
          <div className="astro-theme-context__heading">
            <span className="astro-theme-context__mark" aria-hidden="true" />
            <div>
              <span className="astro-theme-context__eyebrow">Theme context</span>
              <strong>One preference, resolved before paint.</strong>
            </div>
          </div>
          <div className="astro-theme-context__footer">
            <span className="astro-theme-context__status" aria-hidden="true">
              <span className="astro-theme-context__preference" />
              <span className="astro-theme-context__arrow">→</span>
              <span className="astro-theme-context__resolved" />
            </span>
            <DS.ThemeToggle />
          </div>
        </div>
      )}
    </DS.ThemeProvider>
  );
}

export function ReactComponentPreview({ name, animatedSticker }: Props) {
  switch (name) {
    case "ThemeProvider":
      return <ThemeExample />;
    case "ThemeScript":
      return (
        <>
          <DS.ThemeScript />
          <code>{"<ThemeScript />"}</code>
        </>
      );
    case "ThemeToggle":
      return <ThemeExample toggle />;
    case "SkipLink":
      return (
        <div className="astro-skip-demo" tabIndex={0}>
          <DS.Text size="sm" tone="muted">
            Focus this frame, then press Tab.
          </DS.Text>
          <div className="astro-skip-demo__stage">
            <DS.SkipLink targetId="react-preview-target">Skip to preview content</DS.SkipLink>
            <p id="react-preview-target" tabIndex={-1}>
              Preview content target
            </p>
          </div>
        </div>
      );
    case "AppShell":
      return (
        <DS.AppShell style={{ minBlockSize: "18rem" }}>
          <header>
            <DS.Text size="sm" tone="muted">
              Header
            </DS.Text>
          </header>
          <div style={{ flex: "1 0 auto" }}>
            <DS.Heading level={3}>Main content grows</DS.Heading>
          </div>
          <footer>
            <DS.Text size="sm" tone="muted">
              Sticky footer
            </DS.Text>
          </footer>
        </DS.AppShell>
      );
    case "Heading":
      return (
        <DS.Heading level={3} size="2xl">
          Content comes first.
        </DS.Heading>
      );
    case "Text":
      return (
        <DS.Stack className="astro-preview-copy" gap="sm">
          <DS.Text size="lg">Readable body text for long-form content.</DS.Text>
          <DS.Text tone="muted" size="sm">
            Supporting metadata stays quiet.
          </DS.Text>
        </DS.Stack>
      );
    case "Link":
      return <DS.Link href="#installation">Read the installation guide</DS.Link>;
    case "Prose":
      return (
        <DS.Prose className="astro-preview-copy">
          <h3>Long-form rhythm</h3>
          <p>
            Headings, paragraphs, links, and inline <code>code</code> share a comfortable reading measure.
          </p>
        </DS.Prose>
      );
    case "CodeBlock":
      return <DS.CodeBlock code={codeBlockExample} language="typescript" copyable />;
    case "TerminalCodeBlock":
      return <DS.TerminalCodeBlock entries={terminalEntries} />;
    case "Table":
      return (
        <DS.Table label="Package comparison" density="compact" striped minWidth="28rem">
          <thead>
            <tr>
              <th scope="col">Package</th>
              <th scope="col">Adapter</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">CSS</th>
              <td>Native</td>
              <td>Ready</td>
            </tr>
            <tr>
              <th scope="row">React</th>
              <td>React 19</td>
              <td>Ready</td>
            </tr>
            <tr>
              <th scope="row">Svelte</th>
              <td>Svelte 5</td>
              <td>Ready</td>
            </tr>
          </tbody>
        </DS.Table>
      );
    case "Container":
      return (
        <DS.Container className="astro-preview-container" size="sm">
          <DS.Card variant="outlined" padding="sm">
            A centered, narrow content container.
          </DS.Card>
        </DS.Container>
      );
    case "Section":
      return (
        <DS.Section className="astro-preview-section" spacing="sm">
          <header className="cf-section__header">
            <p className="cf-section__eyebrow">Foundation</p>
            <DS.Heading level={3} size="xl">
              A clear section
            </DS.Heading>
            <DS.Text tone="muted">Semantic page rhythm.</DS.Text>
          </header>
          <DS.Text>Section content follows its optional header.</DS.Text>
        </DS.Section>
      );
    case "Stack":
      return (
        <DS.Stack className="astro-preview-flow" gap="sm">
          <DS.Badge>First</DS.Badge>
          <DS.Badge tone="accent">Second</DS.Badge>
          <DS.Badge tone="success">Third</DS.Badge>
        </DS.Stack>
      );
    case "Inline":
      return (
        <DS.Inline className="astro-preview-flow" gap="sm" wrap>
          <DS.Badge>One</DS.Badge>
          <DS.Badge tone="accent">Two</DS.Badge>
          <DS.Badge tone="success">Three</DS.Badge>
        </DS.Inline>
      );
    case "Button":
      return (
        <DS.Inline gap="sm" wrap>
          <DS.Button>Primary</DS.Button>
          <DS.Button variant="secondary">Secondary</DS.Button>
          <DS.Button variant="ghost">Ghost</DS.Button>
          <DS.Button variant="danger">Danger</DS.Button>
          <DS.Button size="sm">Small</DS.Button>
          <DS.Button size="lg">Large</DS.Button>
          <DS.Button loading>Loading</DS.Button>
          <DS.Button disabled>Disabled</DS.Button>
        </DS.Inline>
      );
    case "IconButton":
      return (
        <DS.Inline gap="sm" wrap>
          <DS.IconButton label="Add item" icon={Plus} />
          <DS.IconButton label="Loading item" icon={Plus} loading />
        </DS.Inline>
      );
    case "Field":
      return (
        <div className="astro-preview-form-grid">
          <DS.Field
            label="Project name"
            htmlFor="react-project-name"
            hint="Use a short, recognizable name."
            required
          >
            <input className="cf-input" id="react-project-name" defaultValue="cofob.dev" required />
          </DS.Field>
          <DS.Field
            label="Slug"
            htmlFor="react-project-slug"
            error="A slug is required."
            errorId="react-project-slug-error"
          >
            <input
              className="cf-input"
              id="react-project-slug"
              aria-invalid="true"
              aria-describedby="react-project-slug-error"
              defaultValue=""
            />
          </DS.Field>
        </div>
      );
    case "TextField":
      return (
        <DS.Stack gap="sm">
          <DS.TextField
            id="react-email"
            label="Email"
            type="email"
            defaultValue="hello@cofob.dev"
            hint="We only use this for replies."
          />
          <DS.TextField
            id="react-email-error"
            label="Email with error"
            type="email"
            defaultValue="not-an-email"
            error="Enter a valid address."
          />
          <DS.TextField
            id="react-email-disabled"
            label="Disabled"
            type="email"
            disabled
            defaultValue="locked@cofob.dev"
          />
        </DS.Stack>
      );
    case "Textarea":
      return (
        <div className="astro-preview-form-grid">
          <DS.Textarea
            id="react-note"
            label="Note"
            defaultValue="Content comes first."
            hint="20 characters"
            rows={3}
          />
          <DS.Textarea id="react-summary" label="Required summary" error="A summary is required." rows={2} />
          <DS.Textarea
            id="react-disabled-note"
            label="Disabled"
            defaultValue="Unavailable"
            disabled
            rows={2}
          />
        </div>
      );
    case "Select":
      return (
        <div className="astro-preview-form-grid">
          <DS.Select
            id="react-theme"
            label="Theme preference"
            defaultValue="system"
            hint="Choose how the interface resolves color."
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </DS.Select>
          <DS.Select
            id="react-invalid-selection"
            label="Invalid selection"
            defaultValue=""
            error="Choose an available option."
          >
            <option value="" disabled>
              Choose one
            </option>
            <option value="ready">Ready</option>
          </DS.Select>
          <DS.Select id="react-disabled-selection" label="Disabled" defaultValue="system" disabled>
            <option value="system">System</option>
          </DS.Select>
        </div>
      );
    case "Checkbox":
      return (
        <DS.Stack gap="sm">
          <DS.Checkbox label="Include drafts" description="Show unpublished notes." defaultChecked />
          <DS.Checkbox label="Unavailable option" disabled />
        </DS.Stack>
      );
    case "Switch":
      return (
        <DS.Stack gap="sm">
          <DS.Switch
            label="Enable notifications"
            description="Receive updates when a build finishes."
            defaultChecked
          />
          <DS.Switch label="Managed by your organization" defaultChecked disabled />
        </DS.Stack>
      );
    case "Captcha":
      return (
        <div className="astro-captcha-grid">
          <DS.Captcha state="idle" />
          <DS.Captcha state="verifying" />
          <DS.Captcha state="success" />
          <DS.Captcha state="error" />
          <DS.Captcha state="idle" disabled />
        </div>
      );
    case "Badge":
      return (
        <DS.Inline gap="sm">
          <DS.Badge>Neutral</DS.Badge>
          <DS.Badge tone="accent">Accent</DS.Badge>
          <DS.Badge tone="info">Info</DS.Badge>
          <DS.Badge tone="success">Success</DS.Badge>
          <DS.Badge tone="warning">Warning</DS.Badge>
          <DS.Badge tone="danger">Danger</DS.Badge>
        </DS.Inline>
      );
    case "Tag":
      return (
        <DS.Inline className="astro-preview-flow" gap="sm" wrap>
          <DS.Tag>taxonomy</DS.Tag>
          <DS.Tag tone="accent" removable removeLabel="Remove design systems tag">
            design systems
          </DS.Tag>
        </DS.Inline>
      );
    case "Alert":
      return (
        <DS.Stack gap="sm">
          <DS.Alert tone="info" title="Note">
            Shared contract.
          </DS.Alert>
          <DS.Alert
            tone="success"
            title="Saved"
            onDismiss={() => undefined}
            dismissLabel="Dismiss saved alert"
          >
            The update is live.
          </DS.Alert>
          <DS.Alert tone="warning" title="Review">
            Check this value.
          </DS.Alert>
          <DS.Alert tone="danger" title="Failed">
            Try again.
          </DS.Alert>
        </DS.Stack>
      );
    case "Card":
      return (
        <div className="astro-preview-card-grid">
          <DS.Card padding="sm">
            <strong>Default</strong>
            <p>Quiet structure.</p>
          </DS.Card>
          <DS.Card variant="elevated" padding="sm">
            <strong>Elevated</strong>
            <p>Raised context.</p>
          </DS.Card>
          <DS.Card variant="outlined" padding="sm">
            <strong>Outlined</strong>
            <p>Defined boundary.</p>
          </DS.Card>
          <DS.Card variant="interactive" padding="sm" href="#interactive-card">
            <strong>Interactive</strong>
            <p>Linked surface.</p>
          </DS.Card>
        </div>
      );
    case "EmptyState":
      return (
        <DS.EmptyState
          title="No posts yet"
          description="Publish the first note when it is ready."
          action={<DS.Button size="sm">Create a post</DS.Button>}
        />
      );
    case "Pagination":
      return (
        <DS.Pagination
          currentPage={2}
          items={[{ page: 1 }, { page: 2 }, { page: 3 }]}
          onPageChange={() => undefined}
        />
      );
    case "Dialog":
      return (
        <DS.Dialog
          trigger="Open dialog"
          title="Confirm change"
          description="Review the details before continuing."
          footer={
            <form method="dialog" className="cf-inline" data-gap="sm">
              <DS.Button variant="secondary" value="cancel">
                Cancel
              </DS.Button>
              <DS.Button value="confirm">Confirm</DS.Button>
            </form>
          }
        >
          <p className="cf-text">This uses the platform dialog element.</p>
        </DS.Dialog>
      );
    case "Popover":
      return (
        <DS.Popover trigger="Open popover">
          <DS.Stack gap="sm">
            <strong>Semantic details</strong>
            <DS.Text as="span" size="sm">
              Helpful contextual content.
            </DS.Text>
          </DS.Stack>
        </DS.Popover>
      );
    case "DropdownMenu":
      return <DS.DropdownMenu trigger="Actions" items={menuItems} />;
    case "Tabs":
      return (
        <DS.Tabs
          items={[
            { id: "overview", label: "Overview", content: "A shared semantic class contract." },
            { id: "react", label: "React", content: "Typed React adapters." },
            { id: "svelte", label: "Svelte", content: "Svelte 5 adapter." },
          ]}
        />
      );
    case "Accordion":
      return (
        <DS.Accordion
          defaultValue={["shared"]}
          items={[
            {
              id: "shared",
              heading: "What is shared?",
              content: "Tokens, classes, states, and behavior.",
            },
            { id: "frameworks", heading: "Which frameworks?", content: "Native, React, and Svelte." },
          ]}
        />
      );
    case "Tooltip":
      return (
        <DS.Tooltip content="More information" delay={1000}>
          <button className="cf-icon-button" type="button" aria-label="More information">
            ?
          </button>
        </DS.Tooltip>
      );
    case "ToastProvider":
    case "ToastViewport":
      return (
        <DS.ToastProvider>
          <ToastExample />
        </DS.ToastProvider>
      );
    case "BlueLine":
      return (
        <DS.Heading level={3} size="xl" className="astro-blue-line-preview">
          Hello, <DS.BlueLine animate>cofob.dev.</DS.BlueLine>
        </DS.Heading>
      );
    case "Navbar":
      return (
        <DS.Navbar
          brand={<DS.BlueLine>cofob</DS.BlueLine>}
          brandLabel="cofob home"
          links={[
            { href: "#blog", label: "Blog", current: true },
            { href: "#pgp", label: "PGP" },
          ]}
        />
      );
    case "Footer":
      return (
        <DS.Footer
          brand="cofob."
          description="Independent notes and software."
          groups={[
            {
              title: "Explore",
              links: [
                { href: "#rss", label: "RSS" },
                { href: "#license", label: "License" },
              ],
            },
          ]}
          legal={
            <>
              <span>© cofob 2021–2026</span>
              <a href="#license">License</a>
            </>
          }
        />
      );
    case "PostCard":
      return <DS.PostCard post={post} />;
    case "LatestPostCard":
      return <DS.LatestPostCard post={post} />;
    case "SearchResultCard":
      return <DS.SearchResultCard result={post} query="design" />;
    case "ResponsiveImage":
      return (
        <DS.ResponsiveImage
          image={lightImage}
          darkImage={darkImage}
          caption="A responsive image with intrinsic dimensions."
        />
      );
    case "Avatar":
      return (
        <DS.Inline gap="sm">
          <DS.Avatar image={lightImage} name="Ada Lovelace" alt="Ada Lovelace" size="lg" />
          <DS.Avatar name="Grace Hopper" />
        </DS.Inline>
      );
    case "InlineEmoji":
      return (
        <DS.Text>
          Semantic inline image <DS.InlineEmoji image={lightImage} alt="Blue landscape" /> stays aligned with
          text.
        </DS.Text>
      );
    case "MediaGrid":
      return (
        <DS.MediaGrid>
          <li>
            <img
              src={lightImage.src}
              alt={lightImage.alt}
              width={lightImage.width}
              height={lightImage.height}
            />
          </li>
          <li>
            <img src={darkImage.src} alt={darkImage.alt} width={darkImage.width} height={darkImage.height} />
          </li>
        </DS.MediaGrid>
      );
    case "ChatThread":
      return (
        <DS.ChatThread
          messages={[
            { id: "one", author: "cofob", body: "Ship the semantic contract first.", timestamp: "19:19" },
            {
              id: "two",
              author: "reader",
              text: "Then every adapter stays aligned.",
              link: "https://cofob.dev/blog",
              linkLabel: "Read the implementation notes",
              linkExternal: true,
              own: true,
              timestamp: "19:20",
            },
          ]}
        />
      );
    case "Sticker":
      return (
        <div className="astro-sticker-preview">
          <DS.Sticker tone="accent" rotation={-3} aria-label="Blue fox sticker from cofob.dev">
            🦊 cofob.dev
          </DS.Sticker>
          <figure className="astro-sticker-figure">
            <DS.Sticker tone="neutral" rotation={3} data-image="true">
              <img
                src="/stickers/fox_pack/ya_ahuenen.webp"
                alt="A fox looking pleased with itself beneath the Russian caption ‘Как же я хорош’"
                width={192}
                height={192}
                loading="lazy"
                decoding="async"
              />
            </DS.Sticker>
            <figcaption>
              Source:{" "}
              <a href="https://t.me/addstickers/PhSilver" target="_blank" rel="noopener noreferrer">
                PhSilver sticker pack
              </a>
            </figcaption>
          </figure>
        </div>
      );
    case "AnimatedSticker":
      return animatedSticker ? (
        <figure className="astro-sticker-figure">
          <div className="astro-sticker-preview">
            <DS.AnimatedSticker
              sticker={animatedSticker}
              alt="Animated cartoon rat Chris from the ‘Крис анимированный’ Telegram sticker pack."
            />
            <DS.AnimatedSticker
              sticker={animatedSticker}
              alt="Static first frame of animated cartoon rat Chris."
              playback="static"
            />
          </div>
          <figcaption>
            Source:{" "}
            <a href="https://t.me/addstickers/animated_chris" target="_blank" rel="noopener noreferrer">
              Крис анимированный
            </a>
          </figcaption>
        </figure>
      ) : null;
    case "AnimatedStickerToggle":
      return (
        <DS.AnimatedStickerToggle
          label="Animated stickers"
          description="Turn off WebM playback and keep static SVG/WebP stickers."
        />
      );
    default:
      return <p>React preview unavailable.</p>;
  }
}
