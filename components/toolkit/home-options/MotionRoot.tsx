"use client";

// Survey Toolkit (beta test): the frame the animated pages run in (home-options.css). Sections
// with .ho-reveal fade and slide in as they come into view (at once with reduced motion), and the
// looping animations pause while the tab is hidden or when [paused].
import { useEffect, useRef, useState, type ReactNode } from "react";
import "./home-options.css";

export default function MotionRoot({
  children,
  className = "",
  paused = false,
  revealKey,
}: {
  children: ReactNode;
  className?: string;
  paused?: boolean;
  /** Changes when new sections appear (another option shown), so they are watched too */
  revealKey?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.classList.add("ho-js");
    const items = Array.from(el.querySelectorAll<HTMLElement>(".ho-reveal:not(.ho-in)"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("ho-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("ho-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, [revealKey]);

  return (
    <div ref={root} className={`ho-root ${className}`} data-paused={paused || hidden ? "true" : "false"}>
      {children}
    </div>
  );
}
