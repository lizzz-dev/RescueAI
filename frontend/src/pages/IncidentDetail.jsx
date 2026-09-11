import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Bot,
  Sparkles,
  ShieldAlert,
  Send,
  Clock,
  Layers,
} from "lucide-react";
import { api } from "../api/client.js";
import SeverityBadge from "../components/SeverityBadge.jsx";
import ResponsePlanPanel from "../components/ResponsePlanPanel.jsx";

const AGENT_PIPELINE = [
  { step: "01", name: "Intake Agent", role: "NLP Entity Extraction" },
  { step: "02", name: "Analysis Agent", role: "Severity & Confidence" },
  { step: "03", name: "Risk Agent", role: "Cascading Hazard Engine" },
  { step: "04", name: "Resource Agent", role: "Proximity & Capabilities" },
  { step: "05", name: "Hospital Agent", role: "ICU & Bed Triage" },
  { step: "06", name: "Planning Agent", role: "SOP RAG & Plan Builder" },
];

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function IncidentDetail({ incidentId, onBack }) {
  const [incident, setIncident] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [newReportText, setNewReportText] = useState("");
  const [newReportSource, setNewReportSource] = useState("CITIZEN");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const inc = await api.getIncident(incidentId);
      setIncident(inc);
      try {
        const p = await api.getResponsePlan(incidentId);
        setPlan(p);
      } catch (e) {
        setPlan(null); // no plan yet
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const p = await api.analyzeIncident(incidentId);
      setPlan(p);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const addReport = async (e) => {
    e.preventDefault();
    if (!newReportText.trim()) return;
    setBusy(true);
    try {
      await api.addReport(incidentId, { raw_text: newReportText, source_type: newReportSource });
      setNewReportText("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const approve = async (approverName) => {
    setBusy(true);
    setError(null);
    try {
      const p = await api.approveResponse(incidentId, { approved_by: approverName });
      setPlan(p);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reject = async (approverName, reason) => {
    setBusy(true);
    setError(null);
    try {
      const p = await api.rejectResponse(incidentId, { rejected_by: approverName, reason });
      setPlan(p);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resolve = async () => {
    setBusy(true);
    try {
      await api.resolveIncident(incidentId);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !incident) return <p className="muted" style={{ fontFamily: "var(--font-mono)" }}>Acquiring incident telemetry...</p>;
  if (!incident) return <p className="alert alert-error">Incident not found.</p>;

  return (
    <div>
      <button className="btn-link" onClick={onBack} style={{ marginBottom: "16px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <ArrowLeft size={14} /> Back to Command Center
      </button>

      {error && <div className="alert alert-error">{error}</div>}

      <motion.div className="page-header" {...fadeUp} transition={{ duration: 0.3 }}>
        <div className="header-titles">
          <h2>{incident.incident_type} // {incident.location}</h2>
          <p className="header-subtitle">
            Sector ID: <span style={{ fontFamily: "var(--font-mono)", color: "#22d3ee" }}>{incident.id.slice(0, 8)}</span> • Reported {new Date(incident.created_at).toLocaleTimeString()}
          </p>
        </div>
        <SeverityBadge severity={incident.severity} />
      </motion.div>

      {/* Multi-Agent Visual Pipeline Tracker */}
      <motion.div
        className="agent-pipeline"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      >
        {AGENT_PIPELINE.map((ag, idx) => {
          const isDone = plan != null;
          const isCurrent = analyzing && !isDone;
          return (
            <motion.div
              key={ag.step}
              className={`agent-node ${isCurrent ? "active" : ""}`}
              variants={fadeUp}
              transition={{ duration: 0.3 }}
            >
              <div className="agent-node-num">AGENT {ag.step}</div>
              <div className="agent-node-name">{ag.name}</div>
              <div className="agent-node-role">{ag.role}</div>
              <div className={`agent-node-status ${isDone ? "agent-status-done" : "agent-status-wait"}`}>
                {isDone ? (
                  <>
                    <CheckCircle2 size={10} /> COMPLETE
                  </>
                ) : isCurrent ? (
                  <>
                    <Bot size={10} /> ANALYZING...
                  </>
                ) : (
                  "PENDING"
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div className="incident-meta-grid" {...fadeUp} transition={{ delay: 0.2, duration: 0.4 }}>
        <div>
          <div className="meta-item-label">Status</div>
          <div className="meta-item-value">
            <span className="status-tag status-available">{incident.status}</span>
          </div>
        </div>
        <div>
          <div className="meta-item-label">Estimated Victims</div>
          <div className="meta-item-value" style={{ fontFamily: "var(--font-mono)", color: "#fb923c" }}>
            {incident.estimated_victims_min != null
              ? (incident.estimated_victims_min === incident.estimated_victims_max
                  ? `${incident.estimated_victims_max} persons`
                  : `${incident.estimated_victims_min} - ${incident.estimated_victims_max} persons`)
              : "Unverified (Field check required)"}
          </div>
        </div>
        <div>
          <div className="meta-item-label">Critical Hazards</div>
          <div className="meta-item-value" style={{ color: "#fb7185" }}>
            {incident.hazards?.join(" • ") || "None flagged"}
          </div>
        </div>
        <div>
          <div className="meta-item-label">Timestamp</div>
          <div className="meta-item-value" style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
            {new Date(incident.created_at).toLocaleString()}
          </div>
        </div>
      </motion.div>

      {incident.conflicting_info && (
        <motion.div className="alert alert-warning" {...fadeUp} transition={{ delay: 0.3 }}>
          <AlertTriangle size={18} />
          <div>
            <strong>CONFLICTING CASUALTY / HAZARD REPORTS DETECTED:</strong>
            <p style={{ margin: "4px 0 0 0" }}>{incident.conflict_notes}</p>
          </div>
        </motion.div>
      )}

      {/* Reports Section */}
      <motion.div className="section-card" {...fadeUp} transition={{ delay: 0.3, duration: 0.4 }}>
        <div className="section-header">
          <h3>
            <Layers size={17} color="#22d3ee" />
            Field & Citizen Incoming Reports ({incident.reports?.length || 0})
          </h3>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report Transmission</th>
                <th>Channel Source</th>
                <th>Reliability Weight</th>
                <th>Reported Victims</th>
              </tr>
            </thead>
            <tbody>
              {incident.reports?.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: "#e2e8f0", fontWeight: 500 }}>"{r.raw_text}"</td>
                  <td>
                    <span className="stat-badge-tag">{r.source_type}</span>
                  </td>
                  <td>
                    <span className={`reliability-tag reliability-${r.reliability.toLowerCase()}`}>
                      ● {r.reliability}
                    </span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#94a3b8" }}>
                    {r.extracted_victims != null ? `${r.extracted_victims} reported` : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="add-report-form" onSubmit={addReport} style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <input
            className="text-input"
            value={newReportText}
            onChange={(e) => setNewReportText(e.target.value)}
            placeholder="Transmit additional field report or conflicting observer account..."
            style={{ flex: 1 }}
          />
          <select
            className="select-input"
            value={newReportSource}
            onChange={(e) => setNewReportSource(e.target.value)}
            style={{ width: "180px" }}
          >
            <option value="FIELD_OFFICER">Field Officer</option>
            <option value="VERIFIED_ORG">Verified Org</option>
            <option value="EMERGENCY_OPERATOR">Emergency Operator</option>
            <option value="CITIZEN">Citizen (911/1122)</option>
            <option value="SOCIAL_MEDIA">Social Media Intelligence</option>
          </select>
          <motion.button className="btn" type="submit" disabled={busy} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Send size={14} /> Transmit
          </motion.button>
        </form>
      </motion.div>

      {/* AI Pipeline Trigger / Result */}
      <AnimatePresence mode="wait">
        {!plan && (
          <motion.div
            className="section-card center-cta"
            key="no-plan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Bot size={40} color="#6384ff" style={{ marginBottom: "16px" }} />
            </motion.div>
            <h3 style={{ margin: "0 0 6px 0", color: "#e2e8f0" }}>AI Multi-Agent Response Plan Not Synthesized</h3>
            <p className="muted" style={{ margin: "0 0 24px 0", maxWidth: "520px", marginInline: "auto" }}>
              Trigger the autonomous 6-agent pipeline to calculate severity, evaluate secondary risks, match nearest rescue units, route to available ICU beds, and pull Standard Operating Procedures.
            </p>
            <motion.button
              className="btn btn-primary"
              onClick={runAnalysis}
              disabled={analyzing}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              animate={!analyzing ? { boxShadow: ["0 0 20px rgba(99, 102, 241, 0.3)", "0 0 35px rgba(99, 102, 241, 0.5)", "0 0 20px rgba(99, 102, 241, 0.3)"] } : {}}
              transition={!analyzing ? { boxShadow: { duration: 2, repeat: Infinity } } : {}}
            >
              <Sparkles size={16} />
              {analyzing ? "Synthesizing Multi-Agent Strategy..." : "Execute 6-Agent AI Analysis"}
            </motion.button>
          </motion.div>
        )}

        {plan && (
          <motion.div
            className="section-card"
            key="plan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ResponsePlanPanel plan={plan} onApprove={approve} onReject={reject} busy={busy} />
            {plan.approval_status === "APPROVED" && incident.status === "DISPATCHED" && (
              <motion.button
                className="btn btn-approve"
                style={{ marginTop: 16 }}
                onClick={resolve}
                disabled={busy}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <CheckCircle2 size={16} /> Close & Mark Crisis Resolved
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
