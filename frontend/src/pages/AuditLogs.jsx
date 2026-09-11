import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Search, Eye, CheckCircle2, XCircle, RotateCcw, Zap } from "lucide-react";
import { api } from "../api/client.js";

const ACTION_CONFIG = {
  CREATE_INCIDENT: { icon: Plus, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
  ADD_REPORT: { icon: FileText, color: "#6384ff", bg: "rgba(99, 132, 255, 0.1)" },
  ANALYZE_INCIDENT: { icon: Search, color: "#22d3ee", bg: "rgba(34, 211, 238, 0.1)" },
  APPROVE_RESPONSE: { icon: CheckCircle2, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
  REJECT_RESPONSE: { icon: XCircle, color: "#f43f5e", bg: "rgba(244, 63, 94, 0.1)" },
  RESOLVE_INCIDENT: { icon: RotateCcw, color: "#a5b4fc", bg: "rgba(165, 180, 252, 0.1)" },
  LOAD_DEMO: { icon: Zap, color: "#f97316", bg: "rgba(249, 115, 22, 0.1)" },
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listAuditLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h2>Audit Ledger</h2>
          <p className="header-subtitle">Complete chain-of-custody log for every system action and decision.</p>
        </div>
      </div>
      {loading && <p className="muted" style={{ fontFamily: "var(--font-mono)" }}>Loading audit trail...</p>}

      <motion.div
        className="section-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {logs.length === 0 && !loading && (
          <p className="muted" style={{ textAlign: "center", padding: "32px" }}>No audit events yet.</p>
        )}

        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.03 } } }}
          style={{ display: "flex", flexDirection: "column", gap: "6px" }}
        >
          {logs.map((l) => {
            const cfg = ACTION_CONFIG[l.action] || { icon: Eye, color: "#64748b", bg: "rgba(100,116,139,0.1)" };
            const ActionIcon = cfg.icon;
            return (
              <motion.div
                key={l.id}
                variants={{ initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(15, 23, 42, 0.3)",
                  border: "1px solid var(--panel-border)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(15, 23, 42, 0.5)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(15, 23, 42, 0.3)"}
              >
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: cfg.bg, border: `1px solid ${cfg.color}22`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <ActionIcon size={15} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span className="audit-action">{l.action}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" }}>
                      by {l.actor}
                    </span>
                    {l.incident_id && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#22d3ee", background: "rgba(34,211,238,0.08)", padding: "1px 6px", borderRadius: "3px" }}>
                        #{l.incident_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  {l.details && Object.keys(l.details).length > 0 && (
                    <details style={{ marginTop: "6px" }}>
                      <summary style={{ fontSize: "11px", color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
                        Details
                      </summary>
                      <pre style={{
                        fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)",
                        background: "rgba(10, 15, 30, 0.5)", padding: "8px 10px", borderRadius: "6px",
                        marginTop: "6px", overflow: "auto", maxHeight: "120px",
                        border: "1px solid var(--panel-border)",
                      }}>
                        {JSON.stringify(l.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted-dim)", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {new Date(l.created_at).toLocaleTimeString()}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
