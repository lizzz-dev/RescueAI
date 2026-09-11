import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

function AnimatedCount({ value }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const target = typeof value === "number" ? value : parseInt(value, 10) || 0;
    if (target === 0) { setDisplay(0); return; }

    let start = 0;
    const duration = 800;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };

    ref.current = requestAnimationFrame(animate);
    return () => ref.current && cancelAnimationFrame(ref.current);
  }, [value]);

  return <>{display}</>;
}

export default function StatCard({ label, value, accent = "#6384ff", icon: Icon, tag, index = 0 }) {
  return (
    <motion.div
      className="stat-card"
      style={{ "--card-accent": accent }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="stat-top-row">
        {Icon ? (
          <div className="stat-icon-wrapper" style={{ color: accent, background: `${accent}15`, borderColor: `${accent}25` }}>
            <Icon size={18} />
          </div>
        ) : (
          <div className="stat-icon-wrapper" style={{ color: accent, background: `${accent}15`, borderColor: `${accent}25` }}>
            <span style={{ fontSize: "14px" }}>●</span>
          </div>
        )}
        {tag && <span className="stat-badge-tag">{tag}</span>}
      </div>
      <div>
        <div className="stat-value">
          <AnimatedCount value={value} />
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </motion.div>
  );
}
