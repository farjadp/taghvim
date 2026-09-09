import { chromium } from '@playwright/test';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dist = new URL('./extension/dist', import.meta.url).pathname;
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'tg-')), {
  channel: 'chromium',
  args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
});
// The service-worker trick does not apply (no background), so read the id off
// the extension's own page listing instead: open any page and ask chrome.
let id = null;
for (let i = 0; i < 20 && !id; i++) {
  const page = await ctx.newPage();
  await page.goto('chrome://extensions/');
  id = await page.evaluate(async () => {
    const items = document.querySelector('extensions-manager')?.shadowRoot
      ?.querySelector('extensions-item-list')?.shadowRoot?.querySelectorAll('extensions-item');
    return items?.[0]?.id ?? null;
  });
  await page.close();
  if (!id) await new Promise((r) => setTimeout(r, 300));
}
console.log('extension id:', id);
const page = await ctx.newPage();
const requests = [];
page.on('request', (r) => { if (!r.url().startsWith(`chrome-extension://${id}`)) requests.push(r.url()); });
await page.goto(`chrome-extension://${id}/newtab.html`);
await page.evaluate(() => document.fonts.ready);
console.log('h1:', await page.locator('h1').textContent());
const button = page.getByRole('button', { name: 'تصویر امروز' });
console.log('button visible:', await button.isVisible());
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 15000 }).catch((e) => e),
  button.click(),
]);
if (download instanceof Error) {
  console.log('DOWNLOAD FAILED:', download.message.split('\n')[0]);
  console.log('status line:', await page.locator('[role="status"], .sr-only').allTextContents());
} else {
  console.log('downloaded filename:', download.suggestedFilename());
  const path = await download.path();
  console.log('bytes:', path ? readdirSync(join(path, '..')).length && (await import('node:fs')).statSync(path).size : 'n/a');
}
console.log('foreign requests:', requests.length ? requests : 'none');
await ctx.close();
