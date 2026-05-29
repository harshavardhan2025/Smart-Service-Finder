import { useRef, useEffect } from "react";

/**
 * Reusable React hook to apply a hardware-accelerated 3D Parallax Tilt effect
 * to any card or box container. Updates styles directly via DOM to ensure
 * smooth 60fps movement without triggering React re-renders.
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
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      
      // Calculate rotation angles (tilted proportional to cursor distance from center)
      const angleX = (yc - y) / 12; // Adjust vertical tilt sensitivity
      const angleY = (x - xc) / 12; // Adjust horizontal tilt sensitivity

      // Apply 3D matrix transform
      el.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.03, 1.03, 1.03) translateY(-6px)`;
      el.style.transition = "transform 0.08s ease, box-shadow 0.3s ease";
    };

    const handleMouseLeave = () => {
      // Smooth snap back to default layout when cursor leaves card bounds
      el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(0)`;
      el.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease";
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return ref;
}
