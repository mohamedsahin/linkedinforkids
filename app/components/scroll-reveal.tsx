"use client";

import { useEffect } from "react";

/**
 * Single mount point for reveal-on-scroll animations. Any element on any
 * page that carries `className="reveal"` (or one of the variants in
 * `globals.css`) will fade + lift into place once it's ~12% in view.
 *
 * Lives in layout.tsx so it survives client-side navigation. A
 * MutationObserver catches elements added after initial paint (e.g. when
 * dashboards stream data in).
 */
export function ScrollReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      // Skip animations entirely — show everything immediately.
      document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)").forEach((el) => {
        el.classList.add("is-visible");
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    function observeAll() {
      document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)").forEach((el) => {
        io.observe(el);
      });
    }

    observeAll();

    // Re-observe when new elements appear (e.g. after route change / data load).
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
