---
name: feature-definition
description: Turn a request (reply on X, feedback email, GitHub issue, Farjad's idea) into a small, testable Taghvim feature with traceability, acceptance criteria and a privacy-safe success signal. Use when defining or prioritising features. This is product Feature Definition, not ML Feature Engineering.
---

# Feature Definition for Taghvim

## The name
This is **Feature Definition**, part of Requirements Engineering. It is often mislabelled
"Feature Engineering", which in software and AI means building a machine-learning model's input
variables. Taghvim has no model, so it has no feature engineering. Use the right word.

## Why it matters here
Taghvim's best features came from listening (the screen-reader work, the festivals, the wide widget,
the month widget). Its worst moments came from building before defining: a page nobody could find
(`/dates`), a switch that changed nothing (state holidays and the old bridge floors), a release that
told visitors it was unpublished. Good definition prevents exactly those.

## The chain
```
User problem → Requirement → Feature → Acceptance criteria → Success signal
```
- Acceptance criteria answer: *is it built correctly?*
- The success signal answers: *was it worth building?* Without it, a team becomes a feature factory.

## Procedure

### A. Write the problem with its source
"Readers abroad cannot tell if today is a holiday in Iran" — source: replies on X, 9 Oct.
No source → label it `ASSUMPTION`.

### B. Check what was already decided
Search `AGENTS.md` for the area. If it records a decision ("Farjad's call", "do not bring back",
"rejected"), the card must quote it and explain what is different now — or stop.

### C. Pass the product filters
Reject or reshape anything that adds an account, database, ad, analytics, third-party request,
or a network request in the extension or app; presents the occasion list as official or complete;
or promises something not built.

### D. Evaluate — say no
Recommend **do now / later / cut**, one reason each. Effort counts every surface: site, extension
(two browsers), Android app, iPhone app, widgets, `.ics`, help page, changelog.

### E. Define the feature small
One user-visible capability. Split by user value, never by layer
("see the next holiday" then "share it", not "logic" then "UI").
Name where it lives. A tab nobody scrolls to is a page nobody finds; check discoverability.

### F. Acceptance criteria (Given / When / Then)
Always cover: light and dark theme · phone width 320–390px with no sideways scroll · RTL keyboard ·
screen reader name · Tehran midnight rollover (if dates are involved) · the extension, if it renders there.

### G. Success signal — privacy-safe only
Never add tracking to measure a feature. Use signals that already exist:
- feedback emails and GitHub issues (count and content),
- replies and questions on X (does the question stop coming?),
- store ratings and reviews (Play Console, Chrome Web Store, App Store),
- aggregate server request counts for a route on Railway.
Format: **signal · target · window**. Example: "the question 'is today off?' stops appearing in
replies within two weeks of release."

### H. After release
Compare the signal to its target. Keep, iterate, or remove — removing a feature that did not
work is a good decision. Record the result in the card.

## Worked example
| Link | Content |
|---|---|
| Problem | VoiceOver users could not tell which day was off — the grid said it only by colour (outside suggestion, 9 Oct) |
| Requirement | A screen-reader user can hear whether a day is off and what happens on it |
| Feature | Each day cell's accessible name is a full sentence (shipped in 0.9.47) |
| Acceptance | Given a holiday cell is focused, when VoiceOver reads it, then it hears the date, «تعطیل», the occasions and the Gregorian date — and nothing for a switched-off group |
| Success signal | Feedback from a screen-reader user confirms it works; no new report of "can't tell holidays" in a month |
| Out of scope | A built-in voice (rejected: no `fa-IR` voice in most browsers, and a server voice breaks the no-backend rule) |

## Further reading
Phillip A. Laplante and Mohamad Kassab, *Requirements Engineering for Software and Systems*, 4th edition.
