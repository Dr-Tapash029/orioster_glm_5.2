"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export function DynamicBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return <div className="fixed inset-0 -z-50 bg-neutral-50 dark:bg-[#090514]" />;

  const isDark = resolvedTheme === "dark";

  return (
    <div className="pointer-events-none fixed inset-0 -z-50 overflow-hidden bg-neutral-50 transition-colors duration-700 ease-in-out dark:bg-[#090514]">
      {/* Ambient Glow Orb 1 */}
      <motion.div
        className="absolute -top-[20%] -left-[10%] h-[60vw] w-[60vw] rounded-full opacity-40 blur-[120px] will-change-transform mix-blend-screen dark:opacity-30"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(76,29,149,0) 70%)" // Dark Purple / Violet
            : "radial-gradient(circle, rgba(203,213,225,0.6) 0%, rgba(241,245,249,0) 70%)", // Light Metallic Platinum
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Ambient Glow Orb 2 */}
      <motion.div
        className="absolute -bottom-[20%] -right-[10%] h-[50vw] w-[50vw] rounded-full opacity-35 blur-[100px] will-change-transform mix-blend-screen dark:opacity-25"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(192,132,252,0.4) 0%, rgba(124,58,237,0) 70%)" // Dark Violet / Magenta trace
            : "radial-gradient(circle, rgba(148,163,184,0.4) 0%, rgba(248,250,252,0) 70%)", // Light Slate Metallic
        }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -40, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle Micro-Texture Overlay (Optional Grid/Grain for Depth) */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
