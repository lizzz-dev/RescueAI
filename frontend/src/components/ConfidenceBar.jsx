import React from "react";
import { motion } from "framer-motion";

export default function ConfidenceBar({ label, value }) {
  const pct = Math.round((value ?? 0) * 100);

  return (
    <div className="confidence-row">
      <div className="confidence-label">
        <span>{label}</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {pct}%
        </motion.span>
      </div>
      <div className="confidence-track">
        <motion.div
          className="confidence-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </div>
    </div>
  );
}
