// ============================================================================
// Source: scripts/sign-release-apk.mjs
// Version: 0.1.0 — 2026-09-11
// Why: The release workflow builds the APK unsigned, in public; the key stays
//      on Farjad's Mac. This signs THAT file — never a local build — so the
//      published APK is provably the workflow's output plus a signature:
//        1. downloads *-unsigned.apk from the draft release of <tag>
//        2. `gh attestation verify` it, pinned to this repo's release workflow
//        3. signs it with apksigner, which asks for the password itself
//        4. checks the certificate is the published ANDROID_CERT_SHA256
//        5. checks every file inside is identical to the unsigned one
//        6. uploads the signed APK beside it, then asks before publishing
// Env / Deps: gh (logged in), Android build-tools (apksigner, zipalign),
//      Java 21. Usage:
//        node scripts/sign-release-apk.mjs v0.9.39
//      Test-only flags: --keystore <path> --alias <a> --expect-cert <hex>
//      --ks-pass-env <VAR> --no-upload.
// ============================================================================

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, renameSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const REPO = 'farjadp/taghvim';
const WORKFLOW = `${REPO}/.github/workflows/release.yml`;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const tag = args.find((arg) => !arg.startsWith('--') && !args[args.indexOf(arg) - 1]?.startsWith('--'));
const flag = (name) => { const i = args.indexOf(`--${name}`); return i === -1 ? undefined : args[i + 1]; };
const fail = (message) => { console.error(`FAIL  ${message}`); process.exit(1); };
if (!tag) fail('usage: node scripts/sign-release-apk.mjs <tag>');

const keystore = flag('keystore') ?? join(homedir(), 'taghvim-keys/taghvim-release.jks');
const alias = flag('alias') ?? 'taghvim';
const passEnv = flag('ks-pass-env');
const upload = !args.includes('--no-upload');
// The published fingerprint, read from the page that shows it, so the two cannot drift.
const published = readFileSync(join(root, 'src/lib/downloads.ts'), 'utf8').match(/ANDROID_CERT_SHA256 =\s*'([0-9A-F:]+)'/)?.[1];
const expectedCert = (flag('expect-cert') ?? published ?? '').replaceAll(':', '').toLowerCase();
if (!/^[0-9a-f]{64}$/.test(expectedCert)) fail('no certificate fingerprint to check against');
if (!existsSync(keystore)) fail(`no keystore at ${keystore}`);

// Java 21 and the newest build-tools, where this Mac keeps them.
const env = { ...process.env };
if (existsSync('/opt/homebrew/opt/openjdk@21')) {
  env.JAVA_HOME = '/opt/homebrew/opt/openjdk@21';
  env.PATH = `${env.JAVA_HOME}/bin:${env.PATH}`;
}
const sdk = env.ANDROID_HOME ?? join(homedir(), 'Library/Android/sdk');
const buildTools = readdirSync(join(sdk, 'build-tools')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).at(-1);
const tool = (name) => join(sdk, 'build-tools', buildTools, name);
const run = (cmd, argv, options = {}) => execFileSync(cmd, argv, { env, encoding: 'utf8', ...options });

// 1. The workflow's file, from the draft release.
const work = mkdtempSync(join(tmpdir(), 'taghvim-sign-'));
try {
  run('gh', ['release', 'download', tag, '--repo', REPO, '--pattern', '*-unsigned.apk', '--dir', work], { stdio: ['ignore', 'ignore', 'pipe'] });
} catch (error) {
  // The usual cause: the tag is not pushed yet, or its workflow has not finished.
  fail(`no release ${tag} with an unsigned APK (${String(error.stderr ?? '').trim() || error.message}).\n      Push the tag first and wait for the Release workflow: gh run list --workflow release.yml`);
}
const unsignedName = readdirSync(work).find((name) => name.endsWith('-unsigned.apk'));
if (!unsignedName) fail(`release ${tag} has no *-unsigned.apk`);
const unsigned = join(work, unsignedName);
const signed = join(work, unsignedName.replace('-unsigned.apk', '.apk'));
console.log(`OK    downloaded ${unsignedName}`);

// 2. Built by this repo's release workflow, and not altered since.
run('gh', ['attestation', 'verify', unsigned, '--repo', REPO, '--signer-workflow', WORKFLOW], { stdio: ['ignore', 'ignore', 'inherit'] });
console.log(`OK    attestation: built by ${WORKFLOW}`);

// 3. Sign. Without --ks-pass apksigner prompts on the terminal, so the password
//    is never in this process's arguments, environment or history.
run(tool('zipalign'), ['-c', '4', unsigned]);
const passArgs = passEnv ? ['--ks-pass', `env:${passEnv}`] : [];
run(tool('apksigner'), ['sign', '--ks', keystore, '--ks-key-alias', alias, ...passArgs, '--out', signed, unsigned], { stdio: 'inherit' });

// 4. The one key.
const certs = run(tool('apksigner'), ['verify', '--print-certs', signed]);
const cert = certs.match(/certificate SHA-256 digest: ([0-9a-f]{64})/)?.[1];
if (cert !== expectedCert) fail(`signed with ${cert}, expected ${expectedCert}`);
console.log(`OK    certificate ${cert}`);

// 5. Nothing but the signature changed: same entries, same CRCs, same sizes.
const entries = (file) => run('unzip', ['-v', file]).split('\n')
  .map((line) => line.match(/^\s*(\d+)\s+\S+\s+\d+\s+\S+\s+\S+\s+\S+\s+([0-9a-f]{8})\s+(.+)$/))
  .filter(Boolean).map(([, size, crc, name]) => `${crc} ${size} ${name}`)
  .filter((entry) => !/ META-INF\/[^/]+\.(SF|RSA|DSA|EC)$| META-INF\/MANIFEST\.MF$/.test(entry)).sort();
const [before, after] = [entries(unsigned), entries(signed)];
if (before.length === 0 || before.join('\n') !== after.join('\n')) fail('the signed APK contains different files from the unsigned build');
console.log(`OK    ${before.length} files identical to the unsigned build`);

const sha = createHash('sha256').update(readFileSync(signed)).digest('hex');
console.log(`OK    ${signed.split('/').at(-1)} sha256 ${sha}`);

// 6. Upload beside the unsigned file, then publish only on a yes.
if (!upload) { console.log(`      --no-upload: left at ${signed}`); process.exit(0); }
run('gh', ['release', 'upload', tag, signed, '--repo', REPO, '--clobber'], { stdio: 'inherit' });
console.log(`OK    uploaded to ${tag}`);
const answer = await createInterface({ input: process.stdin, output: process.stdout }).question(`Publish draft release ${tag} now? [y/N] `);
if (answer.trim().toLowerCase() === 'y') {
  run('gh', ['release', 'edit', tag, '--repo', REPO, '--draft=false'], { stdio: 'inherit' });
  console.log(`OK    ${tag} published`);
} else {
  console.log(`      still a draft: gh release edit ${tag} --repo ${REPO} --draft=false`);
}
process.exit(0);
