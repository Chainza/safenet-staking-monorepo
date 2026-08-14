import axios from "axios";

/** Requests are cheap JSON reads off a CDN; fail fast rather than hang a panel. */
const TIMEOUT_MS = 10_000;

/**
 * The widget's HTTP client for its off-chain reads (the validator registry and
 * reward proofs).
 *
 * A dedicated `axios.create()` instance, not the default export: the widget is a
 * library, so it must not inherit (or contribute to) a host app's global axios
 * defaults and interceptors. Apps consuming the widget — the website included —
 * can keep using `axios` directly.
 */
export const http = axios.create({ timeout: TIMEOUT_MS });
