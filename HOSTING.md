# Hosting & Releases

The reference UI is a fully static bundle deployed to **IPFS** and named via **ENS**. There is
no production server: resilience comes from redundancy at every layer — multiple independent
pinning services hold the content, the name resolves on-chain, and anyone can re-host a release
from its published CID.

## The five access paths

Every production release is reachable through five independent paths. No single provider,
gateway, or DNS operator can take all of them down.

| #   | Path                   | How                                                                                            | Depends on                     |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | Native ENS resolution  | Open the `.eth` name directly in an ENS-aware browser (Brave, Opera, Status, MetaMask Mobile)  | ENS + any IPFS retrieval       |
| 2   | ENS→IPFS gateways      | `https://<name>.eth.limo`, `.eth.link`, `.eth.sucks`                                           | ENS + the gateway operator     |
| 3   | Direct CID via gateway | `https://<CID>.ipfs.dweb.link/`, `https://ipfs.io/ipfs/<CID>/`, or any other public gateway    | The CID being pinned somewhere |
| 4   | Local IPFS node        | `ipfs://<CID>` in an IPFS-enabled browser, or `ipfs pin add <CID>` + a local gateway           | Nothing but the IPFS network   |
| 5   | Self-hosting           | Anyone pins the CID (or imports the release's CAR file) and serves it from their own node/host | Only the person doing it       |

Each release's CID is published in its GitHub Release notes, so paths 3–5 work even for old
versions and even if the ENS record moves on.

The bundle itself is gateway-proof by construction: assets use relative URLs
(`base: "./"` in [vite.config.ts](apps/website/vite.config.ts)) so it works from any mount
point (`/ipfs/<CID>/…` included), and routing is hash-based (`/#/imprint`) because IPFS
gateways serve static files with no SPA rewrites.

## How a release works

Pushing a `v*` tag runs [release.yml](.github/workflows/release.yml):

1. **Build** — `pnpm turbo run build --filter=website...` with `VITE_WALLETCONNECT_PROJECT_ID`
   from the repo **variable** of the same name (a variable, not a secret: the id is public by
   design — it ships in the bundle — and verifiers need it to reproduce the exact bytes).
2. **Pack** — `ipfs-car` packs `apps/website/dist` into a CAR file and computes the root
   **CID** locally. Packing is deterministic: the same `dist/` always yields the same CID.
3. **Pin** — the CAR is uploaded to **Filebase**, which unpacks it and seeds the content on
   the IPFS network (the step re-reads the CID Filebase computed and fails on mismatch), and
   **Pinata** is asked to pin the CID from the network (completes asynchronously on their
   side), giving a second independent copy. Each pin step activates only when its secrets
   are configured.
4. **Publish** — a GitHub Release is created with the CAR file attached and notes carrying
   the CID, the ENS contenthash value, gateway links, self-pinning instructions and the
   verification recipe.

The workflow does **not** re-run the test suite — only tag commits that are green on CI.

### Releasing (maintainer checklist)

```sh
git tag v0.1.0
git push origin v0.1.0
```

Then:

1. Wait for the **Release** workflow to finish and open the created GitHub Release.
2. Check the pin steps in the workflow log (Pinata's pin lands asynchronously — it can lag
   the workflow by a few minutes).
3. Smoke-test path 3: open `https://<CID>.ipfs.dweb.link/` from the release notes.
4. **Update the ENS contenthash** — copy the `0xe301…` value from the release notes and set
   it as the ENS name's `contenthash` record (e.g. via [app.ens.domains](https://app.ens.domains)
   → the name → Records → Edit → Content Hash). This is a signed on-chain transaction from the
   wallet that owns the name; CI deliberately never holds that key.
5. Smoke-test paths 1–2: open `https://<name>.eth.limo` (gateways pick the new record up
   within minutes).

## Verifying a release

Anyone can check that the deployed content matches the tagged source — no trust in the
maintainers or the pinning services required:

```sh
git checkout <tag>
pnpm install --frozen-lockfile
VITE_WALLETCONNECT_PROJECT_ID=<value from the release notes> pnpm turbo run build --filter=website...
npx ipfs-car@3.1.0 pack apps/website/dist
```

The printed CID must equal the one in the release notes (and the one the ENS contenthash
encodes — `node scripts/ens-contenthash.mjs <CID>` prints the expected record value).
Reproducibility rests on the exact-pinned dependency tree (`pnpm-lock.yaml` +
`--frozen-lockfile`) and the pinned `ipfs-car` version.

## Keeping a release alive (self-pinning)

Any third party can independently keep the app available:

```sh
ipfs pin add <CID>            # fetch + pin from the network
# or, offline, from the CAR attached to the GitHub Release:
ipfs dag import safe-stake-website-<tag>.car
```

Serving that pin through any gateway (or `ipfs daemon`'s local one) is a complete,
independent deployment of the app — it's fully static and talks only to public endpoints
(RPC, the Safenet indexer, GitHub raw, the WalletConnect relay) from the browser.

## One-time setup

Configuration the pipeline expects (all under the repo's **Settings → Secrets and
variables → Actions**):

| Kind     | Name                                                            | Source                                                      |
| -------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| Variable | `VITE_WALLETCONNECT_PROJECT_ID`                                 | WalletConnect Cloud project (public id)                     |
| Secret   | `FILEBASE_ACCESS_KEY`, `FILEBASE_SECRET_KEY`, `FILEBASE_BUCKET` | Filebase account → Access Keys + an IPFS bucket             |
| Secret   | `PINATA_JWT`                                                    | Pinata account → API Keys (JWT with `pinByHash` permission) |

Missing pinning secrets don't break a release — the corresponding pin step is skipped — but
production releases should have both services active. Filebase is the seed (it's the one
that receives the actual bytes), so it's the one a release can't do without; adding a
third pinning service later is a single secret-gated step in the workflow, following the
Pinata pin-by-CID pattern (e.g. 4EVERLAND, which speaks the standard IPFS Pinning Service
API).

Outside the repo:

- **ENS name** — registered and held by an operator wallet; its `contenthash` is updated on
  each release (see the checklist above).
- **WalletConnect Cloud** — the ENS gateway origins (`<name>.eth.limo` etc.) must be on the
  project's allowed-domains list, or WalletConnect connections from those origins may be
  rejected. Injected-wallet connections are unaffected.

## Staging

Staging (Vercel) keeps deploying from `main` independently of this pipeline — see
[apps/website/vercel.json](apps/website/vercel.json). Production is IPFS + ENS only.
