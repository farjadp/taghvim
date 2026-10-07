// ============================================================================
// Source: src/lib/rates.test.ts
// Version: 0.1.0 — 2026-10-07
// Why: Guards the parse of @sarafha_rate's preview page and the read schedule.
//      The fixture copies the page's real markup (7 Oct 2026, 18:20 and 18:45
//      posts) trimmed to the lines that matter.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { isFresh, parseChannelPage, parsePost, slotKey } from './rates';

const dot = `<i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94B4.png')"><b>🔴</b></i>`;
function post(lines: string[], at: string) {
  return `<div class="tgme_widget_message_wrap js-widget_message_wrap"><div class="tgme_widget_message_text js-message_text" dir="auto">${lines.map((line) => `${dot} ${line}  `).join('<br/>')}<br/> <br/><br/>18:45 چهارشنبه 15 مهر 1405</div><span class="tgme_widget_message_meta"><a class="tgme_widget_message_date" href="https://t.me/sarafha_rate/1"><time datetime="${at}" class="time">x</time></a></span></div>`;
}
const EARLIER = ['دلار آمریکا : 264,300', 'یورو : 295,760', 'سکه امامی : 268,500,000', 'گرم طلای 18 : 26,263,910', 'اونس طلا : 4,105.3'];
const LATER = ['دلار آمریکا : 264,200', 'یورو : 295,650', 'سکه امامی : 268,500,000', 'گرم طلای 18 : 26,259,290', 'اونس طلا : 4,108.3', 'اونس نقره : 60'];
const AD = `<div class="tgme_widget_message_wrap"><div class="tgme_widget_message_text js-message_text">عضو کانال ما شوید!</div><time datetime="2026-10-07T15:20:00+00:00"></time></div>`;
const PAGE = post(EARLIER, '2026-10-07T14:50:16+00:00') + post(LATER, '2026-10-07T15:15:48+00:00') + AD;

describe('rates parsing', () => {
  it('reads the newest rates post and diffs it against the one before', () => {
    const snapshot = parseChannelPage(PAGE)!;
    expect(snapshot.at).toBe('2026-10-07T15:15:48+00:00');
    const byId = Object.fromEntries(snapshot.rates.map((rate) => [rate.id, rate]));
    expect(byId.usd).toMatchObject({ value: 264200, prev: 264300, unit: 'toman' });
    expect(byId.gram18).toMatchObject({ label: 'گرم طلای ۱۸', value: 26259290 });
    expect(byId.xau).toMatchObject({ value: 4108.3, prev: 4105.3, unit: 'usd' });
    // Not in the earlier post: no change to show rather than a made-up one
    expect(byId.xag.prev).toBeNull();
  });

  it('skips a post that is not a rates post, and unknown lines inside one', () => {
    expect(parsePost('عضو کانال ما شوید!')).toBeNull();
    const values = parsePost(['🔴 دلار آمریکا : 264,200', '🔴 یورو : 295,650', '🔴 سکه امامی : 268,500,000', '🟢 بیت‌کوین : 99,000'].join('\n'))!;
    expect([...values.keys()]).toEqual(['usd', 'eur', 'emami']);
  });

  it('accepts Persian digits', () => {
    expect(parsePost('دلار آمریکا : ۲۶۴٬۲۰۰\nیورو : ۲۹۵٬۶۵۰\nسکه امامی : ۱۰')!.get('usd')).toBe(264200);
  });

  it('returns null for a page with no rates post', () => {
    expect(parseChannelPage(AD)).toBeNull();
    expect(parseChannelPage('')).toBeNull();
  });
});

describe('read schedule', () => {
  // Tehran is UTC+03:30
  it('falls into five Tehran slots a day', () => {
    expect(slotKey(new Date('2026-10-07T15:15:00Z'))).toBe('2026-10-07@18'); // 18:45 Tehran
    expect(slotKey(new Date('2026-10-07T14:29:00Z'))).toBe('2026-10-07@15'); // 17:59
    expect(slotKey(new Date('2026-10-07T05:30:00Z'))).toBe('2026-10-07@9'); // 09:00
    const keys = new Set(Array.from({ length: 24 }, (_, h) => slotKey(new Date(Date.UTC(2026, 9, 7, h, 0)))));
    expect(keys.size).toBeLessThanOrEqual(6);
  });

  it('before 09:00 belongs to the previous evening', () => {
    expect(slotKey(new Date('2026-10-07T02:00:00Z'))).toBe('2026-10-06@21'); // 05:30 Tehran
    expect(slotKey(new Date('2026-10-06T20:31:00Z'))).toBe('2026-10-06@21'); // 00:01 on the 7th
  });

  it('hides a snapshot older than three days', () => {
    const snapshot = { at: '2026-10-07T15:15:48+00:00', rates: [] };
    expect(isFresh(snapshot, new Date('2026-10-09T15:00:00Z'))).toBe(true);
    expect(isFresh(snapshot, new Date('2026-10-10T16:00:00Z'))).toBe(false);
  });
});
