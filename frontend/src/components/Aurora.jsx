import { motion } from "framer-motion";

/**
 * Ambient deep-space aurora background. Sits behind page content (z -10).
 */
export const Aurora = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#030712]">
      <div className="absolute inset-0 grid-texture opacity-60" />
      <motion.div
        className="aurora-blob"
        style={{ width: 600, height: 600, top: "-12%", left: "-8%", background: "#2563EB" }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="aurora-blob"
        style={{ width: 520, height: 520, top: "20%", right: "-10%", background: "#7C3AED" }}
        animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="aurora-blob"
        style={{ width: 440, height: 440, bottom: "-12%", left: "30%", background: "#06B6D4", opacity: 0.4 }}
        animate={{ x: [0, 40, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030712]/40 to-[#030712]" />
    </div>
  );
};

export default Aurora;
