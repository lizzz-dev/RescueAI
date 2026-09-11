import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { api } from "../api/client.js";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listHospitals().then(setHospitals).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h2>Trauma & ICU</h2>
          <p className="header-subtitle">Real-time hospital capacity and bed availability.</p>
        </div>
      </div>
      {loading && <p className="muted" style={{ fontFamily: "var(--font-mono)" }}>Loading hospital data...</p>}
      <motion.div
        className="hospital-grid"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
      >
        {hospitals.map((h) => {
          const total = h.emergency_beds + h.icu_beds;
          const loadPct = total ? Math.round((h.current_load / total) * 100) : 0;
          const loadColor = loadPct > 80 ? "#f43f5e" : loadPct > 50 ? "#eab308" : "#10b981";
          return (
            <motion.div
              className="hospital-card"
              key={h.id}
              variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.35 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="hospital-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "6px",
                    background: "rgba(236, 72, 153, 0.1)", border: "1px solid rgba(236, 72, 153, 0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Building2 size={14} color="#ec4899" />
                  </div>
                  <h4>{h.name}</h4>
                </div>
                <span className={`status-tag status-${h.status.toLowerCase()}`}>{h.status}</span>
              </div>
              <div className="hospital-stats">
                <div><span className="muted" style={{ fontSize: "11px" }}>ER Beds</span><div style={{ fontWeight: 700, color: "var(--text)" }}>{h.emergency_beds}</div></div>
                <div><span className="muted" style={{ fontSize: "11px" }}>ICU Beds</span><div style={{ fontWeight: 700, color: "var(--text)" }}>{h.icu_beds}</div></div>
                <div><span className="muted" style={{ fontSize: "11px" }}>Trauma Cap</span><div style={{ fontWeight: 700, color: "var(--text)" }}>{h.trauma_capacity}</div></div>
              </div>
              <div className="confidence-track" style={{ marginTop: 12 }}>
                <motion.div
                  className="confidence-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadPct}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  style={{ backgroundColor: loadColor, boxShadow: `0 0 8px ${loadColor}50` }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                <span className="muted" style={{ fontSize: "11.5px" }}>{loadPct}% current load</span>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: loadColor, fontWeight: 600 }}>
                  {loadPct > 80 ? "CRITICAL" : loadPct > 50 ? "MODERATE" : "NOMINAL"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
