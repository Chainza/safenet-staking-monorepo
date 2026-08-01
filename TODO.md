# TODO

## Planned

- [ ] **Sanctions screening — wallet addresses.** Disable the UI for wallet addresses
      flagged by the Chainalysis on-chain sanctions oracle (`SanctionsList` at
      `0x40C57923924B5c5c5455c48D93317139ADDaC8fb` on mainnet, `isSanctioned(address)`).
- [ ] **Sanctions screening — countries** _(optional, clarifications needed)._ Disable
      the UI for users in sanctioned countries (likely geo-IP based; needs a decision on
      data source, country list, and where enforcement lives — widget vs. website).
- [ ] **Staking risks disclosure panel.** Surface the risks of staking (slashing,
      unbonding delay, smart-contract risk) in the widget/website UI.
- [ ] **Legal pages.** Operator identity, terms of service, imprint, privacy policy —
      plus links to them in the website `Footer`.
- [ ] **React Compiler** for both the website and the widget (memoization is currently
      deferred to it by convention — no manual `useMemo`/`useCallback`).
- [ ] **Publish `core` and `widget` packages** to npm (final package names/scope still
      TBD — current names are placeholders).
- [ ] **Prod deployment: IPFS + ENS.**

## Nice to have

- [ ] Replace `fetch` with `axios` in the widget.
- [ ] Replace `throw new Error(...)` with `assert` everywhere across the repo.
