import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api/client.js";

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    api.listResources().then(setResources).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? resources : resources.filter((r) => r.status === filter);

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h2>Rescue Fleets</h2>
          <p className="header-subtitle">All available rescue units, equipment, and personnel.</p>
        </div>
        <select className="select-input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: "200px" }}>
          <option value="ALL">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="ON_SCENE">On scene</option>
          <option value="OUT_OF_SERVICE">Out of service</option>
        </select>
      </div>
      {loading && <p className="muted" style={{ fontFamily: "var(--font-mono)" }}>Loading resources...</p>}

      <motion.div className="section-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Capacity</th>
              <th>Workload</th>
              <th>Organization</th>
            </tr>
          </thead>
          <motion.tbody initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.03 } } }}>
            {filtered.map((r) => {
              const utilPct = r.capacity > 0 ? Math.round((r.current_workload / r.capacity) * 100) : 0;
              return (
                <motion.tr key={r.id} variants={fadeUp} transition={{ duration: 0.25 }}>
                  <td style={{ fontWeight: 600, color: "var(--text)" }}>{r.name}</td>
                  <td><span className="stat-badge-tag">{r.resource_type}</span></td>
                  <td><span className={`status-tag status-${r.status.toLowerCase()}`}>{r.status}</span></td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{r.capacity}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, maxWidth: "80px" }}>
                        <div className="confidence-track" style={{ height: "5px" }}>
                          <div className="confidence-fill" style={{
                            width: `${utilPct}%`,
                            background: utilPct > 80 ? "#f43f5e" : utilPct > 50 ? "#eab308" : "#10b981",
                            boxShadow: "none",
                            transition: "width 0.4s ease",
                          }} />
                        </div>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", minWidth: "30px" }}>{utilPct}%</span>
                    </div>
                  </td>
                  <td className="muted">{r.organization}</td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </motion.div>
    </div>
  );
}
