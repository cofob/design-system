<script lang="ts">
  import { Badge, Card, Heading, Inline, Stack } from "@cofob/design-system-svelte";
  import { ArrowRight } from "@lucide/svelte";
</script>

<Card variant="elevated">
  <div class="cf-card__body">
    <Stack gap="sm">
      <Inline justify="between">
        <Badge tone="accent">Svelte 5</Badge>
        <span class="cf-text" data-tone="muted">Live island</span>
      </Inline>
      <Heading as="h3" size="xl">The Svelte adapter</Heading>
      <p>Runes, snippets, and bindable state, rendered through the same class contract.</p>
      <a class="cf-button" href="/components/" data-variant="primary">
        <span class="cf-button__label">Explore Svelte</span>
        <ArrowRight class="cf-icon" aria-hidden="true" />
      </a>
    </Stack>
  </div>
</Card>
