import { motion } from "framer-motion";

/**
 * The signature Luminora AI Orb — a living, glowing sphere.
 * Reused as the hero visual and as the floating assistant button.
 */
export const AIOrb = ({ size = 160, active = false }) => {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* outer glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          background:
            "conic-gradient(from 0deg, #2563EB, #7C3AED, #06B6D4, #2563EB)",
          filter: "blur(14px)",
          opacity: 0.55,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      {/* core */}
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: size * 0.82,
          height: size * 0.82,
          animation: "orb-pulse 4s ease-in-out infinite",
          background:
            "radial-gradient(circle at 32% 28%, #93c5fd 0%, #2563EB 35%, #4c1d95 70%, #06070f 100%)",
        }}
        animate={{ scale: active ? [1, 1.06, 1] : [1, 1.02, 1] }}
        transition={{ duration: active ? 1.4 : 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* glossy highlight */}
        <div
          className="absolute rounded-full"
          style={{
            width: "40%",
            height: "30%",
            top: "14%",
            left: "20%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.85), rgba(255,255,255,0))",
            filter: "blur(4px)",
          }}
        />
        {/* internal swirl */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 180deg, transparent, rgba(6,182,212,0.45), transparent 60%)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </div>
  );
};

/**
 * Fixed floating orb button — present across the app, opens the AI Tutor.
 */
export const FloatingOrb = ({ onClick }) => {
  return (
    <motion.button
      data-testid="floating-ai-orb"
      onClick={onClick}
      className="fixed bottom-24 right-5 z-50 md:bottom-8 md:right-8"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
      transition={{
        scale: { duration: 0.4 },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Open AI Tutor"
    >
      <AIOrb size={64} active />
    </motion.button>
  );
};

export default AIOrb;
