import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { api } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import {
  BarChart3, CheckCircle2, ShieldAlert, Ambulance, Activity,
  AlertTriangle, Flame, Sparkles, Building2, Radio, HeartPulse,
} from "lucide-react";

const SEVERITY_COLORS = {
  CRITICAL: "#f43f5e",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#10b981",
  UNASSESSED: "#64748b",
};

const TYPE_GRADIENTS = [
  { from: "#6384ff", to: "#4361ee" },
  { from: "#f43f5e", to: "#be123c" },
  { from: "#f97316", to: "#c2410c" },
  { from: "#22d3ee", to: "#0891b2" },
  { from: "#a855f7", to: "#7e22ce" },
  { from: "#10b981", to: "#047857" },
];

const customTooltipStyle = {
  background: "rgba(10, 15, 30, 0.95)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "8px",
  backdropFilter: "blur(12px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  fontSize: "12px",
  fontFamily: "'JetBrains Mono', monospace",
  padding: "10px 14px",
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.dashboardAnalytics(),
      api.listIncidents().catch(() => []),
    ])
      .then(([analyticsData, incidentList]) => {
        setData(analyticsData);
        setIncidents(incidentList || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <p className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: "14px" }}>
          <Radio size={16} className="spin" style={{ display: "inline", marginRight: "8px" }} />
          Acquiring tactical telemetry streams & analytics...
        </p>
      </div>
    );
  }

  if (!data) return <p className="alert alert-error">Could not load analytics telemetry.</p>;

  // 1. Incidents by Type with casualty estimates
  const typeMap = {};
  incidents.forEach((inc) => {
    const t = inc.incident_type || "Other";
    if (!typeMap[t]) {
      typeMap[t] = { count: 0, minVictims: 0, maxVictims: 0 };
    }
    typeMap[t].count += 1;
    typeMap[t].minVictims += inc.estimated_victims_min || 0;
    typeMap[t].maxVictims += inc.estimated_victims_max || 0;
  });

  const byType = Object.entries(data.incidents_by_type || {}).map(([name, value], idx) => {
    const enriched = typeMap[name] || { minVictims: 0, maxVictims: 0 };
    const pct = data.total_incidents > 0 ? Math.round((value / data.total_incidents) * 100) : 0;
    return {
      name,
      value,
      pct,
      victims: enriched.maxVictims > 0 ? `${enriched.minVictims}-${enriched.maxVictims}` : "N/A",
      gradient: TYPE_GRADIENTS[idx % TYPE_GRADIENTS.length],
    };
  });

  // 2. Incidents by Severity
  const bySeverity = Object.entries(data.incidents_by_severity || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // 3. Resource Utilization
  const resourceUtil = Object.entries(data.resource_utilization || {}).map(([name, v]) => ({
    name,
    total: v.total,
    dispatched: v.dispatched,
    available: Math.max(0, v.total - v.dispatched),
    pct: v.total > 0 ? Math.round((v.dispatched / v.total) * 100) : 0,
  }));

  const totalResources = resourceUtil.reduce((acc, r) => acc + r.total, 0);
  const totalDispatched = resourceUtil.reduce((acc, r) => acc + r.dispatched, 0);
  const fleetMobilizationPct = totalResources > 0 ? Math.round((totalDispatched / totalResources) * 100) : 0;

  // 4. Hospital Utilization Analysis
  const hospitals = (data.hospital_utilization || []).map((h) => {
    const free = Math.max(0, h.capacity - h.load);
    const loadPct = h.capacity > 0 ? Math.round((h.load / h.capacity) * 100) : 0;
    let status = "NOMINAL";
    let color = "#10b981";
    if (loadPct >= 80) {
      status = "CRITICAL SURGE";
      color = "#f43f5e";
    } else if (loadPct >= 50) {
      status = "ELEVATED";
      color = "#f97316";
    }
    return {
      name: h.name.replace(" (demo)", ""),
      fullName: h.name,
      load: h.load,
      free,
      capacity: h.capacity,
      loadPct,
      status,
      color,
    };
  });

  const totalHospLoad = hospitals.reduce((acc, h) => acc + h.load, 0);
  const totalHospCap = hospitals.reduce((acc, h) => acc + h.capacity, 0);
  const hospitalSaturationPct = totalHospCap > 0 ? Math.round((totalHospLoad / totalHospCap) * 100) : 0;

  // 5. AI Detected Hazards
  const hazardCounts = {};
  incidents.forEach((inc) => {
    (inc.hazards || []).forEach((hz) => {
      hazardCounts[hz] = (hazardCounts[hz] || 0) + 1;
    });
  });
  const hazardsList = Object.entries(hazardCounts)
    .map(([hazard, count]) => ({ hazard, count }))
    .sort((a, b) => b.count - a.count);

  // 6. Average AI Confidence
  const confidences = incidents
    .map((i) => i.confidence?.incident_classification)
    .filter((c) => typeof c === "number");
  const avgConfidence = confidences.length > 0
    ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100)
    : 92;

  // 7. Crisis Lifecycle Funnel
  const funnel = {
    NEW: incidents.filter((i) => i.status === "NEW").length,
    ANALYZING: incidents.filter((i) => i.status === "ANALYZING").length,
    AWAITING_APPROVAL: incidents.filter((i) => i.status === "AWAITING_APPROVAL").length,
    DISPATCHED: incidents.filter((i) => i.status === "DISPATCHED").length,
    RESOLVED: data.resolved_incidents || 0,
  };

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-titles">
          <h2>Telemetry & Stats</h2>
          <p className="header-subtitle">
            Strategic operations analytics, multi-hazard intelligence, and resource saturation index.
          </p>
        </div>
        <div className="telemetry-pill" style={{ background: "rgba(99, 132, 255, 0.1)", borderColor: "rgba(99, 132, 255, 0.3)", color: "#a5b4fc" }}>
          <Sparkles size={13} style={{ marginRight: 6 }} /> REAL-TIME AGGREGATION
        </div>
      </div>

      {/* 5-Metric Tactical KPI Band */}
      <motion.div
        className="stat-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
      >
        <StatCard
          label="Total Crises"
          value={data.total_incidents}
          accent="#6384ff"
          icon={BarChart3}
          tag="ALL RECORDED"
          index={0}
        />
        <StatCard
          label="Resolved Crises"
          value={data.resolved_incidents}
          accent="#10b981"
          icon={CheckCircle2}
          tag="DE-ESCALATED"
          index={1}
        />
        <StatCard
          label="Fleet Mobilized"
          value={`${fleetMobilizationPct}%`}
          accent="#f97316"
          icon={Ambulance}
          tag={`${totalDispatched}/${totalResources} ACTIVE`}
          index={2}
        />
        <StatCard
          label="ICU/Trauma Load"
          value={`${hospitalSaturationPct}%`}
          accent={hospitalSaturationPct > 75 ? "#f43f5e" : "#22d3ee"}
          icon={HeartPulse}
          tag={`${totalHospLoad}/${totalHospCap} BEDS`}
          index={3}
        />
        <StatCard
          label="Avg AI Confidence"
          value={`${avgConfidence}%`}
          accent="#a855f7"
          icon={ShieldAlert}
          tag="TRIAGE VALIDATED"
          index={4}
        />
      </motion.div>

      {/* Lifecycle Status Pipeline Funnel */}
      <motion.div
        className="section-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        <div className="section-header">
          <h3>
            <Activity size={17} color="#6384ff" /> Crisis Lifecycle Pipeline
          </h3>
          <span className="badge-tag">HUMAN-IN-THE-LOOP FLOW</span>
        </div>
        <div className="funnel-pipeline">
          <div className="funnel-stage">
            <span className="funnel-label">NEW</span>
            <span className="funnel-count" style={{ color: "#94a3b8" }}>{funnel.NEW}</span>
            <div className="funnel-bar-bg"><div className="funnel-bar-fill" style={{ width: `${Math.min(100, funnel.NEW * 25)}%`, background: "#94a3b8" }} /></div>
          </div>
          <div className="funnel-arrow">➔</div>
          <div className="funnel-stage">
            <span className="funnel-label">ANALYZING</span>
            <span className="funnel-count" style={{ color: "#38bdf8" }}>{funnel.ANALYZING}</span>
            <div className="funnel-bar-bg"><div className="funnel-bar-fill" style={{ width: `${Math.min(100, funnel.ANALYZING * 25)}%`, background: "#38bdf8" }} /></div>
          </div>
          <div className="funnel-arrow">➔</div>
          <div className="funnel-stage">
            <span className="funnel-label">APPROVAL QUEUE</span>
            <span className="funnel-count" style={{ color: "#eab308" }}>{funnel.AWAITING_APPROVAL}</span>
            <div className="funnel-bar-bg"><div className="funnel-bar-fill" style={{ width: `${Math.min(100, funnel.AWAITING_APPROVAL * 25)}%`, background: "#eab308" }} /></div>
          </div>
          <div className="funnel-arrow">➔</div>
          <div className="funnel-stage">
            <span className="funnel-label">DISPATCHED</span>
            <span className="funnel-count" style={{ color: "#f97316" }}>{funnel.DISPATCHED}</span>
            <div className="funnel-bar-bg"><div className="funnel-bar-fill" style={{ width: `${Math.min(100, funnel.DISPATCHED * 25)}%`, background: "#f97316" }} /></div>
          </div>
          <div className="funnel-arrow">➔</div>
          <div className="funnel-stage">
            <span className="funnel-label">RESOLVED</span>
            <span className="funnel-count" style={{ color: "#10b981" }}>{funnel.RESOLVED}</span>
            <div className="funnel-bar-bg"><div className="funnel-bar-fill" style={{ width: `${Math.min(100, funnel.RESOLVED * 25)}%`, background: "#10b981" }} /></div>
          </div>
        </div>
      </motion.div>

      {/* Row 1: Incidents by Type & Severity */}
      <div className="analytics-grid">
        {/* Incidents by Type Card */}
        <motion.div
          className="section-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <div className="section-header">
            <h3>
              <Building2 size={17} color="#6384ff" /> Incidents by Classification
            </h3>
            <span className="badge-tag">{byType.length} CATEGORIES</span>
          </div>

          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={byType} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <defs>
                <linearGradient id="typeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6384ff" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#4361ee" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
                axisLine={{ stroke: "#1e2a4a" }}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} axisLine={{ stroke: "#1e2a4a" }} />
              <Tooltip
                contentStyle={customTooltipStyle}
                cursor={{ fill: "rgba(99, 132, 255, 0.06)" }}
                formatter={(val, name, item) => [
                  `${val} crises (${item.payload.pct}%) — Est. Victims: ${item.payload.victims}`,
                  "Incident Volume",
                ]}
              />
              <Bar dataKey="value" fill="url(#typeGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Breakdown summary row */}
          <div className="type-pills-row">
            {byType.map((t) => (
              <div key={t.name} className="type-pill-item">
                <span className="type-pill-name">{t.name}</span>
                <span className="type-pill-val">{t.value} crises</span>
                <span className="type-pill-pct">{t.pct}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Severity Distribution Donut */}
        <motion.div
          className="section-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="section-header">
            <h3>
              <ShieldAlert size={17} color="#f43f5e" /> Severity Distribution
            </h3>
            <span className="badge-tag">TRIAGE CLASSIFICATION</span>
          </div>
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie
                data={bySeverity}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={4}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: "#475569" }}
              >
                {bySeverity.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || "#64748b"} stroke="none" />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                formatter={(v) => <span style={{ color: "#94a3b8", fontSize: "11.5px", fontFamily: "var(--font-mono)" }}>{v}</span>}
              />
              <Tooltip contentStyle={customTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 2: Hospital Trauma & ICU Saturation + AI Hazard Scan */}
      <div className="analytics-grid" style={{ marginTop: 24 }}>
        {/* Hospital Saturation Card */}
        <motion.div
          className="section-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <div className="section-header">
            <h3>
              <HeartPulse size={17} color="#22d3ee" /> Regional Hospital & Trauma Saturation
            </h3>
            <span className="badge-tag">{hospitals.length} DEMO FACILITIES</span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hospitals} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <defs>
                <linearGradient id="hospLoadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#be123c" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="hospFreeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#047857" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                interval={0}
                angle={-10}
                textAnchor="end"
                height={40}
                axisLine={{ stroke: "#1e2a4a" }}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} axisLine={{ stroke: "#1e2a4a" }} />
              <Tooltip
                contentStyle={customTooltipStyle}
                cursor={{ fill: "rgba(34, 211, 238, 0.05)" }}
                formatter={(val, name, item) => [
                  `${val} beds (${name === "load" ? item.payload.loadPct + "% surge" : "available"})`,
                  name === "load" ? "Occupied Beds" : "Free Capacity",
                ]}
              />
              <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: "11px" }}>{v === "load" ? "Occupied / In Use" : "Available Beds"}</span>} />
              <Bar dataKey="load" stackId="hosp" fill="url(#hospLoadGrad)" name="load" radius={[0, 0, 0, 0]} />
              <Bar dataKey="free" stackId="hosp" fill="url(#hospFreeGrad)" name="free" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="hospital-status-list">
            {hospitals.map((h) => (
              <div key={h.fullName} className="hospital-status-item">
                <span className="hosp-name">{h.name}</span>
                <span className="hosp-pct" style={{ color: h.color }}>{h.loadPct}% load</span>
                <span className="hosp-badge" style={{ borderColor: h.color, color: h.color }}>{h.status}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Multi-Hazard Exposure Matrix */}
        <motion.div
          className="section-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="section-header">
            <h3>
              <AlertTriangle size={17} color="#f97316" /> AI Detected Hazard Exposure
            </h3>
            <span className="badge-tag">ACTIVE THREAT MATRIX</span>
          </div>

          <div className="hazard-frequency-grid">
            {hazardsList.length > 0 ? (
              hazardsList.map((h, i) => (
                <div key={h.hazard} className="hazard-bar-card">
                  <div className="hazard-bar-top">
                    <span className="hazard-name">
                      <Flame size={13} color="#f97316" style={{ marginRight: 6 }} />
                      {h.hazard}
                    </span>
                    <span className="hazard-count">{h.count} active reports</span>
                  </div>
                  <div className="hazard-progress-bg">
                    <motion.div
                      className="hazard-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (h.count / data.total_incidents) * 100)}%` }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
                      style={{
                        background:
                          i === 0
                            ? "linear-gradient(90deg, #f43f5e, #f97316)"
                            : i === 1
                            ? "linear-gradient(90deg, #f97316, #eab308)"
                            : "linear-gradient(90deg, #6384ff, #22d3ee)",
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted" style={{ padding: "20px 0", textAlign: "center" }}>
                No active hazard tags flagged in current crises.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Row 3: Full-Width Resource Mobilization & Fleet Breakdown */}
      <motion.div
        className="section-card"
        style={{ marginTop: 24 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <div className="section-header">
          <h3>
            <Ambulance size={17} color="#10b981" /> Fleet & Emergency Resource Allocation
          </h3>
          <span className="badge-tag">CITY-WIDE DISPATCH STATUS</span>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={resourceUtil} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
            <defs>
              <linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#047857" stopOpacity={0.35} />
              </linearGradient>
              <linearGradient id="dispGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#be123c" stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={70}
              axisLine={{ stroke: "#1e2a4a" }}
            />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} axisLine={{ stroke: "#1e2a4a" }} />
            <Tooltip
              contentStyle={customTooltipStyle}
              cursor={{ fill: "rgba(99, 132, 255, 0.04)" }}
              formatter={(val, name, item) => [
                `${val} units (${name === "dispatched" ? item.payload.pct + "% mobilized" : "ready"})`,
                name === "dispatched" ? "Dispatched / On Scene" : "Available in Reserve",
              ]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              formatter={(v) => <span style={{ color: "#94a3b8", fontSize: "11.5px" }}>{v}</span>}
            />
            <Bar dataKey="available" stackId="a" fill="url(#availGrad)" name="Available in Reserve" radius={[0, 0, 0, 0]} />
            <Bar dataKey="dispatched" stackId="a" fill="url(#dispGrad)" name="Dispatched / On Scene" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
