import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/client.js";
import SeverityBadge from "../components/SeverityBadge.jsx";

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
};

// Pakistani cities with real coordinates for the city selector
const CITY_COORDS = {
  "Karachi":          { lat: 24.8607, lon: 67.0011 },
  "Lahore":           { lat: 31.5497, lon: 74.3436 },
  "Islamabad":        { lat: 33.6844, lon: 73.0479 },
  "Rawalpindi":       { lat: 33.5651, lon: 73.0169 },
  "Faisalabad":       { lat: 31.4187, lon: 73.0791 },
  "Multan":           { lat: 30.1575, lon: 71.5249 },
  "Peshawar":         { lat: 34.0151, lon: 71.5249 },
  "Quetta":           { lat: 30.1798, lon: 66.9750 },
  "Hyderabad":        { lat: 25.3960, lon: 68.3578 },
  "Sialkot":          { lat: 32.4945, lon: 74.5229 },
  "Gujranwala":       { lat: 32.1877, lon: 74.1945 },
  "Bahawalpur":       { lat: 29.3956, lon: 71.6836 },
  "Sargodha":         { lat: 32.0836, lon: 72.6711 },
  "Sukkur":           { lat: 27.7052, lon: 68.8574 },
  "Mardan":           { lat: 34.1988, lon: 72.0404 },
  "Abbottabad":       { lat: 34.1688, lon: 73.2215 },
  "Gilgit":           { lat: 35.9208, lon: 74.3144 },
  "Skardu":           { lat: 35.2971, lon: 75.6335 },
  "Gwadar":           { lat: 25.1264, lon: 62.3225 },
  "Turbat":           { lat: 26.0031, lon: 63.0544 },
  "Muzaffarabad":     { lat: 34.3590, lon: 73.4714 },
  "Swat":             { lat: 35.2227, lon: 72.4258 },
  "Dera Ismail Khan": { lat: 31.8626, lon: 70.9019 },
  "Dera Ghazi Khan":  { lat: 30.0489, lon: 70.6455 },
  "Larkana":          { lat: 27.5570, lon: 68.2028 },
  "Nawabshah":        { lat: 26.2442, lon: 68.4100 },
  "Kohat":            { lat: 33.5869, lon: 71.4414 },
  "Mirpur Khas":      { lat: 25.5276, lon: 69.0159 },
  "Khuzdar":          { lat: 27.8000, lon: 66.6167 },
};

const CITY_NAMES = Object.keys(CITY_COORDS).sort();

const STATUS_OPTIONS = ["NEW", "ANALYZING", "AWAITING_APPROVAL", "APPROVED", "DISPATCHED", "RESOLVED", "REJECTED"];
const SEVERITY_OPTIONS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function Incidents({ onOpenIncident }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ raw_text: "", source_type: "CITIZEN", location: "", city: "" });
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterType, setFilterType] = useState("");

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

  // Derive unique incident types from data for the filter dropdown
  const incidentTypes = useMemo(() => {
    const types = new Set(incidents.map((i) => i.incident_type).filter(Boolean));
    return [...types].sort();
  }, [incidents]);

  // Filtered incidents
  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (filterStatus && inc.status !== filterStatus) return false;
      if (filterSeverity && inc.severity !== filterSeverity) return false;
      if (filterType && inc.incident_type !== filterType) return false;
      return true;
    });
  }, [incidents, filterStatus, filterSeverity, filterType]);

  const handleCityChange = (cityName) => {
    if (cityName && CITY_COORDS[cityName]) {
      setForm((f) => ({ ...f, city: cityName, location: cityName }));
    } else {
      setForm((f) => ({ ...f, city: "" }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.raw_text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        raw_text: form.raw_text,
        source_type: form.source_type,
        location: form.location || undefined,
      };
      // If a city was selected, include lat/lon
      if (form.city && CITY_COORDS[form.city]) {
        payload.latitude = CITY_COORDS[form.city].lat;
        payload.longitude = CITY_COORDS[form.city].lon;
        if (!payload.location) {
          payload.location = form.city;
        }
      }
      const incident = await api.createIncident(payload);
      setForm({ raw_text: "", source_type: "CITIZEN", location: "", city: "" });
      setShowForm(false);
      await load();
      onOpenIncident(incident.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeFilters = [filterStatus, filterSeverity, filterType].filter(Boolean).length;

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
                <label className="field-label">City (quick-pick)</label>
                <select
                  className="select-input"
                  value={form.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                >
                  <option value="">-- Select a city --</option>
                  {CITY_NAMES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Location (optional override)</label>
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

      {/* ── Filter Bar ── */}
      <motion.div
        className="filter-bar"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        <select
          className="select-input filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>

        <select
          className="select-input filter-select"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="">All Severities</option>
          {SEVERITY_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="select-input filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {incidentTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <span className="result-count">
          {filtered.length === incidents.length
            ? `${incidents.length} incidents`
            : `${filtered.length} of ${incidents.length} incidents`}
          {activeFilters > 0 && (
            <button
              className="btn-link clear-filters"
              onClick={() => { setFilterStatus(""); setFilterSeverity(""); setFilterType(""); }}
              style={{ marginLeft: 8 }}
            >
              Clear filters
            </button>
          )}
        </span>
      </motion.div>

      {/* ── Table ── */}
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
            {filtered.map((inc) => (
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
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: "32px" }}>
                {activeFilters > 0 ? "No incidents match the selected filters." : "No incidents reported yet."}
              </td></tr>
            )}
          </motion.tbody>
        </table>
      </motion.div>
    </div>
  );
}
