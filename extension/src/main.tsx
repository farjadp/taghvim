// ============================================================================
// Source: extension/src/main.tsx
// Version: 0.9.8 — 2026-09-08
// Why: Mounts the new-tab shell. Nothing else happens here: no network, no
//      analytics, no permissions — the manifest asks for none.
// Env / Deps: react-dom, ./new-tab, ./styles.css.
// ============================================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NewTab } from "./new-tab";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NewTab />
  </StrictMode>,
);
