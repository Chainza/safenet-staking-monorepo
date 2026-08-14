#!/usr/bin/env node
// Record the ENS contenthash-update transaction in a GitHub Release's notes.
// The Release workflow publishes the notes with an "ENS update tx: pending"
// placeholder (the owner signs the ENS update manually, after the release is
// cut, so CI can't know the hash); this script swaps the placeholder for an
// Etherscan link. Zero dependencies beyond the `gh` CLI (authenticated).
//
// Usage: node scripts/record-ens-tx.mjs <tag> <txhash>
//    e.g node scripts/record-ens-tx.mjs v0.1.0 0xabc...def

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const [tag, txHash] = process.argv.slice(2);
if (!tag || !txHash) {
  console.error("usage: record-ens-tx.mjs <tag> <txhash>");
  process.exit(1);
}
assert(/^0x[0-9a-fA-F]{64}$/.test(txHash), `not a transaction hash: ${txHash}`);

const body = execFileSync("gh", ["release", "view", tag, "--json", "body", "--jq", ".body"], {
  encoding: "utf8",
});

const placeholder = /\| \*\*ENS update tx\*\* \| _pending[^|]*\|/;
assert(
  placeholder.test(body),
  `no pending ENS-update placeholder in the ${tag} release notes — already recorded, or a release from before the placeholder existed`,
);

const updated = body.replace(
  placeholder,
  `| **ENS update tx** | https://etherscan.io/tx/${txHash} |`,
);
execFileSync("gh", ["release", "edit", tag, "--notes", updated], { stdio: "inherit" });
console.log(`recorded ${txHash} in the ${tag} release notes`);
