import { Badge, Card, Heading, Inline, Stack } from "@cofob/design-system-react";
import { ArrowRight } from "lucide-react";

export function ReactFrameworkDemo() {
  return (
    <Card variant="elevated">
      <div className="cf-card__body">
        <Stack gap="sm">
          <Inline justify="between">
            <Badge tone="accent">React 19</Badge>
            <span className="cf-text" data-tone="muted">
              Live island
            </span>
          </Inline>
          <Heading level={3} size="xl">
            The React adapter
          </Heading>
          <p>Typed native props and controlled state, rendered through the shared class contract.</p>
          <a className="cf-button" href="/components/" data-variant="primary">
            <span className="cf-button__label">Explore React</span>
            <ArrowRight className="cf-icon" aria-hidden="true" />
          </a>
        </Stack>
      </div>
    </Card>
  );
}
