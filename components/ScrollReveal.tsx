"use client";

import { useEffect, useRef } from "react";

export function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    function observeNew() {
      el!.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)").forEach((item) => observer.observe(item));
    }

    observeNew();

    // Client-side navigation (pagination, switching category/brand) re-uses
    // this same ScrollReveal instance and just swaps its children — it
    // doesn't remount the component, so this effect (which only ran once,
    // at mount) never saw the new cards and they stayed at opacity:0
    // forever. Watching for DOM insertions catches every later page/list
    // swap too, not just the first render.
    const mutationObserver = new MutationObserver(observeNew);
    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
