#!/usr/bin/env node
// Check that a CID serves the built website on the public IPFS network: one
// pass over several gateways, first hit wins, and the body must be the built
// page (its <title>), not just a 200. Shared by the release workflow (waiting
// for a fresh pin to propagate) and the uptime probe (the ENS-independent
// fallback path). ipfs.io/dweb.link are deliberately absent: they moved to a
// browser-only service-worker gateway, so a non-browser client gets a 429 or a
// notice page, never the content. Zero dependencies (node builtins only).
//
// Usage: node scripts/probe-cid.mjs <CID>   (exit 0 = served, 1 = not)

const TITLE = "<title>SAFE Staking</title>";

const cid = process.argv[2];
if (!cid) {
  console.error("usage: probe-cid.mjs <CID>");
  process.exit(1);
}

const gateways = [`https://ipfs.filebase.io/ipfs/${cid}/`, `https://${cid}.ipfs.4everland.io/`];

for (const url of gateways) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (response.ok && (await response.text()).includes(TITLE)) {
      console.log(`OK: ${cid} serves the app (${url})`);
      process.exit(0);
    }
    console.log(`miss: ${url} (HTTP ${response.status})`);
  } catch (error) {
    console.log(`miss: ${url} (${error.message})`);
  }
}
process.exit(1);
