import axios from "axios";
import { INDEXER_API_URL } from "./indexer.js";

// document.referrer stays the external referrer for the whole page load, so
// it's sent with the first pageview only — later in-app navigations would
// otherwise all be attributed to it.
let referrerSent = false;

/** Records one pageview with the Safenet indexer (`POST /pageviews`).
 *  Production builds only, so local development doesn't skew the counts.
 *  Fire-and-forget: failures are swallowed — analytics must never surface as
 *  a UI error or block anything. */
export function trackPageview(path: string): void {
  if (!import.meta.env.PROD) return;

  const referrer = referrerSent ? "" : document.referrer;
  referrerSent = true;

  axios
    .post(`${INDEXER_API_URL}/pageviews`, { hostname: window.location.hostname, path, referrer })
    .catch(() => {});
}
