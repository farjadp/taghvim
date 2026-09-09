// ============================================================================
// Source: src/lib/feedback.test.ts
// Version: 0.9.14 — 2026-09-09
// Why: The report link is the only channel there is, so a malformed mailto is
//      silent data loss: the mail app opens with an empty body, or does not
//      open at all, and the person gives up rather than reporting twice.
// Env / Deps: Vitest. Pure functions, no DOM.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { FEEDBACK_EMAIL, FEEDBACK_SUBJECTS, MAX_BROWSER_LENGTH, feedbackBody, feedbackMailto } from './feedback';

describe('feedbackBody', () => {
  it('asks the two questions the kind needs answered', () => {
    expect(feedbackBody('bug', { version: '0.9.14' })).toContain('چه اتفاقی افتاد؟');
    expect(feedbackBody('idea', { version: '0.9.14' })).toContain('چه چیزی کم است؟');
    // A bug report that arrives with the feature-request prompts is a bug here
    expect(feedbackBody('idea', { version: '0.9.14' })).not.toContain('چه اتفاقی افتاد؟');
  });

  it('always carries the version and labels the technical block as removable', () => {
    const body = feedbackBody('idea', { version: '0.9.14' });
    expect(body).toContain('نسخه: 0.9.14');
    expect(body).toContain('پاکش کن');
  });

  it('adds the page and browser to a bug report only', () => {
    const context = { version: '0.9.14', page: '/help', browser: 'Mozilla/5.0 (Macintosh)' };
    expect(feedbackBody('bug', context)).toContain('صفحه: /help');
    expect(feedbackBody('bug', context)).toContain('مرورگر: Mozilla/5.0 (Macintosh)');
    // A feature request does not depend on where the person was standing
    expect(feedbackBody('idea', context)).not.toContain('صفحه:');
    expect(feedbackBody('idea', context)).not.toContain('مرورگر:');
  });

  it('works server-side, where there is no page and no user agent', () => {
    const body = feedbackBody('bug', { version: '0.9.14' });
    expect(body).toContain('نسخه: 0.9.14');
    expect(body).not.toContain('صفحه:');
    expect(body).not.toContain('مرورگر:');
  });

  it('truncates a user agent long enough to bury the questions', () => {
    const body = feedbackBody('bug', { version: '0.9.14', browser: 'x'.repeat(500) });
    expect(body).toContain(`مرورگر: ${'x'.repeat(MAX_BROWSER_LENGTH)}\n`.trimEnd());
    expect(body).not.toContain('x'.repeat(MAX_BROWSER_LENGTH + 1));
  });
});

describe('feedbackMailto', () => {
  it('addresses the same mailbox /contact shows', () => {
    expect(feedbackMailto('bug', { version: '0.9.14' }).startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
  });

  it('round-trips the subject and body through the query string', () => {
    const href = feedbackMailto('bug', { version: '0.9.14', page: '/download' });
    const query = new URLSearchParams(href.slice(href.indexOf('?') + 1));
    expect(query.get('subject')).toBe(FEEDBACK_SUBJECTS.bug);
    expect(query.get('body')).toBe(feedbackBody('bug', { version: '0.9.14', page: '/download' }));
  });

  it('encodes spaces as %20, not +, which mail clients show literally', () => {
    const href = feedbackMailto('idea', { version: '0.9.14' });
    expect(href).not.toContain('+');
    expect(href).toContain('%20');
  });

  it('encodes newlines so the questions arrive on separate lines', () => {
    expect(feedbackMailto('idea', { version: '0.9.14' })).toContain('%0A');
  });
});
