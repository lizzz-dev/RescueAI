import React from "react";
import { motion } from "framer-motion";

const SEVERITY_STYLES = {
  CRITICAL: { bg: "rgba(244, 63, 94, 0.12)", color: "#fb7185", border: "rgba(244, 63, 94, 0.25)", glow: true },
  HIGH: { bg: "rgba(249, 115, 22, 0.12)", color: "#fb923c", border: "rgba(249, 115, 22, 0.25)", glow: false },
  MEDIUM: { bg: "rgba(234, 179, 8, 0.12)", color: "#facc15", border: "rgba(234, 179, 8, 0.25)", glow: false },
  LOW: { bg: "rgba(16, 185, 129, 0.12)", color: "#34d399", border: "rgba(16, 185, 129, 0.25)", glow: false },
};

export default function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.MEDIUM;

  return (
    <motion.span
      className="badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        boxShadow: s.glow ? `0 0 12px ${s.border}` : "none",
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span className={`badge-dot ${s.glow ? "badge-pulse" : ""}`} />
      {severity || "UNASSESSED"}
    </motion.span>
  );
}
