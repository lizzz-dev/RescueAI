import React from "react";

const COLORS = {
  CRITICAL: { bg: "rgba(239, 68, 68, 0.16)", text: "#f87171", border: "rgba(239, 68, 68, 0.45)", dot: "#ef4444", pulse: true },
  HIGH: { bg: "rgba(249, 115, 22, 0.16)", text: "#fb923c", border: "rgba(249, 115, 22, 0.45)", dot: "#f97316", pulse: true },
  MEDIUM: { bg: "rgba(234, 179, 8, 0.16)", text: "#facc15", border: "rgba(234, 179, 8, 0.45)", dot: "#eab308", pulse: false },
  LOW: { bg: "rgba(16, 185, 129, 0.16)", text: "#34d399", border: "rgba(16, 185, 129, 0.45)", dot: "#10b981", pulse: false },
};

export default function SeverityBadge({ severity }) {
  if (!severity) {
    return (
      <span className="badge badge-muted">
        <span className="badge-dot" style={{ background: "#94a3b8" }} />
        UNASSESSED
      </span>
    );
  }

  const s = COLORS[severity] || { bg: "rgba(148, 163, 184, 0.1)", text: "#94a3b8", border: "rgba(148, 163, 184, 0.3)", dot: "#94a3b8", pulse: false };

  return (
    <span
      className="badge"
      style={{
        backgroundColor: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        boxShadow: s.pulse ? `0 0 10px ${s.bg}` : "none",
      }}
    >
      <span
        className={`badge-dot ${s.pulse ? "badge-pulse" : ""}`}
        style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}` }}
      />
      {severity}
    </span>
  );
}
