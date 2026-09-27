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
