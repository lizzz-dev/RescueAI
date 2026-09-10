import React from "react";

export default function StatCard({ label, value, accent = "#3b82f6", icon: Icon, tag }) {
  return (
    <div className="stat-card" style={{ "--card-accent": accent }}>
      <div className="stat-top-row">
        {Icon ? (
          <div className="stat-icon-wrapper" style={{ color: accent, background: `${accent}15`, borderColor: `${accent}33` }}>
            <Icon size={18} />
          </div>
        ) : (
          <div className="stat-icon-wrapper" style={{ color: accent, background: `${accent}15`, borderColor: `${accent}33` }}>
            <span style={{ fontSize: "14px" }}>●</span>
          </div>
        )}
        {tag && <span className="stat-badge-tag">{tag}</span>}
      </div>
      <div>
        <div className="stat-value">{value ?? 0}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
