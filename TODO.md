# TODO

## Planned

- [x] **Sanctions screening — wallet addresses.** Disable the UI for wallet addresses
      flagged by the Chainalysis on-chain sanctions oracle (`SanctionsList` at
      `0x40C57923924B5c5c5455c48D93317139ADDaC8fb` on mainnet, `isSanctioned(address)`).
      _Done: core `sanctions.isSanctioned` + widget `useIsSanctioned`; a flagged wallet's
      action panels are replaced by a blocking `SanctionedNotice`._
- [ ] **Sanctions screening — countries** _(optional, clarifications needed)._ Disable
      the UI for users in sanctioned countries (likely geo-IP based; needs a decision on
      data source, country list, and where enforcement lives — widget vs. website).
- [x] **Staking risks disclosure panel.** Surface the risks of staking (slashing,
      unbonding delay, smart-contract risk) in the widget/website UI.
      _Done: `RisksDisclosure` collapsible in the widget (four risks sourced from
      docs.safefoundation.org/safenet/staking/risk, live withdraw delay) + a
      "Staking Risks" link in the website footer._
- [x] **Legal pages.** Operator identity, terms of service, imprint, privacy policy —
      plus links to them in the website `Footer`.
      _Done: `/imprint` (LLC "CHAINZA" operator identity), `/terms` (Ukrainian governing
      law), `/privacy` (names every third party the browser talks to) — all linked from
      the Footer. Contact: connect@chainza.io + chainza.io._
- [x] **React Compiler** for both the website and the widget (memoization is
      deferred to it by convention — no manual `useMemo`/`useCallback`).
      _Done: the website via `@vitejs/plugin-react`'s `reactCompilerPreset()` +
      `@rolldown/plugin-babel`, the widget via a Babel `onLoad` esbuild plugin in
      `tsup.config.ts`. `@babel/core` is pinned to 7.x (8 makes the compiler bail on
      destructuring defaults) and inline bigint literals were moved to `lib/bigint.ts`
      (`ZERO`) — another silent bailout. 75 components/hooks compile, zero bailouts._
- [ ] **Publish `core` and `widget` packages** to npm (final package names/scope still
      TBD — current names are placeholders).
- [ ] **Prod deployment: IPFS + ENS.** _In progress: the bundle is gateway-proof (relative
      base + hash routing), the tag-triggered release workflow (CAR + CID + pinning +
      verifiable GitHub Releases) is in place, and the process is documented in
      `HOSTING.md`, and the pipeline is proven end-to-end (test release `v0.0.1`:
      Filebase + 4EVERLAND pinned, CID publicly resolvable, reproducible across machines).
      Remaining: ENS name registration + per-release contenthash updates, WalletConnect
      allowed origins._

## Nice to have

- [ ] Replace `fetch` with `axios` in the widget.
- [ ] Replace `throw new Error(...)` with `assert` everywhere across the repo.
