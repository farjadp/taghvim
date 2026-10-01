// ============================================================================
// Source: scripts/sign-release-aab.mjs
// Version: 0.2.1 — 2026-10-01
// Why: Google Play takes an app bundle, not an APK, and wants it signed with
//      the UPLOAD key; Play then signs what it serves with the app signing key
//      (ours, handed over once through PEPK), the same key as the taghv.im APK.
//      This is sign-release-apk.mjs for that bundle, with the same guarantees:
//        1. downloads *-unsigned.aab from the draft release of <tag>
//        2. `gh attestation verify` it, pinned to this repo's release workflow
//        3. signs it with jarsigner, which asks for the password itself
//        4. checks the certificate is UPLOAD_CERT_SHA256 below
//        5. checks every file inside is identical to the unsigned one
//      It never uploads anywhere: the signed bundle goes to the Play Console by
//      hand, and is not published on GitHub — the unsigned one already is.
// Env / Deps: gh (logged in), Java 21 (jarsigner, keytool). Usage:
//        node scripts/sign-release-aab.mjs v0.9.40
//      Test-only flags: --keystore <path> --alias <a> --expect-cert <hex>
//      --ks-pass-env <VAR> --local <unsigned.aab> (skips download AND attestation).
// ============================================================================

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'farjadp/taghvim';
const WORKFLOW = `${REPO}/.github/workflows/release.yml`;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The upload certificate's SHA-256 (CN=Taghvim, RSA 4096, made 1 Oct 2026 at
// 12:08 on the Canadian layout). It replaced two upload keys whose passwords
// were lost before either was registered anywhere. Public by nature; read from
// ~/taghvim-keys/upload_certificate.pem. A bundle signed by any other key is refused.
const UPLOAD_CERT_SHA256 = 'FC:A5:E4:75:ED:28:F0:28:39:55:3A:84:E7:AF:92:2D:4F:00:EA:ED:13:E5:88:3C:A0:76:87:7A:F2:7B:90:C8';

const args = process.argv.slice(2);
const tag = args.find((arg) => !arg.startsWith('--') && !args[args.indexOf(arg) - 1]?.startsWith('--'));
const flag = (name) => { const i = args.indexOf(`--${name}`); return i === -1 ? undefined : args[i + 1]; };
const fail = (message) => { console.error(`FAIL  ${message}`); process.exit(1); };
const local = flag('local');
if (!tag && !local) fail('usage: node scripts/sign-release-aab.mjs <tag>');

const keystore = flag('keystore') ?? join(homedir(), 'taghvim-keys/taghvim-upload.jks');
const alias = flag('alias') ?? 'upload';
const passEnv = flag('ks-pass-env');
const expectedCert = (flag('expect-cert') ?? UPLOAD_CERT_SHA256 ?? '').replaceAll(':', '').toLowerCase();
if (expectedCert && !/^[0-9a-f]{64}$/.test(expectedCert)) fail(`not a SHA-256 fingerprint: ${expectedCert}`);
if (!existsSync(keystore)) fail(`no keystore at ${keystore}`);

// Java 21, where this Mac keeps it.
const env = { ...process.env };
if (existsSync('/opt/homebrew/opt/openjdk@21')) {
  env.JAVA_HOME = '/opt/homebrew/opt/openjdk@21';
  env.PATH = `${env.JAVA_HOME}/bin:${env.PATH}`;
}
const run = (cmd, argv, options = {}) => execFileSync(cmd, argv, { env, encoding: 'utf8', ...options });

