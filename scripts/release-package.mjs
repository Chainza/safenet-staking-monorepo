#!/usr/bin/env node
// Cut an npm release of `@chainza/safenet-staking-core` or
// `@chainza/safenet-staking-widget`. Publishing itself stays manual — this
// script never talks to the registry with credentials; it runs the preflight
// checks, produces the exact tarball to publish, and afterwards ties that
// tarball to a git tag + GitHub Release so anyone can map a version on npm
// back to a commit (and re-derive its bytes).
//
// `pnpm pack` is deterministic: the same source tree always yields a
// byte-identical tarball, so its sha512 — the same value npm records as
// `dist.integrity` — is a verifiable link between the tag and the published
// artifact. That is what the "Verify" section of the release notes tells third
// parties to check.
//
// Zero dependencies beyond node builtins and the `git`/`gh`/`pnpm`/`npm`/`tar`
// CLIs, matching the other scripts here.
//
// Usage:
//   node scripts/release-package.mjs <core|widget>            # preflight + pack
//   node scripts/release-package.mjs <core|widget> --record   # after publishing

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_DIRS = { core: "packages/core", widget: "packages/widget" };
/** Where `pnpm pack` writes tarballs (gitignored). */
const RELEASE_DIR = join(ROOT, ".release");

// Every check below is an `assert`, so surface failures as a one-line reason
// instead of a stack trace — this is an interactive checklist, not a library.
process.on("uncaughtException", (error) => {
  if (!(error instanceof assert.AssertionError)) throw error;
  console.error(`\n✗ ${error.message}\n`);
  process.exit(1);
});

const [key, flag] = process.argv.slice(2);
if (!key || !(key in PACKAGE_DIRS) || (flag && flag !== "--record")) {
  console.error("usage: release-package.mjs <core|widget> [--record]");
  process.exit(1);
}

const run = (cmd, args, cwd = ROOT) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const runLive = (cmd, args, cwd = ROOT) => execFileSync(cmd, args, { cwd, stdio: "inherit" });

/** Versions of `name` on npm; `[]` when the package was never published (E404). */
function publishedVersions(name) {
  try {
    return JSON.parse(run("npm", ["view", name, "versions", "--json"]));
  } catch {
    return [];
  }
}

/** The `## [x.y.z]` section of a Keep-a-Changelog file, without its heading —
 *  everything up to the next version heading or the trailing link references. */
