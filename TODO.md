# TODO

## Planned

- [ ] **Sanctions screening — countries** _(optional, clarifications needed)._ Disable
      the UI for users in sanctioned countries (likely geo-IP based; needs a decision on
      data source, country list, and where enforcement lives — widget vs. website).
- [ ] **Safe multisig — refresh after a later execution.** A `proposed` Safe tx isn't
      tracked, so once the other owners execute it the widget's reads stay stale until a
      reload. Preferred fix: keep the proposal in the store and check its
      `wallet_getCallsStatus` once per panel mount / Safe App focus (no timers), then
      invalidate the moved reads and clear the notice.
- [ ] **Safe via WalletConnect.** A Safe connected from Safe{Wallet} over WalletConnect
      (not as a Safe App) also returns `safeTxHash`es, but only the `safe` connector is
      detected, so writes wait on a receipt that never comes. Needs a detection signal
      (e.g. the connected account is a Safe contract) and a check that Safe{Wallet}'s
      WalletConnect bridge supports `wallet_sendCalls`.
