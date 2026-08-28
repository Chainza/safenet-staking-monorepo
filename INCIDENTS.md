# Incident log

Public availability record for the production deployment of the Safenet
staking interface (`safenetstake.eth`, served over IPFS + ENS).

## How availability is monitored

- The [`Uptime` workflow](.github/workflows/uptime.yml) probes the canonical
  gateway (`https://safenetstake.eth.limo/`) **and** an independent fallback
  path (`https://safenetstake.eth.sucks/`) every 30 minutes, asserting an
  HTTP 200 that actually serves the built app (the page `<title>`), with three
  retries 30 seconds apart so transient blips don't count.
- The workflow's
  [run history](https://github.com/Chainza/safenet-staking-monorepo/actions/workflows/uptime.yml)
  is the raw evidence trail; a sustained failure automatically opens a GitHub
  issue labeled
  [`incident`](https://github.com/Chainza/safenet-staking-monorepo/issues?q=label%3Aincident)
  (one at a time — no duplicates while an incident is open).
- Because the bundle is content-addressed on IPFS, users always have further
  access paths independent of any single gateway — see
  [HOSTING.md](HOSTING.md) for all four.

## How incidents are recorded

When an incident issue is closed, a row is added here summarizing it: when it
started and ended (UTC), which access paths were affected, user impact, root
cause, and resolution. The issue stays linked as the detailed record.

## Incidents

_None to date._

| Started (UTC) | Resolved (UTC) | Affected path(s) | Impact | Root cause | Resolution / issue |
| ------------- | -------------- | ---------------- | ------ | ---------- | ------------------ |
