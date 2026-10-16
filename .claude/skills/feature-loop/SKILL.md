---
name: feature-loop
description: Run Taghvim's agent team on one feature, from request to a branch ready for Farjad to push - spec-writer, architect, builder, reviewer, privacy-guard, release-prep - with his approval at each gate. Use when Farjad says "run the loop", "build feature X", or brings a request from X, email or an issue.
---

# Feature Loop — Taghvim

You, the main session, are the orchestrator. You hand work to the agents, pass results forward,
and stop at every gate for Farjad. You do not do the specialists' work yourself.

```
Request ─► spec-writer ─► GATE A ─► architect ─► GATE B ─► builder × tasks ─► reviewer ⟲ (max 3)
        ─► privacy-guard ─► release-prep ─► GATE C (Farjad pushes, tags, publishes)
        ─► 1–2 weeks later: success signal vs target → keep / iterate / remove
```

## Steps

**0. Intake.** Restate the request in one line with its source. Create a branch from `main` named the
CONTRIBUTING way (`feat/…`, `fix/…`, `docs/…`, `test/…`). Make a task list for the stages.

**1. Definition.** Call `spec-writer`.
→ **GATE A:** show Farjad the card, the do-now/later/cut call, any earlier AGENTS.md decision it touches,
and the success signal. Continue only on a clear yes.

**2. Design.** Call `architect`.
→ **GATE B:** show the surface map, the invariants it is near, and the task list.
For a UI change, show the three variants and ask Farjad to pick one — that is how every visible design
in this product was chosen. A proposed AGENTS.md entry needs his approval before it is written.

**3. Build.** Call `builder` with one task at a time, in dependency order. Independent tasks may run in
parallel only if they touch different files. A `BLOCKED` report goes to Farjad — never guess.

**4. Review.** Call `reviewer` with the card and the branch. Do not pass it the builder's report.
`CHANGES REQUESTED` → send blockers and majors back to `builder` as tasks. After three rounds, stop and
tell Farjad what is stuck.

**5. Privacy.** Call `privacy-guard` when the change touches requests, storage, the extension or app,
privacy wording, server code or release scripts — and always before release. CRITICAL/HIGH → back to step 3.

**6. Release prep.** Call `release-prep`. It writes the visitor-facing changelog entry (or none, for
internal work), bumps the version, and writes the checklist.
→ **GATE C:** give Farjad the branch, the commits and his actions. **Agents never push**: a push to `main`
is a deploy, and a `v*` tag starts a public release.

**7. After release.** When Farjad reports back, call `spec-writer` to compare the signal with the
target and record keep / iterate / remove in the card. If the outcome is a durable decision, propose
an AGENTS.md entry.

## Orchestrator rules
- One feature per loop unless Farjad says otherwise.
- At each gate, ten lines or fewer, plus the file paths.
- Never mark a stage done because an agent said so — check the file or run the command.
- If one task needs more than three builder attempts, send it back to `architect` to split.
- Keep the process on port 3000 running. Dev and e2e use 3100.
