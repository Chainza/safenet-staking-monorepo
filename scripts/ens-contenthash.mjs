#!/usr/bin/env node
// Print the ENS contenthash (ENSIP-7) for a CIDv1 base32 string:
// 0x + varint(ipfs-ns = 0xe3) + raw CID bytes. Zero dependencies (node builtins
// only) so the release workflow — and anyone verifying a release — can run it
// standalone.
//
// Usage: node scripts/ens-contenthash.mjs bafybei...

import assert from "node:assert/strict";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567"; // RFC 4648 base32, lowercase

function base32Decode(input) {
  let bits = 0;
  let value = 0;
  const out = [];
  for (const char of input) {
    const index = ALPHABET.indexOf(char);
    assert(index !== -1, `invalid base32 character: ${char}`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

const cid = process.argv[2];
if (!cid || !cid.startsWith("b")) {
  console.error("usage: ens-contenthash.mjs <CIDv1 base32, e.g. bafybei...>");
  process.exit(1);
}

// "b" is the multibase prefix for lowercase base32; the rest is the CID bytes.
const cidBytes = base32Decode(cid.slice(1));
// 0xe3 (ipfs-ns) as a multicodec varint is the two bytes e3 01.
const contenthash = Uint8Array.from([0xe3, 0x01, ...cidBytes]);
console.log("0x" + Buffer.from(contenthash).toString("hex"));