function changelogSection(changelog, version) {
  const heading = changelog.indexOf(`## [${version}]`);
  if (heading === -1) return undefined;
  const body = changelog.slice(changelog.indexOf("\n", heading) + 1);
  const end = body.search(/^(## \[|\[)/m);
  return (end === -1 ? body : body.slice(0, end)).trim();
}

const packageDir = join(ROOT, PACKAGE_DIRS[key]);
const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
const { name, version } = manifest;
const tag = `${key}-v${version}`;
const tarball = join(RELEASE_DIR, `${key}-${version}.tgz`);

const changelog = readFileSync(join(packageDir, "CHANGELOG.md"), "utf8");
const notes = changelogSection(changelog, version);
assert(notes, `CHANGELOG.md has no "## [${version}]" section — document the release first`);

/** npm's `dist.integrity` format: base64 sha512 of the tarball bytes. */
const integrityOf = (file) =>
  "sha512-" + createHash("sha512").update(readFileSync(file)).digest("base64");

if (flag === "--record") {
  // ---- Phase 2: after `npm publish` — tie the published bytes to a commit ----
  assert(
    existsSync(tarball),
    `${tarball} is missing — re-run without --record (the recorded integrity must be the published tarball's)`,
  );
  assert(
    publishedVersions(name).includes(version),
    `${name}@${version} is not on npm yet — publish it first`,
  );

  const integrity = integrityOf(tarball);
  const published = run("npm", ["view", `${name}@${version}`, "dist.integrity"]);
  assert(
    published === integrity,
    `the published tarball differs from the local one (npm: ${published}, local: ${integrity}) — something other than this tarball was published`,
  );

  run("git", ["tag", "-a", tag, "-m", `${name} ${version}`]);
  run("git", ["push", "origin", tag]);

  const notesFile = join(RELEASE_DIR, `${tag}-notes.md`);
  writeFileSync(
    notesFile,
    `## [\`${name}@${version}\`](https://www.npmjs.com/package/${name}/v/${version})

${notes}

### Verify this release

The tarball published to npm is reproducible from this tag — \`pnpm pack\` is
deterministic, so the same source tree always packs to the same bytes:

\`\`\`sh
git checkout ${tag}
pnpm install --frozen-lockfile
pnpm turbo run build --filter=${name}...
cd ${PACKAGE_DIRS[key]} && pnpm pack --out /tmp/${key}-${version}.tgz
openssl dgst -sha512 -binary /tmp/${key}-${version}.tgz | openssl base64 -A
# must print the integrity below (npm's own value: \`npm view ${name}@${version} dist.integrity\`)
\`\`\`

| | |
|---|---|
| **integrity** | \`${integrity}\` |
| **npm** | https://www.npmjs.com/package/${name}/v/${version} |

The tarball is attached here too, so the published bytes stay available
independently of the registry.
`,
  );

  runLive("gh", [
    "release",
    "create",
    tag,
    "--title",
    `${name} ${version}`,
    "--notes-file",
    notesFile,
    tarball,
  ]);
  console.log(`\nRecorded ${tag} — tag pushed, GitHub Release created.`);
  process.exit(0);
}

// ---- Phase 1: preflight + pack ----
assert(
  run("git", ["status", "--porcelain"]) === "",
  "working tree is dirty — commit or stash first",
);

const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
assert(branch === "main", `on branch "${branch}" — releases are cut from main`);

try {
  run("git", ["fetch", "--quiet", "origin", "main"]);
  assert(
    run("git", ["rev-parse", "HEAD"]) === run("git", ["rev-parse", "origin/main"]),
    "HEAD is not origin/main — push or pull first, so the tag points at a public commit",
  );
} catch (error) {
  if (error instanceof assert.AssertionError) throw error;
  console.warn("! could not reach origin — skipping the up-to-date check");
}

assert(
  run("git", ["tag", "--list", tag]) === "",
  `tag ${tag} already exists — bump the version in ${PACKAGE_DIRS[key]}/package.json`,
);
assert(
  !publishedVersions(name).includes(version),
  `${name}@${version} is already on npm (versions are immutable) — bump the version first`,
);

console.log(`\n=> building and testing ${name}@${version}\n`);
runLive("pnpm", ["turbo", "run", "build", `--filter=${name}...`, "--force"]);
runLive("pnpm", ["--filter", name, "test"]);

mkdirSync(RELEASE_DIR, { recursive: true });
runLive("pnpm", ["pack", "--out", tarball], packageDir);

// The tarball is what gets published, so assert on *it*, not on the sources:
// `pnpm pack` is the step that rewrites `workspace:*` to a real version, and a
// workspace range surviving into it would be uninstallable for consumers.
const packed = JSON.parse(run("tar", ["xzOf", tarball, "package/package.json"]));
const workspaceDeps = Object.entries({ ...packed.dependencies, ...packed.peerDependencies }).filter(
  ([, range]) => range.startsWith("workspace:"),
);
assert(workspaceDeps.length === 0, `unresolved workspace ranges in the tarball: ${workspaceDeps}`);

const entries = run("tar", ["tzf", tarball]).split("\n");
for (const required of ["package/LICENSE", "package/README.md", "package/CHANGELOG.md"]) {
  assert(entries.includes(required), `${required} is missing from the tarball`);
}

// Workspace dependencies are pinned to exact versions at pack time, so a
// consumer's install breaks unless that version is already on the registry.
for (const [dep, range] of Object.entries(packed.dependencies ?? {})) {
  if (!dep.startsWith("@chainza/")) continue;
  assert(
    publishedVersions(dep).includes(range),
    `${dep}@${range} is not on npm yet — publish it before ${name} (it is pinned in this tarball)`,
  );
}

console.log(`
=> ready to publish ${name}@${version}

   tarball    ${tarball}
   contents   ${entries.length} files
   integrity  ${integrityOf(tarball)}

   1. publish the tarball as-is (an OTP is required if 2FA is on):

        npm publish ${tarball} --access public --otp <code>

   2. record it — verifies npm serves these exact bytes, then pushes the
      ${tag} tag and opens a GitHub Release carrying the tarball, its
      integrity and the reproduction recipe:

        node scripts/release-package.mjs ${key} --record
`);
