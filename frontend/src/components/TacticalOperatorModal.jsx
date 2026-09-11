import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Radio,
  ShieldCheck,
  Check,
  Lock,
  Unlock,
  KeyRound,
  AlertCircle,
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
    id: "commander-tm",
    name: "Tariq Malik",
    callsign: "EOC-LEAD",
    role: "COMMANDER // NDMA 1122",
    initials: "TM",
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

const VALID_PINS = ["1122", "7860"];

export default function TacticalOperatorModal({ activeOperator, onSelect, onClose }) {
  const [pendingOperator, setPendingOperator] = useState(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  const handleCardClick = (preset) => {
    if (activeOperator?.id === preset.id || activeOperator?.name === preset.name) {
      return; // Already active
    }
    setPendingOperator(preset);
    setPin("");
    setPinError("");
    setPinSuccess(false);
  };

  const handleVerifyPin = (overridePin = null) => {
    const inputPin = overridePin !== null ? overridePin : pin;
    if (VALID_PINS.includes(inputPin.trim())) {
      setPinError("");
      setPinSuccess(true);
      setTimeout(() => {
        if (pendingOperator) {
          onSelect(pendingOperator);
        }
      }, 450);
    } else {
      setPinError("ACCESS DENIED: Invalid Passcode. Authorized Key: 1122");
    }
  };

  const handleQuickAuth = () => {
    setPin("1122");
    handleVerifyPin("1122");
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
              <span>HITL SECURITY CONSOLE // RBAC ENFORCED</span>
            </div>
            <h3>Switch Operator & Tactical Callsign</h3>
            <p className="operator-modal-subtitle">
              Role-Based Access Control active. Roster changes require verified EOC command clearance credentials.
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
            <span>OFFICIAL EOC ROSTER (RESTRICTED ACCESS)</span>
          </div>

          <div className="operator-presets-grid">
            {OPERATOR_PRESETS.map((preset) => {
              const isSelected = activeOperator?.id === preset.id || activeOperator?.name === preset.name;
              const isPending = pendingOperator?.id === preset.id;

              return (
                <div
                  key={preset.id}
                  className={`operator-preset-card ${isSelected ? "selected" : ""} ${isPending ? "pending" : ""}`}
                  onClick={() => handleCardClick(preset)}
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
                      <span className="check-badge active" title="Active Account">
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className="lock-badge" title="Passcode Required to Switch">
                        <Lock size={12} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tactical Passcode Verification Drawer */}
        <AnimatePresence>
          {pendingOperator && (
            <motion.div
              className="operator-auth-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="operator-auth-card">
                <div className="operator-auth-header">
                  <div className="operator-auth-title">
                    {pinSuccess ? (
                      <Unlock size={16} className="auth-icon-success" />
                    ) : (
                      <KeyRound size={16} className="auth-icon" />
                    )}
                    <span>
                      AUTHENTICATE SWITCH TO <strong>{pendingOperator.name}</strong>
                    </span>
                  </div>
                  <button
                    className="auth-cancel-btn"
                    onClick={() => {
                      setPendingOperator(null);
                      setPin("");
                      setPinError("");
                    }}
                  >
                    CANCEL
                  </button>
                </div>

                <div className="operator-auth-body">
                  <p className="auth-instructions">
                    Enter EOC Tactical Clearance PIN for <code>{pendingOperator.callsign}</code>:
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerifyPin();
                    }}
                    className="auth-form"
                  >
                    <div className="auth-input-wrapper">
                      <input
                        type="password"
                        maxLength={8}
                        className={`text-input auth-pin-input ${pinError ? "error" : ""} ${pinSuccess ? "success" : ""}`}
                        placeholder="••••"
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value);
                          setPinError("");
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="quick-auth-chip"
                        onClick={handleQuickAuth}
                        title="Auto-fill Demo Clearance PIN"
                      >
                        <Zap size={11} />
                        <span>Key: 1122</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      className={`btn ${pinSuccess ? "btn-success" : "btn-approve"} auth-submit-btn`}
                      disabled={!pin.trim() || pinSuccess}
                    >
                      {pinSuccess ? (
                        <>
                          <Check size={14} />
                          CLEARANCE GRANTED
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} />
                          VERIFY & SWITCH
                        </>
                      )}
                    </button>
                  </form>

                  {pinError && (
                    <motion.div
                      className="auth-error-message"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <AlertCircle size={13} />
                      <span>{pinError}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Footer Safeguard Note (Roster Locked) */}
        <div className="operator-modal-footer">
          <div className="operator-footer-note">
            <Activity size={13} />
            <span>
              <strong>ROSTER ENFORCED:</strong> Custom user self-registration disabled under National EOC security protocol. All dispatch authorizations require verified credentials.
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
