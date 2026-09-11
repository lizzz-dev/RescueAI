import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Radio, Zap } from "lucide-react";
import { api } from "../api/client.js";

export default function Notifications() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listNotifications().then(setNotes).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h2>Comms & Alerts</h2>
          <p className="header-subtitle">System notifications and communication log.</p>
        </div>
      </div>
      {loading && <p className="muted" style={{ fontFamily: "var(--font-mono)" }}>Loading notifications...</p>}

      {notes.length === 0 && !loading && (
        <motion.div
          className="section-card center-cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Bell size={40} color="#64748b" />
          </motion.div>
          <p className="muted" style={{ marginTop: "12px" }}>No notifications yet. Run a demo scenario to generate alerts.</p>
        </motion.div>
      )}

      <motion.div
        className="notification-list"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
      >
        {notes.map((n) => (
          <motion.div
            key={n.id}
            className="section-card"
            style={{
              padding: "16px 20px",
              marginBottom: "10px",
              borderLeft: `3px solid ${n.is_simulated ? "#22d3ee" : "#f97316"}`,
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
            variants={{
              initial: { opacity: 0, x: -16 },
              animate: { opacity: 1, x: 0 },
            }}
            transition={{ duration: 0.3 }}
          >
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: n.is_simulated ? "rgba(34, 211, 238, 0.1)" : "rgba(249, 115, 22, 0.1)",
              border: `1px solid ${n.is_simulated ? "rgba(34, 211, 238, 0.2)" : "rgba(249, 115, 22, 0.2)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {n.is_simulated ? <Radio size={15} color="#22d3ee" /> : <Zap size={15} color="#f97316" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span className="stat-badge-tag" style={{
                  background: n.is_simulated ? "rgba(34, 211, 238, 0.1)" : "rgba(249, 115, 22, 0.1)",
                  color: n.is_simulated ? "#22d3ee" : "#f97316",
                  borderColor: n.is_simulated ? "rgba(34, 211, 238, 0.2)" : "rgba(249, 115, 22, 0.2)",
                }}>
                  {n.is_simulated ? "SIMULATED" : "LIVE"}
                </span>
                <span className="muted" style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {n.message}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
