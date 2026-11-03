#!/usr/bin/env node
// Print the ENS contenthash (ENSIP-7) for a CIDv1 base32 string:
// 0x + varint(ipfs-ns = 0xe3) + raw CID bytes. Zero dependencies (node builtins
// only) so the release workflow — and anyone verifying a release — can run it
// standalone.
//
// Usage: node scripts/ens-contenthash.mjs bafybei...

import { cidToContenthash } from "./lib/contenthash.mjs";

const cid = process.argv[2];
if (!cid || !cid.startsWith("b")) {
  console.error("usage: ens-contenthash.mjs <CIDv1 base32, e.g. bafybei...>");
  process.exit(1);
}

console.log(cidToContenthash(cid));
