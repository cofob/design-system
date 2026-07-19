import "@cofob/design-system-css/index.css";
import { Button, Container, Heading, Section, ThemeProvider } from "@cofob/design-system-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <ThemeProvider>
      <Container>
        <Section>
          <Heading level={1}>React fixture</Heading>
          <Button>Shared styles, typed adapter</Button>
        </Section>
      </Container>
    </ThemeProvider>
  );
}

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
