import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Radio,
  ShieldCheck,
  Check,
  UserCheck,
  Crosshair,
  Sparkles,
  Zap,
  Activity,
} from "lucide-react";

export const OPERATOR_PRESETS = [
  {
    id: "op-01",
    name: "OPERATOR-01",
    callsign: "ALPHA-1",
    role: "TACTICAL CONTROLLER // NDMA HQ",
    initials: "OP",
    agency: "NDMA National EOC",
    clearance: "LEVEL-4 CLEARANCE",
    color: "var(--cyan)",
  },
  {
    id: "commander-ak",
    name: "Amir Khan",
    callsign: "EOC-LEAD",
    role: "COMMANDER // NDMA 1122",
    initials: "AK",
    agency: "Joint NDMA-1122 Command",
    clearance: "COMMAND OVERRIDE",
    color: "var(--accent)",
  },
  {
    id: "disp-04",
    name: "DISPATCHER-04",
    callsign: "BRAVO-4",
    role: "FLEET LOGISTICS // RESCUE 1122",
    initials: "DS",
    agency: "Rescue 1122 Fleet Command",
    clearance: "FIELD DISPATCH AUTH",
    color: "#f59e0b",
  },
  {
    id: "triage-lead",
    name: "TRIAGE-LEAD",
    callsign: "MEDIC-1",
    role: "TRAUMA & ICU CONTROLLER // PIMS",
    initials: "TR",
    agency: "Trauma & Emergency Services",
    clearance: "CLINICAL ADMISSION",
    color: "#10b981",
  },
  {
    id: "recon-lead",
    name: "RECON-LEAD",
    callsign: "EAGLE-EYE",
    role: "UAV & SATELLITE RECON // AIR RELIEF",
    initials: "RC",
    agency: "NDMA Aerial Recon Taskforce",
    clearance: "SURVEILLANCE LEVEL-3",
    color: "#a855f7",
  },
];

export default function TacticalOperatorModal({ activeOperator, onSelect, onClose }) {
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [customAgency, setCustomAgency] = useState("NDMA 1122 EOC");

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    // Derive 2-letter monogram
    const parts = customName.trim().split(/\s+/);
    const initials = parts.length > 1 
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : customName.slice(0, 2).toUpperCase();

    const newOp = {
      id: "custom-" + Date.now(),
      name: customName.trim(),
      callsign: "CUSTOM-" + initials,
      role: customRole.trim() || "COMMANDER // NDMA 1122",
      initials: initials,
      agency: customAgency.trim() || "NDMA 1122 EOC",
      clearance: "COMMAND AUTHORIZED",
      color: "var(--cyan)",
    };

    onSelect(newOp);
  };

  return (
    <motion.div
      className="operator-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="operator-modal-dialog"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="operator-modal-header">
          <div className="operator-modal-title-group">
            <div className="operator-modal-badge">
              <Radio size={15} className="pulse-icon" />
              <span>HITL AUTHORIZATION CONSOLE</span>
            </div>
            <h3>Switch Operator & Tactical Callsign</h3>
            <p className="operator-modal-subtitle">
              Select an operational role or configure a custom callsign. All incident response dispatches will be stamped with this identity.
            </p>
          </div>
          <button
            className="operator-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets List */}
        <div className="operator-presets-list">
          <div className="operator-section-label">
            <ShieldCheck size={14} />
            <span>OPERATIONAL CALLSIGNS & ROLES</span>
          </div>

          <div className="operator-presets-grid">
            {OPERATOR_PRESETS.map((preset) => {
              const isSelected = activeOperator?.id === preset.id || activeOperator?.name === preset.name;
              return (
                <div
                  key={preset.id}
                  className={`operator-preset-card ${isSelected ? "selected" : ""}`}
                  onClick={() => onSelect(preset)}
                >
                  <div
                    className="operator-preset-avatar"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, #1e3a8a, ${preset.color})`
                        : "rgba(30, 41, 59, 0.8)",
                      borderColor: isSelected ? preset.color : "rgba(148, 163, 184, 0.2)",
                    }}
                  >
                    {preset.initials}
                  </div>
                  <div className="operator-preset-info">
                    <div className="operator-preset-top">
                      <span className="operator-preset-name">{preset.name}</span>
                      <span className="operator-preset-callsign">{preset.callsign}</span>
                    </div>
                    <div className="operator-preset-role">{preset.role}</div>
                    <div className="operator-preset-meta">
                      <span className="operator-preset-agency">{preset.agency}</span>
                      <span className="operator-preset-clearance">{preset.clearance}</span>
                    </div>
                  </div>
                  <div className="operator-preset-check">
                    {isSelected ? (
                      <span className="check-badge active">
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className="check-badge inactive"></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Callsign Form */}
        <div className="operator-custom-section">
          <div className="operator-section-label">
            <Sparkles size={14} />
            <span>CUSTOM CALLSIGN / PERSONAL NAME</span>
          </div>
          <form onSubmit={handleApplyCustom} className="operator-custom-form">
            <div className="operator-custom-inputs">
              <input
                type="text"
                className="text-input operator-input"
                placeholder="Callsign or Your Name (e.g. Hassan Raza / VIP-1)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <input
                type="text"
                className="text-input operator-input"
                placeholder="Role / Title (e.g. CHIEF CONTROLLER // NDMA)"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-approve operator-custom-btn"
              disabled={!customName.trim()}
            >
              <UserCheck size={14} />
              ACTIVATE CUSTOM
            </button>
          </form>
        </div>

        {/* Modal Footer Safeguard Note */}
        <div className="operator-modal-footer">
          <div className="operator-footer-note">
            <Activity size={13} />
            <span>
              Human-in-the-Loop (HITL) Protocol active. Every response plan authorization is cryptographically logged in the immutable audit ledger.
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
