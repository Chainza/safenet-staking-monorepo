import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackPageview } from "../lib/analytics.js";

/** Tracks a pageview on every route change. Renders nothing; must sit inside
 *  the router. With hash routing, `pathname` is the route after `#`. */
export function PageviewTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPageview(pathname);
  }, [pathname]);

  return null;
}
