// ============================================================================
// Source: src/components/feedback-panel.tsx
// Version: 0.9.14 — 2026-09-09
// Why: Two buttons — report a bug, suggest a feature — that open the mail app
//      with the questions already written. The address is printed underneath
//      as plain text because a mailto: button does nothing on a machine with
//      no mail client configured, and a dead button with no fallback is worse
//      than no button.
// Env / Deps: lib/feedback builds the href. Client component only so it can
//      add the current path and the user agent after mount; the href is valid
//      and sendable before that, so nothing depends on JavaScript running.
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { Bug, Lightbulb } from "lucide-react";
import { FEEDBACK_EMAIL, feedbackMailto, type FeedbackContext } from "@/lib/feedback";

export function FeedbackPanel({ version }: { version: string }) {
  const [context, setContext] = useState<FeedbackContext>({ version });
  // Reading location and navigator during render would differ between the
  // server and the first client paint; after mount there is nothing to match.
  useEffect(() => {
    setContext({ version, page: window.location.pathname, browser: window.navigator.userAgent });
  }, [version]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={feedbackMailto("bug", context)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-forest/30 hover:bg-leaf/40"
        >
          <Bug size={16} className="text-clay" />
          گزارش اشکال
        </a>
        <a
          href={feedbackMailto("idea", context)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-forest/30 hover:bg-leaf/40"
        >
          <Lightbulb size={16} className="text-forest" />
          پیشنهاد یک قابلیت
        </a>
      </div>
      {/* One paragraph, not a flex row: an icon as a sibling flex item was
          orphaned on its own line at phone widths. */}
      <p className="text-xs leading-6 text-muted">
        اگر دکمه‌ها کاری نکردند، برنامهٔ ایمیلی روی این دستگاه تنظیم نشده. مستقیم بنویس به{" "}
        <a href={`mailto:${FEEDBACK_EMAIL}`} className="font-medium text-forest hover:underline"><bdi dir="ltr">{FEEDBACK_EMAIL}</bdi></a>
      </p>
    </div>
  );
}
