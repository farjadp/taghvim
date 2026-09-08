// ============================================================================
// Source: src/components/structured-data.tsx
// Version: 0.9.7 — 2026-09-08
// Why: Renders one JSON-LD block. Kept as a component so every page emits the
//      same shape and the JSON is serialised in one place.
// Env / Deps: Server component. Objects come from lib/seo.
// ============================================================================

// The payload is built by lib/seo from literals, never from user input, so
// there is nothing here for a crafted string to escape into.
export function StructuredData({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
