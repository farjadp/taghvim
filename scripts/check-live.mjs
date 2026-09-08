// ============================================================================
// Source: scripts/check-live.mjs
// Version: 0.9.1 — 2026-09-08
// Why: A unit test cannot know whether a release was deployed, so it cannot
//      catch a 'ready' badge that is already on the live site. This can:
//      anything production renders is deployed by definition, so production
//      must never show «آمادهٔ انتشار». 0.9.0 shipped that way and told every
//      visitor it was unpublished.
// Env / Deps: Network. `SITE` overrides the target. Run after every deploy.
// ============================================================================

const site = process.env.SITE ?? 'https://taghv.im';
const READY_BADGE = 'آمادهٔ انتشار';

const response = await fetch(`${site}/changelog`, { redirect: 'follow' });
if (!response.ok) {
  console.error(`FAIL  ${site}/changelog returned ${response.status}`);
  process.exit(1);
}

const html = await response.text();
if (html.includes(READY_BADGE)) {
  console.error(`FAIL  ${site}/changelog still shows «${READY_BADGE}».`);
  console.error('      A deployed release is live by definition. Flip its status in');
  console.error('      src/lib/changelog.ts, commit, and deploy again.');
  process.exit(1);
}

console.log(`OK    ${site}/changelog shows no unpublished release.`);
