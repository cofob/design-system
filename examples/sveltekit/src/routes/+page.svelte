<script lang="ts">
  import { Button, Container, Heading, Section, ThemeProvider } from "@cofob/design-system-svelte";
</script>

<ThemeProvider>
  <Container>
    <Section>
      <Heading as="h1" size="2xl">SvelteKit SSR fixture</Heading>
      <Button>Shared styles, Svelte 5 adapter</Button>
    </Section>
  </Container>
</ThemeProvider>
