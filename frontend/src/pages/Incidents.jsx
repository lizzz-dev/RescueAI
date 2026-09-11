import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/client.js";
import SeverityBadge from "../components/SeverityBadge.jsx";

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
};

export default function Incidents({ onOpenIncident }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ raw_text: "", source_type: "CITIZEN", location: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setIncidents(await api.listIncidents());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.raw_text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const incident = await api.createIncident(form);
      setForm({ raw_text: "", source_type: "CITIZEN", location: "" });
      setShowForm(false);
      await load();
      onOpenIncident(incident.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h2>Incidents</h2>
          <p className="header-subtitle">All emergency incidents registered in the system.</p>
        </div>
        <motion.button
          className="btn btn-primary"
          onClick={() => setShowForm((s) => !s)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {showForm ? "Cancel" : "+ New Emergency Report"}
        </motion.button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <AnimatePresence>
        {showForm && (
          <motion.form
            className="section-card"
            onSubmit={submit}
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <label className="field-label">Raw emergency report text</label>
            <textarea
              className="text-area"
              rows={4}
              value={form.raw_text}
              onChange={(e) => setForm({ ...form, raw_text: e.target.value })}
              placeholder="e.g. Heavy flooding reported on Shahrah-e-Faisal, several cars stranded, water rising..."
              required
            />
            <div className="form-row">
              <div>
                <label className="field-label">Source type</label>
                <select
                  className="select-input"
                  value={form.source_type}
                  onChange={(e) => setForm({ ...form, source_type: e.target.value })}
                >
                  <option value="FIELD_OFFICER">Field Officer</option>
                  <option value="VERIFIED_ORG">Verified Organization</option>
                  <option value="EMERGENCY_OPERATOR">Emergency Operator</option>
                  <option value="CITIZEN">Citizen Report</option>
                  <option value="SOCIAL_MEDIA">Unverified Social Media</option>
                </select>
              </div>
              <div>
                <label className="field-label">Location (optional)</label>
                <input
                  className="text-input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Shahrah-e-Faisal, Karachi"
                />
              </div>
            </div>
            <motion.button className="btn btn-primary" type="submit" disabled={submitting} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              {submitting ? "Submitting to AI Intake Agent..." : "Submit Report"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      <motion.div className="section-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Location</th>
              <th>Est. Victims</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Conflicting?</th>
              <th></th>
            </tr>
          </thead>
          <motion.tbody initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.04 } } }}>
            {incidents.map((inc) => (
              <motion.tr key={inc.id} variants={fadeUp} transition={{ duration: 0.25 }}>
                <td style={{ fontWeight: 600, color: "var(--text)" }}>{inc.incident_type}</td>
                <td>{inc.location}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>
                  {inc.estimated_victims_min != null
                    ? inc.estimated_victims_min === inc.estimated_victims_max
                      ? inc.estimated_victims_max
                      : `${inc.estimated_victims_min}-${inc.estimated_victims_max}`
                    : "Unknown"}
                </td>
                <td><SeverityBadge severity={inc.severity} /></td>
                <td><span className={`status-tag status-${(inc.status || '').toLowerCase()}`}>{inc.status}</span></td>
                <td>{inc.conflicting_info ? <span className="conflict-tag">⚠ Yes</span> : <span className="muted">No</span>}</td>
                <td><button className="btn-link" onClick={() => onOpenIncident(inc.id)}>View →</button></td>
              </motion.tr>
            ))}
            {incidents.length === 0 && !loading && (
              <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: "32px" }}>No incidents reported yet.</td></tr>
            )}
          </motion.tbody>
        </table>
      </motion.div>
    </div>
  );
}
