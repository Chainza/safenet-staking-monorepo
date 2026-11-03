#!/usr/bin/env node
// Print the IPFS CID that safenetstake.eth's ENS contenthash record points at,
// read straight from mainnet (registry -> resolver -> contenthash) rather than
// through an eth.limo-style gateway, so the uptime probe's fallback path shares
// nothing with the primary one. Zero dependencies (node builtins only): the
// name's namehash and the two selectors are precomputed constants.
//
// Usage: node scripts/ens-cid.mjs

import assert from "node:assert/strict";
import { contenthashToCid } from "./lib/contenthash.mjs";

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
// namehash("safenetstake.eth") — viem's `namehash` produces the same value.
const NODE = "1d67087c64b70a51ab8ad8a4e1038e9b5bb177ad83ef9f907be12c43ed4bc4d0";
const RESOLVER_SELECTOR = "0x0178b8bf"; // resolver(bytes32)
const CONTENTHASH_SELECTOR = "0xbc1c58d1"; // contenthash(bytes32)
// Several public RPCs, first answer wins, so one provider's outage doesn't
// read as the site being down.
const RPC_URLS = [
  "https://eth.blockrazor.xyz",
  "https://ethereum-rpc.publicnode.com",
  "https://eth.drpc.org",
];

async function ethCall(to, data) {
  const errors = [];
  for (const url of RPC_URLS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [{ to, data }, "latest"],
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const body = await response.json();
      assert(typeof body.result === "string", JSON.stringify(body.error ?? body));
      return body.result;
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }
  throw new Error(`eth_call failed on every RPC:\n${errors.join("\n")}`);
}

const resolverWord = await ethCall(ENS_REGISTRY, RESOLVER_SELECTOR + NODE);
const resolver = "0x" + resolverWord.slice(-40);
assert(!/^0x0{40}$/.test(resolver), "safenetstake.eth has no resolver set");

// ABI-encoded `bytes`: a 32-byte offset, a 32-byte length, then the data.
const encoded = (await ethCall(resolver, CONTENTHASH_SELECTOR + NODE)).slice(2);
const length = parseInt(encoded.slice(64, 128), 16);
assert(length > 0, "safenetstake.eth has no contenthash record");
console.log(contenthashToCid(encoded.slice(128, 128 + length * 2)));
