import { useRef, useEffect } from "react";

/**
 * Reusable React hook to apply a premium 3D tilt rotation and Vercel-style Spotlight Glow
 * to any card container. Features ultra-smooth CSS transitions for a fluid, natural feel.
 */
export function use3dTilt() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Apply baseline styles to enable 3D perspective and transitions
    el.style.transition = "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.4s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.4s cubic-bezier(0.25, 1, 0.5, 1)";
    el.style.transformStyle = "preserve-3d";
    el.style.perspective = "1000px";

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - height / 2;

      // Calculate tilt angles (limit to 5.5 degrees for premium stability during interactions)
      const tiltX = -(y / (height / 2)) * 5.5;
      const tiltY = (x / (width / 2)) * 5.5;

      const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";
      const spotlightColor = isDarkMode
        ? `radial-gradient(circle 350px at ${e.clientX - rect.left}px ${e.clientY - rect.top}px, rgba(99, 102, 241, 0.12), var(--bg-card))`
        : `radial-gradient(circle 350px at ${e.clientX - rect.left}px ${e.clientY - rect.top}px, rgba(79, 70, 229, 0.06), var(--bg-card))`;

      el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.015, 1.015, 1.015)`;
      el.style.background = spotlightColor;
      el.style.borderColor = "var(--primary)";
      el.style.boxShadow = isDarkMode
        ? "0 20px 40px -10px rgba(0,0,0,0.6), 0 0 20px -2px rgba(99,102,241,0.25)"
        : "0 20px 30px -8px rgba(79, 70, 229, 0.12), 0 8px 16px -8px rgba(0, 0, 0, 0.05)";
    };

    const handleMouseLeave = () => {
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
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
        el.style.transform = "";
        el.style.background = "";
        el.style.borderColor = "";
        el.style.boxShadow = "";
        el.style.transition = "";
      }
    };
  }, []);

  return ref;
}
