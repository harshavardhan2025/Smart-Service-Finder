import { useRef, useEffect } from "react";

/**
 * Reusable React hook to apply a premium, hardware-accelerated Vercel-Style
 * Spotlight Border & Background Glow + Ambient Float effect to any card container.
 * Updates styles directly via DOM to ensure fluid 60fps interaction without React re-renders.
 */
export function use3dTilt() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Save original styles to restore them perfectly on leave
    const originalTransition = el.style.transition;
    const originalTransform = el.style.transform;
    const originalBorderColor = el.style.borderColor;

    // Apply baseline transition rules on mount
    el.style.transition = "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.4s ease, background 0.15s ease";

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Determine glow color based on dark/light mode
      const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";
      const spotlightColor = isDarkMode 
        ? "radial-gradient(circle 280px at " + x + "px " + y + "px, rgba(99, 102, 241, 0.15), var(--bg-card))" // Indigo spotlight in dark mode
        : "radial-gradient(circle 280px at " + x + "px " + y + "px, rgba(99, 102, 241, 0.08), var(--bg-card))"; // Subtle spotlight in light mode

      // Apply dynamic background gradient spotlight and float up in 3D space
      el.style.background = spotlightColor;
      el.style.borderColor = "var(--primary)";
      el.style.transform = "translateY(-6px) scale3d(1.02, 1.02, 1.02)";
      el.style.boxShadow = isDarkMode
        ? "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 15px -3px rgba(99, 102, 241, 0.15)"
        : "0 20px 30px -10px rgba(99, 102, 241, 0.12), 0 4px 6px -2px rgba(99, 102, 241, 0.05)";
    };

    const handleMouseLeave = () => {
      // Restores the baseline styles smoothly
      el.style.background = "var(--bg-card)";
      el.style.borderColor = originalBorderColor || "var(--border)";
      el.style.transform = originalTransform || "translateY(0) scale3d(1, 1, 1)";
      el.style.boxShadow = "none";
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      // Restore styles on unmount
      if (el) {
        el.style.transition = originalTransition;
        el.style.transform = originalTransform;
        el.style.borderColor = originalBorderColor;
        el.style.background = "";
        el.style.boxShadow = "";
      }
    };
  }, []);

  return ref;
}
