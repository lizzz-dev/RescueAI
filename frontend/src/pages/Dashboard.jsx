import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  AlertTriangle,
  Radio,
  Cpu,
  HeartPulse,
  Users,
  Flame,
  CheckCircle2,
  Play,
  ArrowRight,
  Shield,
  Clock,
  MapPin,
} from "lucide-react";
import { api } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import SeverityBadge from "../components/SeverityBadge.jsx";

const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function Dashboard({ onOpenIncident, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, incidents] = await Promise.all([api.dashboardStats(), api.listIncidents()]);
      setStats(s);
      setRecentIncidents(incidents.slice(0, 8));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await api.loadDemoScenario();
      await load();
      onOpenIncident(res.incident_id);
    } catch (e) {
      setError(e.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h2>Emergency Operations Command</h2>
          <p className="header-subtitle">
            Autonomous multi-agent intake, situation triage, and human-authorized resource dispatch.
          </p>
        </div>
        <motion.button
          className="btn btn-primary"
          onClick={runDemo}
          disabled={demoLoading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          animate={!demoLoading ? { boxShadow: ["0 0 20px rgba(99, 102, 241, 0.3)", "0 0 30px rgba(99, 102, 241, 0.5)", "0 0 20px rgba(99, 102, 241, 0.3)"] } : {}}
          transition={!demoLoading ? { boxShadow: { duration: 2, repeat: Infinity } } : {}}
        >
          <Play size={16} fill="currentColor" />
          {demoLoading ? "Initializing Simulation..." : "Load Live Demo Crisis"}
        </motion.button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && (
        <p className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
          Connecting to telemetry stream...
        </p>
      )}

      {stats && (
        <motion.div className="stat-grid" variants={stagger} initial="initial" animate="animate">
          <StatCard label="Active Incidents" value={stats.active_incidents} accent="#6384ff" icon={Radio} tag="MONITORED" index={0} />
          <StatCard label="Critical Incidents" value={stats.critical_incidents} accent="#f43f5e" icon={AlertOctagon} tag={stats.critical_incidents > 0 ? "URGENT" : "NOMINAL"} index={1} />
          <StatCard label="High Priority" value={stats.high_incidents} accent="#f97316" icon={AlertTriangle} tag="ELEVATED" index={2} />
          <StatCard label="Pending AI Approvals" value={stats.pending_approvals} accent="#eab308" icon={Cpu} tag="HITL QUEUE" index={3} />
          <StatCard label="Ambulances Ready" value={stats.ambulances_available} accent="#38bdf8" icon={HeartPulse} tag="STANDBY" index={4} />
          <StatCard label="SAR Teams Ready" value={stats.rescue_teams_available} accent="#10b981" icon={Users} tag="READY" index={5} />
          <StatCard label="Fire Units Ready" value={stats.fire_units_available} accent="#f97316" icon={Flame} tag="READY" index={6} />
          <StatCard label="Resolved Crises" value={stats.resolved_incidents} accent="#64748b" icon={CheckCircle2} tag="LOGGED" index={7} />
        </motion.div>
      )}

      <motion.div
        className="section-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="section-header">
          <h3>
            <Radio size={18} color="#22d3ee" />
            Active Emergency Incidents & Live Triage
          </h3>
          <button className="btn-link" onClick={() => onNavigate("incidents")}>
            Full Incident Registry <ArrowRight size={13} style={{ display: "inline", verticalAlign: "middle" }} />
          </button>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Emergency Type</th>
                <th>Sector Location</th>
                <th>Triage Severity</th>
                <th>Dispatch Status</th>
                <th style={{ textAlign: "right" }}>Operation</th>
              </tr>
            </thead>
            <motion.tbody variants={stagger} initial="initial" animate="animate">
              {recentIncidents.map((inc, i) => (
                <motion.tr key={inc.id} variants={fadeUp} transition={{ duration: 0.3 }}>
                  <td>
                    <div className="row-title">
                      <Shield size={15} color="#a5b4fc" />
                      {inc.incident_type}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <MapPin size={13} color="#64748b" />
                      <span>{inc.location}</span>
                    </div>
                  </td>
                  <td>
                    <SeverityBadge severity={inc.severity} />
                  </td>
                  <td>
                    <span className="status-tag status-available">
                      {inc.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn-link" onClick={() => onOpenIncident(inc.id)}>
                      Inspect Scenario →
                    </button>
                  </td>
                </motion.tr>
              ))}
              {recentIncidents.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    No active incidents in queue. Click <strong>"Load Live Demo Crisis"</strong> above to initialize the scenario.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
