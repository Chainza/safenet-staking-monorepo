// ENS contenthash (ENSIP-7) <-> CIDv1 base32 conversion, shared by the release
// tooling (CID -> record value) and the uptime probe (on-chain record -> CID).
// A contenthash for IPFS is 0x + varint(ipfs-ns = 0xe3) + raw CID bytes.
// Zero dependencies (node builtins only) so verifiers can run the scripts
// standalone.

import assert from "node:assert/strict";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567"; // RFC 4648 base32, lowercase
// 0xe3 (ipfs-ns) as a multicodec varint is the two bytes e3 01.
const IPFS_NS = [0xe3, 0x01];

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

function base32Encode(bytes) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 0x1f];
  return out;
}

export function cidToContenthash(cid) {
  assert(cid.startsWith("b"), `not a CIDv1 base32 string: ${cid}`);
  // "b" is the multibase prefix for lowercase base32; the rest is the CID bytes.
  const contenthash = Uint8Array.from([...IPFS_NS, ...base32Decode(cid.slice(1))]);
  return "0x" + Buffer.from(contenthash).toString("hex");
}

export function contenthashToCid(contenthash) {
  const bytes = Buffer.from(contenthash.replace(/^0x/, ""), "hex");
  assert(
    bytes[0] === IPFS_NS[0] && bytes[1] === IPFS_NS[1],
    `not an IPFS contenthash: ${contenthash}`,
  );
  // CIDv1 starts with its version byte; a CIDv0 (bare multihash) has no
  // base32 form to compare against the release notes.
  assert(bytes[2] === 0x01, `not a CIDv1 contenthash: ${contenthash}`);
  return "b" + base32Encode(bytes.subarray(2));
}
