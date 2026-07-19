<script lang="ts">
  import {
    Accordion,
    Alert,
    AppShell,
    Avatar,
    Badge,
    BlueLine,
    Button,
    Card,
    Captcha,
    ChatThread,
    Checkbox,
    CodeBlock,
    Container,
    Dialog,
    DropdownMenu,
    EmptyState,
    Field,
    Footer,
    Heading,
    IconButton,
    Inline,
    InlineEmoji,
    LatestPostCard,
    Link,
    MediaGrid,
    Navbar,
    Pagination,
    Popover,
    PostCard,
    Prose,
    ResponsiveImage,
    SearchResultCard,
    Section,
    Select,
    SkipLink,
    Stack,
    Sticker,
    Switch,
    Table,
    TerminalCodeBlock,
    Tabs,
    Tag,
    Text,
    Textarea,
    TextField,
    ThemeProvider,
    ThemeScript,
    ThemeToggle,
    ToastProvider,
    ToastViewport,
    Tooltip,
    toast,
  } from "@cofob/design-system-svelte";
  import { Plus } from "@lucide/svelte";

  interface Props {
    name: string;
  }

  const generatedId = $props.id();
  let { name }: Props = $props();

  const fieldId = `svelte-field-${generatedId}`;
  const skipTargetId = `svelte-skip-target-${generatedId}`;
  const image = {
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%230ea5e9'/%3E%3Ccircle cx='490' cy='90' r='150' fill='%237dd3fc'/%3E%3Cpath d='M0 300 220 110l170 150 90-85 160 145v40H0z' fill='%23e0f2fe'/%3E%3C/svg%3E",
    alt: "Abstract blue geometric landscape",
    width: 640,
    height: 360,
  };
  const darkImage = {
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23090f1e'/%3E%3Ccircle cx='490' cy='90' r='150' fill='%230c4a6e'/%3E%3Cpath d='M0 300 220 110l170 150 90-85 160 145v40H0z' fill='%231e3a5f'/%3E%3Cpath d='M0 330 180 205l120 88 90-64 160 111v20H0z' fill='%230ea5e9' opacity='.55'/%3E%3C/svg%3E",
    alt: "Abstract blue geometric landscape at night",
    width: 640,
    height: 360,
  };
  const post = {
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
  const terminalEntries = [
    { command: "npm install @cofob/design-system-css", output: "added 1 package in 842ms" },
    { command: "npm run build -- --mode production", output: "✓ 51 pages built" },
  ];
  const menuItems = [
    { id: "edit", label: "Edit" },
    { id: "duplicate", label: "Duplicate" },
    { id: "archive", label: "Archive", destructive: true },
    { id: "unavailable", label: "Unavailable", disabled: true },
  ];
  const tabs = [
    { id: "overview", label: "Overview", content: "A shared semantic class contract." },
    { id: "react", label: "React", content: "Typed React adapters." },
    { id: "svelte", label: "Svelte", content: "Svelte 5 adapter." },
  ];
  const accordionItems = [
    { id: "shared", heading: "What is shared?", content: "Tokens, classes, states, and behavior." },
    { id: "frameworks", heading: "Which frameworks?", content: "Native, React, and Svelte." },
  ];

  let textValue = $state("hello@cofob.dev");
  let textareaValue = $state("Content comes first.");
  let selectValue = $state("system");
  let checked = $state(true);
  let switched = $state(true);
  let page = $state(2);
  let dialogOpen = $state(false);
  let popoverOpen = $state(false);
  let menuOpen = $state(false);
  let tabValue = $state("overview");
  let accordionValue = $state(["shared"]);

  function createToast() {
    toast({
      title: "Saved",
      description: "Your preferences are up to date.",
      tone: "success",
      duration: 4000,
    });
  }
</script>

{#if name === "ThemeProvider"}
  <ThemeProvider>
    <div class="astro-theme-context">
      <div class="astro-theme-context__heading">
        <span class="astro-theme-context__mark" aria-hidden="true"></span>
        <div>
          <span class="astro-theme-context__eyebrow">Theme context</span>
          <strong>One preference, resolved before paint.</strong>
        </div>
      </div>
      <div class="astro-theme-context__footer">
        <span class="astro-theme-context__status" aria-hidden="true">
          <span class="astro-theme-context__preference"></span>
          <span class="astro-theme-context__arrow">→</span>
          <span class="astro-theme-context__resolved"></span>
        </span>
        <ThemeToggle />
      </div>
    </div>
  </ThemeProvider>
{:else if name === "ThemeScript"}
  <ThemeScript />
  <code>&lt;ThemeScript /&gt;</code>
{:else if name === "ThemeToggle"}
  <ThemeProvider>
    <ThemeToggle />
  </ThemeProvider>
{:else if name === "SkipLink"}
  <div class="astro-skip-demo" tabindex="0">
    <Text size="sm" tone="muted">Focus this frame, then press Tab.</Text>
    <div class="astro-skip-demo__stage">
      <SkipLink href={`#${skipTargetId}`}>Skip to preview content</SkipLink>
      <p id={skipTargetId} tabindex="-1">Preview content target</p>
    </div>
  </div>
{:else if name === "AppShell"}
  <AppShell style="min-block-size: 18rem">
    <header><Text size="sm" tone="muted">Header</Text></header>
    <div style="flex: 1 0 auto"><Heading level={3}>Main content grows</Heading></div>
    <footer><Text size="sm" tone="muted">Sticky footer</Text></footer>
  </AppShell>
{:else if name === "Heading"}
  <Heading as="h3" size="2xl">Content comes first.</Heading>
{:else if name === "Text"}
  <Stack class="astro-preview-copy" gap="sm">
    <Text size="lg">Readable body text for long-form content.</Text>
    <Text tone="muted" size="sm">Supporting metadata stays quiet.</Text>
  </Stack>
{:else if name === "Link"}
  <Link href="#installation">Read the installation guide</Link>
{:else if name === "Prose"}
  <Prose class="astro-preview-copy">
    <h3>Long-form rhythm</h3>
    <p>Headings, paragraphs, links, and inline <code>code</code> share a comfortable reading measure.</p>
  </Prose>
{:else if name === "CodeBlock"}
  <CodeBlock code={codeBlockExample} language="typescript" copyable />
{:else if name === "TerminalCodeBlock"}
  <TerminalCodeBlock entries={terminalEntries} />
{:else if name === "Table"}
  <Table label="Package comparison" density="compact" striped minWidth="28rem">
    <thead>
      <tr><th scope="col">Package</th><th scope="col">Adapter</th><th scope="col">Status</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">CSS</th><td>Native</td><td>Ready</td></tr>
      <tr><th scope="row">React</th><td>React 19</td><td>Ready</td></tr>
      <tr><th scope="row">Svelte</th><td>Svelte 5</td><td>Ready</td></tr>
    </tbody>
  </Table>
{:else if name === "Container"}
  <Container class="astro-preview-container" size="narrow">
    <Card variant="outlined" padding="sm">A centered, narrow content container.</Card>
  </Container>
{:else if name === "Section"}
  <Section class="astro-preview-section" data-spacing="sm">
    <header class="cf-section__header">
      <p class="cf-section__eyebrow">Foundation</p>
      <Heading as="h3" size="xl">A clear section</Heading>
      <Text tone="muted">Semantic page rhythm.</Text>
    </header>
    <Text>Section content follows its optional header.</Text>
  </Section>
{:else if name === "Stack"}
  <Stack class="astro-preview-flow" gap="sm">
    <Badge>First</Badge><Badge tone="accent">Second</Badge><Badge tone="success">Third</Badge>
  </Stack>
{:else if name === "Inline"}
  <Inline class="astro-preview-flow" gap="sm" wrap>
    <Badge>One</Badge><Badge tone="accent">Two</Badge><Badge tone="success">Three</Badge>
  </Inline>
{:else if name === "Button"}
  <Inline gap="sm" wrap>
    <Button>Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
    <Button size="sm">Small</Button>
    <Button size="lg">Large</Button>
    <Button loading>Loading</Button>
    <Button disabled>Disabled</Button>
  </Inline>
{:else if name === "IconButton"}
  <Inline gap="sm">
    <IconButton label="Add item"><Plus /></IconButton>
    <IconButton label="Loading item" loading><Plus /></IconButton>
  </Inline>
{:else if name === "Field"}
  <div class="astro-preview-form-grid">
    <Field
      label="Project name"
      forId={`${fieldId}-project`}
      description="Use a short, recognizable name."
      required
    >
      <input id={`${fieldId}-project`} class="cf-input" value="cofob.dev" required />
    </Field>
    <Field label="Slug" forId={`${fieldId}-slug`} error="A slug is required.">
      <input id={`${fieldId}-slug`} class="cf-input" aria-invalid="true" value="" />
    </Field>
  </div>
{:else if name === "TextField"}
  <Stack gap="sm">
    <TextField
      bind:value={textValue}
      label="Email"
      type="email"
      description="We only use this for replies."
    />
    <TextField label="Email with error" type="email" value="not-an-email" error="Enter a valid address." />
    <TextField label="Disabled" type="email" value="locked@cofob.dev" disabled />
  </Stack>
{:else if name === "Textarea"}
  <div class="astro-preview-form-grid">
    <Textarea
      bind:value={textareaValue}
      label="Note"
      description={`${textareaValue.length} characters`}
      rows={3}
    />
    <Textarea label="Required summary" error="A summary is required." rows={2} />
    <Textarea label="Disabled" value="Unavailable" disabled rows={2} />
  </div>
{:else if name === "Select"}
  <div class="astro-preview-form-grid">
    <Select
      bind:value={selectValue}
      label="Theme preference"
      description="Choose how the interface resolves color."
      options={[
        { value: "system", label: "System" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
    />
    <Select
      label="Invalid selection"
      error="Choose an available option."
      placeholder="Choose one"
      options={[{ value: "ready", label: "Ready" }]}
    />
    <Select label="Disabled" value="system" options={[{ value: "system", label: "System" }]} disabled />
  </div>
{:else if name === "Checkbox"}
  <Stack gap="sm">
    <Checkbox bind:checked label="Include drafts" description="Show unpublished notes." />
    <Checkbox label="Unavailable option" disabled />
  </Stack>
{:else if name === "Switch"}
  <Stack gap="sm">
    <Switch
      bind:checked={switched}
      label="Enable notifications"
      description="Receive updates when a build finishes."
    />
    <Switch checked label="Managed by your organization" disabled />
  </Stack>
{:else if name === "Captcha"}
  <div class="astro-captcha-grid">
    <Captcha state="idle" />
    <Captcha state="verifying" />
    <Captcha state="success" />
    <Captcha state="error" />
    <Captcha state="idle" disabled />
  </div>
{:else if name === "Badge"}
  <Inline gap="sm" wrap>
    <Badge>Neutral</Badge>
    <Badge tone="accent">Accent</Badge>
    <Badge tone="info">Info</Badge>
    <Badge tone="success">Success</Badge>
    <Badge tone="warning">Warning</Badge>
    <Badge tone="danger">Danger</Badge>
  </Inline>
{:else if name === "Tag"}
  <Inline class="astro-preview-flow" gap="sm" wrap>
    <Tag>taxonomy</Tag>
    <Tag tone="accent" removable removeLabel="Remove design systems tag">design systems</Tag>
  </Inline>
{:else if name === "Alert"}
  <Stack gap="sm">
    <Alert title="Note" tone="info">Shared contract.</Alert>
    <Alert title="Saved" tone="success" dismissible dismissLabel="Dismiss saved alert"
      >The update is live.</Alert
    >
    <Alert title="Review" tone="warning">Check this value.</Alert>
    <Alert title="Failed" tone="danger">Try again.</Alert>
  </Stack>
{:else if name === "Card"}
  <div class="astro-preview-card-grid">
    <Card variant="default" padding="sm"
      ><strong>Default</strong>
      <p>Quiet structure.</p></Card
    >
    <Card variant="elevated" padding="sm"
      ><strong>Elevated</strong>
      <p>Raised context.</p></Card
    >
    <Card variant="outlined" padding="sm"
      ><strong>Outlined</strong>
      <p>Defined boundary.</p></Card
    >
    <Card variant="interactive" padding="sm" href="#interactive-card">
      <strong>Interactive</strong>
      <p>Linked surface.</p>
    </Card>
  </div>
{:else if name === "EmptyState"}
  <EmptyState title="No posts yet" description="Publish the first note when it is ready.">
    {#snippet action()}<Button size="sm">Create a post</Button>{/snippet}
  </EmptyState>
{:else if name === "Pagination"}
  <Pagination bind:page totalPages={3} />
{:else if name === "Dialog"}
  <Dialog bind:open={dialogOpen} title="Confirm change" description="Review the details before continuing.">
    {#snippet trigger({ open, expanded, controls })}
      <Button variant="secondary" aria-controls={controls} aria-expanded={expanded} onclick={open}
        >Open dialog</Button
      >
    {/snippet}
    {#snippet children()}<p class="cf-text">This uses the platform dialog element.</p>{/snippet}
    {#snippet footer()}
      <Inline gap="sm">
        <Button variant="secondary" onclick={() => (dialogOpen = false)}>Cancel</Button>
        <Button onclick={() => (dialogOpen = false)}>Confirm</Button>
      </Inline>
    {/snippet}
  </Dialog>
{:else if name === "Popover"}
  <Popover bind:open={popoverOpen} label="Open popover" placement="bottom">
    <Stack gap="sm">
      <strong>Semantic details</strong>
      <Text as="span" size="sm">Helpful contextual content.</Text>
    </Stack>
  </Popover>
{:else if name === "DropdownMenu"}
  <DropdownMenu bind:open={menuOpen} label="Actions" items={menuItems} />
{:else if name === "Tabs"}
  <Tabs bind:value={tabValue} {tabs} label="Framework implementations" activationMode="automatic" />
{:else if name === "Accordion"}
  <Accordion bind:value={accordionValue} items={accordionItems} />
{:else if name === "Tooltip"}
  <Tooltip content="More information" delay={1000}>
    <IconButton label="More information">?</IconButton>
  </Tooltip>
{:else if name === "ToastProvider"}
  <ToastProvider position="bottom-right">
    <Button onclick={createToast}>Show toast</Button>
  </ToastProvider>
{:else if name === "ToastViewport"}
  <ToastProvider viewport={false}>
    <Button onclick={createToast}>Show toast</Button>
    <ToastViewport position="bottom-right" label="Showroom notifications" />
  </ToastProvider>
{:else if name === "BlueLine"}
  <Heading as="h3" size="xl" class="astro-blue-line-preview"
    >Hello, <BlueLine animate>cofob.dev.</BlueLine></Heading
  >
{:else if name === "Navbar"}
  <Navbar
    brand="cofob"
    brandLabel="cofob home"
    links={[
      { href: "#blog", label: "Blog", current: true },
      { href: "#pgp", label: "PGP" },
    ]}
  >
    {#snippet brandContent()}<BlueLine>cofob</BlueLine>{/snippet}
  </Navbar>
{:else if name === "Footer"}
  <Footer
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
    links={[{ href: "#license", label: "License" }]}
    copyright="© cofob 2021–2026"
  />
{:else if name === "PostCard"}
  <PostCard {post} />
{:else if name === "LatestPostCard"}
  <LatestPostCard {post} />
{:else if name === "SearchResultCard"}
  <SearchResultCard result={post} query="design" />
{:else if name === "ResponsiveImage"}
  <ResponsiveImage
    {image}
    {darkImage}
    aspectRatio="16 / 9"
    caption="A responsive image with intrinsic dimensions."
    priority
  />
{:else if name === "Avatar"}
  <Inline gap="sm">
    <Avatar {image} name="Ada Lovelace" alt="Ada Lovelace" size="lg" />
    <Avatar name="Grace Hopper" />
  </Inline>
{:else if name === "InlineEmoji"}
  <Text>Semantic inline image <InlineEmoji {image} alt="Blue landscape" /> stays aligned with text.</Text>
{:else if name === "MediaGrid"}
  <MediaGrid>
    <li><img src={image.src} alt={image.alt} width={image.width} height={image.height} /></li>
    <li><img src={darkImage.src} alt={darkImage.alt} width={darkImage.width} height={darkImage.height} /></li>
  </MediaGrid>
{:else if name === "ChatThread"}
  <ChatThread
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
{:else if name === "Sticker"}
  <div class="astro-sticker-preview">
    <Sticker tone="accent" rotation={-3} aria-label="Blue fox sticker from cofob.dev">🦊 cofob.dev</Sticker>
    <figure class="astro-sticker-figure">
      <Sticker tone="neutral" rotation={3} data-image="true">
        <img
          src="/stickers/fox_pack/ya_ahuenen.webp"
          alt="A fox looking pleased with itself beneath the Russian caption ‘Как же я хорош’"
          width="192"
          height="192"
          loading="lazy"
          decoding="async"
        />
      </Sticker>
      <figcaption>
        Source: <a href="https://t.me/addstickers/PhSilver" target="_blank" rel="noopener noreferrer"
          >PhSilver sticker pack</a
        >
      </figcaption>
    </figure>
  </div>
{:else}
  <Alert title="Unknown component" tone="warning">No Svelte preview is registered for {name}.</Alert>
{/if}
