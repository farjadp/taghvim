// ============================================================================
// Source: src/lib/feedback.ts
// Version: 0.9.14 — 2026-09-09
// Why: The one way to report a bug or ask for a feature. It is a mailto: link
//      and nothing else — a real form would need a third-party endpoint, which
//      would break the promise on /about#privacy that the memorial photo is
//      the only external request, and those endpoints are often unreachable
//      from inside Iran, so the form would fail silently for exactly the
//      people most likely to report something.
// Env / Deps: None. The caller passes the version, the page and the browser;
//      this module only shapes and encodes them.
// ============================================================================

// The same address /contact shows. One constant so they cannot drift apart.
export const FEEDBACK_EMAIL = 'farjad@ashavid.ca';

export type FeedbackKind = 'bug' | 'idea';

// Context the reporter can see and delete before sending. `page` and `browser`
// are only known in the browser, so both are optional and the link works
// without them — a server-rendered href is still a valid, sendable email.
export type FeedbackContext = {
  version: string;
  page?: string;
  browser?: string;
};

export const FEEDBACK_SUBJECTS: Record<FeedbackKind, string> = {
  bug: '[تقویم] گزارش اشکال',
  idea: '[تقویم] پیشنهاد',
};

// Two questions, because a report that answers them is actionable and one that
// does not is a round trip. Blank lines are where the person writes.
const PROMPTS: Record<FeedbackKind, string[]> = {
  bug: ['چه اتفاقی افتاد؟', 'انتظار داشتی چه بشود؟'],
  idea: ['چه چیزی کم است؟', 'چرا به کارت می‌آید؟'],
};

const CONTEXT_HEADING = '— اطلاعات فنی، اگر نمی‌خواهی پاکش کن —';

// A long user-agent string turns the mail body into a wall, and the part that
// identifies the browser is at the front.
export const MAX_BROWSER_LENGTH = 180;

export function feedbackBody(kind: FeedbackKind, context: FeedbackContext): string {
  const lines: string[] = [];
  for (const prompt of PROMPTS[kind]) lines.push(prompt, '', '');
  lines.push(CONTEXT_HEADING, `نسخه: ${context.version}`);
  // Only a bug needs to know where it happened and in what
  if (kind === 'bug') {
    if (context.page) lines.push(`صفحه: ${context.page}`);
    if (context.browser) lines.push(`مرورگر: ${context.browser.slice(0, MAX_BROWSER_LENGTH)}`);
  }
  return lines.join('\n');
}

// RFC 6068: everything after `?` is percent-encoded, and a newline in a body
// must survive as %0A rather than being eaten by the mail client.
export function feedbackMailto(kind: FeedbackKind, context: FeedbackContext): string {
  const query = new URLSearchParams({ subject: FEEDBACK_SUBJECTS[kind], body: feedbackBody(kind, context) });
  // URLSearchParams encodes a space as `+`, which a mail client shows literally
  return `mailto:${FEEDBACK_EMAIL}?${query.toString().replace(/\+/g, '%20')}`;
}
