// ============================================================================
// Source: src/components/structured-data.tsx
// Version: 0.9.48 — 2026-11-13
// Why: Renders one JSON-LD block. Kept as a component so every page emits the
//      same shape and the JSON is serialised in one place.
// Env / Deps: Server component. Objects come from lib/seo.
// ============================================================================

import { jsonLd } from "@/lib/seo";

// The payload is built by lib/seo from literals today; jsonLd escapes `<` anyway
// so a future string carrying `</script>` cannot break out of the tag.
export function StructuredData({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}
