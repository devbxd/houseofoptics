"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISIT_SESSION_KEY = "house-of-optics-visited";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  // Counted once per browser tab session (not once per page navigated to),
  // so "site visits" on the dashboard means an actual visit, not a page
  // count that inflates every time someone clicks around the site.
  useEffect(() => {
    if (sessionStorage.getItem(VISIT_SESSION_KEY)) return;
    sessionStorage.setItem(VISIT_SESSION_KEY, "1");
    fetch("/api/track-visit", { method: "POST", keepalive: true }).catch(() => {});
  }, []);

  return null;
}
