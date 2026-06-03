import { useRef, useEffect } from "react";

/**
 * Reusable React hook to apply a Vercel-style Spotlight Border & Background Glow
 * to any card container. Uses ONLY background gradient + border glow changes —
 * NO translateY / scale transforms so the card stays perfectly still while
 * the user is filling form fields inside it.
 */
export function use3dTilt() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";
      const spotlightColor = isDarkMode
        ? `radial-gradient(circle 300px at ${x}px ${y}px, rgba(194, 167, 141, 0.12), var(--bg-card))`
        : `radial-gradient(circle 300px at ${x}px ${y}px, rgba(107, 79, 79, 0.07), var(--bg-card))`;

      el.style.background = spotlightColor;
      el.style.borderColor = "var(--primary)";
      el.style.boxShadow = isDarkMode
        ? "0 8px 32px -8px rgba(0,0,0,0.5), 0 0 12px -2px rgba(194,167,141,0.12)"
        : "0 8px 24px -6px rgba(107,79,79,0.12)";
    };

    const handleMouseLeave = () => {
      el.style.background = "var(--bg-card)";
      el.style.borderColor = "";
      el.style.boxShadow = "";
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      if (el) {
        el.style.background = "";
        el.style.borderColor = "";
        el.style.boxShadow = "";
      }
    };
  }, []);

  return ref;
}
