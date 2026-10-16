# Review — F-<n> — <feature name>

**Branch:** <name> · **Date:** <YYYY-MM-DD>

## Commands run by the reviewer
npm test ✅/❌ (n passed) · typecheck ✅/❌ · build ✅/❌ · e2e ✅/❌/not run (reason) · build:extension ✅/❌/n/a

## Checklist
| Area | Check | Result | Evidence |
|---|---|---|---|
| Correctness | Every acceptance criterion covered | | |
| Correctness | No scope creep | | |
| Correctness | Tehran dates, rollover covered | | |
| Correctness | Events via `eventsForDate(date, groups)` | | |
| Invariants | Disclaimers kept | | |
| Invariants | Extension/app: no `next/*`, no request | | |
| Invariants | Tokens in every palette block, no hex | | |
| Invariants | Storage guarded, migrates, no strict key count | | |
| Invariants | Routes in `routes.ts`, `pageMetadata()` | | |
| Invariants | Widget data regenerated if events changed | | |
| Style | Headers + Version bump, Tailwind, rem, Persian typography | | |
| A11y | axe light + dark, RTL keys, cell names | | |
| Layout | No sideways scroll at 320–390px | | |
| Tests | Would fail if broken; none weakened | | |

## Findings
### BLOCKER
### MAJOR
### MINOR

VERDICT: APPROVE | CHANGES REQUESTED (n blockers, m majors)

<!-- privacy-guard appends "## Privacy and security review" here -->