// 1–2. The workflow's file, proven to be the workflow's — or, for a test, a local one.
const work = mkdtempSync(join(tmpdir(), 'taghvim-sign-aab-'));
let unsigned;
if (local) {
  if (!local.endsWith('-unsigned.aab')) fail('--local wants a *-unsigned.aab, as the workflow names it');
  console.log('WARN  --local: no download and NO attestation check. Never upload this result to Play.');
  unsigned = join(work, basename(local));
  copyFileSync(local, unsigned);
} else {
  try {
    run('gh', ['release', 'download', tag, '--repo', REPO, '--pattern', '*-unsigned.aab', '--dir', work], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (error) {
    // The usual cause: the tag is not pushed yet, its workflow has not finished,
    // or it predates the workflow building a bundle at all (v0.9.39 and earlier).
    fail(`no release ${tag} with an unsigned AAB (${String(error.stderr ?? '').trim() || error.message}).\n      Push the tag first and wait for the Release workflow: gh run list --workflow release.yml`);
  }
  const name = readdirSync(work).find((file) => file.endsWith('-unsigned.aab'));
  if (!name) fail(`release ${tag} has no *-unsigned.aab`);
  unsigned = join(work, name);
  console.log(`OK    downloaded ${name}`);
  run('gh', ['attestation', 'verify', unsigned, '--repo', REPO, '--signer-workflow', WORKFLOW], { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`OK    attestation: built by ${WORKFLOW}`);
}
if (/META-INF\/[^/]+\.(SF|RSA|DSA|EC)$/m.test(run('unzip', ['-Z1', unsigned]))) fail('the bundle is already signed');

// 3. Sign. Without -storepass jarsigner prompts on the terminal, so the password
//    is never in this process's arguments, environment or history.
const signedName = basename(unsigned).replace('-unsigned.aab', '-upload.aab');
const signed = join(work, signedName);
const passArgs = passEnv ? ['-storepass:env', passEnv] : [];
try {
  run('jarsigner', [...passArgs, '-keystore', keystore, '-signedjar', signed, unsigned, alias], { stdio: 'inherit' });
} catch {
  // jarsigner has already printed why; the usual cause is the release key's
  // password typed for the upload key. Nothing was signed.
  fail(`jarsigner could not sign with ${keystore} (alias ${alias}); nothing was signed`);
}
// Not -strict: an Android key is self-signed by design, and -strict rejects that.
run('jarsigner', ['-verify', signed]);

// 4. The upload key, and only it.
const printed = run('keytool', ['-printcert', '-jarfile', signed]);
const certs = [...printed.matchAll(/SHA256: ([0-9A-F:]{95})/g)].map((match) => match[1].replaceAll(':', '').toLowerCase());
if (certs.length !== 1) fail(`expected one signer, found ${certs.length}`);
const [cert] = certs;
if (!expectedCert) {
  console.log(`NOTE  no upload certificate on record yet. This bundle is signed by:\n      ${cert}\n      Compare it with Play Console › Setup › App signing › «Upload key certificate»,\n      then set UPLOAD_CERT_SHA256 in this script and commit it.`);
} else if (cert !== expectedCert) {
  fail(`signed with ${cert}, expected ${expectedCert}`);
} else {
  console.log(`OK    certificate ${cert}`);
}

// 5. Nothing but the signature changed: same entries, same CRCs, same sizes.
const entries = (file) => run('unzip', ['-v', file]).split('\n')
  .map((line) => line.match(/^\s*(\d+)\s+\S+\s+\d+\s+\S+\s+\S+\s+\S+\s+([0-9a-f]{8})\s+(.+)$/))
  .filter(Boolean).map(([, size, crc, name]) => `${crc} ${size} ${name}`)
  .filter((entry) => !/ META-INF\/[^/]+\.(SF|RSA|DSA|EC)$| META-INF\/MANIFEST\.MF$/.test(entry)).sort();
const [before, after] = [entries(unsigned), entries(signed)];
if (before.length === 0 || before.join('\n') !== after.join('\n')) fail('the signed bundle contains different files from the unsigned build');
console.log(`OK    ${before.length} files identical to the unsigned build`);

// Left beside the app project, where *.aab is git-ignored.
const out = join(root, 'mobile/android/app', signedName);
copyFileSync(signed, out);
const sha = createHash('sha256').update(readFileSync(out)).digest('hex');
console.log(`OK    ${signedName} sha256 ${sha}\n      ${out}\n      Upload it in Play Console; it is not published anywhere else.`);
