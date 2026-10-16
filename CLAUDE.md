# Taghvim — Claude Code entry point

`AGENTS.md` is the project's single source of truth: product decisions, invariants, commands
and code style. It is imported here in full so every Claude session and every subagent reads it.
Nothing in this file or in `.claude/` may contradict it; if they disagree, `AGENTS.md` wins.

@AGENTS.md

## The agent team

Farjad is the owner. He decides what to build, what to cut, and when it is good enough.
The agents execute. The process that connects them is the `feature-loop` skill.

| Agent | Role | Edits code? |
|---|---|---|
| `spec-writer` | Product — Feature Definition | No |
| `architect` | Tech lead — design, variants, task list | No |
| `builder` | Web, extension and app developer — one task at a time | Yes |
| `reviewer` | Independent review and QA | No (reports) |
| `privacy-guard` | Privacy and security: zero-request, no-tracking, keys | No (reports) |
| `release-prep` | Changelog, docs, release checklist — never pushes | Changelog and docs |

There is **no ML feature-engineer** in this repo: Taghvim has no model. "Feature Engineering" is an
ML term for building a model's input variables; turning requirements into product features is
**Feature Definition** (the `feature-definition` skill). Add the ML agent only if a model is ever added.

## Rules that bind every agent (summarised from AGENTS.md — read the full text)

1. **Push means deploy.** Railway builds every push to `main`. No agent pushes, tags, merges or deploys.
   Agents commit on a feature branch at most; Farjad pushes.
2. **No tracking, ever.** No analytics, no third-party request, no new network call. Success is measured
   from feedback mail, GitHub issues, replies on X, store reviews and aggregate server logs — never from
   code added to the visitor's browser.
3. **Keys and passwords are untouchable.** Agents never read, type or store signing passwords or anything
   under `~/taghvim-keys/`.
4. **The extension and the Android app make zero network requests.** Keep `permissions` empty and no `INTERNET` permission.
5. **Persian and RTL.** UI text stays Persian. Colours only from `globals.css` tokens, sizes in rem, file headers on every code file.
6. **Dates in `Asia/Tehran`.** Keep every data disclaimer.
7. **Read the Next.js docs in `node_modules/next/dist/docs/`** before writing Next code — this version differs from training data.
8. **Do not stop the process on port 3000.** Use 3100 (or 3101 in a worktree) for dev and e2e.

## Where agent work goes
- Feature cards and reviews: `.claude/work/` (git-ignored, local working notes). Templates in `.claude/templates/`.
- Durable decisions: proposed as an `AGENTS.md` entry, written the way existing entries are
  (what, why, who decided, date). Farjad approves before it is committed.
- The roadmap lives in Notion (the Taghvim row and its sub-pages), not in this repo.
