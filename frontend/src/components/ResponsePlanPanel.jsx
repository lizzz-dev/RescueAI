import React, { useState } from "react";
import { motion } from "framer-motion";
import SeverityBadge from "./SeverityBadge.jsx";
import ConfidenceBar from "./ConfidenceBar.jsx";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function ResponsePlanPanel({ plan, onApprove, onReject, busy }) {
  const [approverName, setApproverName] = useState("Commander Amir Khan");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  if (!plan) return null;

  const hospital = plan.recommended_hospital?.recommended;
  const isPending = plan.approval_status === "PENDING";

  return (
    <motion.div
      className="plan-panel"
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div className="plan-header" variants={fadeUp} transition={{ duration: 0.3 }}>
        <h3>AI Response Recommendation</h3>
        <SeverityBadge severity={plan.severity} />
      </motion.div>

      <motion.p className="plan-summary" variants={fadeUp} transition={{ duration: 0.3 }}>{plan.summary}</motion.p>

      <motion.div className="plan-grid" variants={{ animate: { transition: { staggerChildren: 0.08 } } }}>
        <motion.div className="plan-section" variants={fadeUp} transition={{ duration: 0.3 }}>
          <h4>Recommended Resources</h4>
          <ul>
            {plan.recommended_resources?.map((rec) => (
              <li key={rec.resource_type}>
                <strong>{rec.resource_type}</strong>
                {rec.chosen?.length ? (
                  rec.chosen.map((c) => (
                    <div key={c.id} className="resource-pick">
                      {c.name} <span className="muted">({c.distance_km} km, {Math.round(c.workload_ratio * 100)}% loaded)</span>
                    </div>
                  ))
                ) : (
                  <div className="gap-text">⚠ {rec.gap}</div>
                )}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div className="plan-section" variants={fadeUp} transition={{ duration: 0.3 }}>
          <h4>Recommended Hospital</h4>
          {hospital ? (
            <div>
              <strong>{hospital.name}</strong>
              <div className="muted">{hospital.reason}</div>
              {plan.recommended_hospital.alternatives?.length > 0 && (
                <div className="muted" style={{ marginTop: 6 }}>
                  Alternatives: {plan.recommended_hospital.alternatives.map((a) => a.name).join(", ")}
                </div>
              )}
            </div>
          ) : (
            <div className="gap-text">⚠ No operational hospital found.</div>
          )}
        </motion.div>

        <motion.div className="plan-section" variants={fadeUp} transition={{ duration: 0.3 }}>
          <h4>Risks / Secondary Hazards</h4>
          <ul className="risk-list">
            {plan.risks?.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </motion.div>

        <motion.div className="plan-section" variants={fadeUp} transition={{ duration: 0.3 }}>
          <h4>Response Sequence</h4>
          <ol>
            {plan.actions?.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ol>
        </motion.div>
      </motion.div>

      {plan.information_gaps?.length > 0 && (
        <motion.div className="info-gaps" variants={fadeUp} transition={{ duration: 0.3 }}>
          <h4>Information Gaps</h4>
          <ul>
            {plan.information_gaps.map((g, idx) => (
              <li key={idx}>{g}</li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div className="plan-section" style={{ marginTop: 16 }} variants={fadeUp} transition={{ duration: 0.3 }}>
        <h4>AI Confidence</h4>
        {Object.entries(plan.confidence || {}).map(([k, v]) => (
          <ConfidenceBar key={k} label={k.replace(/_/g, " ")} value={v} />
        ))}
        <p className="muted small">Confidence reflects the AI's certainty in its own analysis, not a guarantee of ground truth.</p>
      </motion.div>

      <motion.details className="explainability-details" variants={fadeUp} transition={{ duration: 0.3 }}>
        <summary>Why this recommendation? (AI Explainability)</summary>
        <ul>
          {plan.explainability?.severity_reasons?.map((r, idx) => (
            <li key={idx}>{r}</li>
          ))}
        </ul>
        {plan.knowledge_base_refs?.length > 0 && (
          <p className="muted small">Guidance referenced: {plan.knowledge_base_refs.join(", ")}</p>
        )}
      </motion.details>

      <motion.div className="approval-status-row" variants={fadeUp} transition={{ duration: 0.3 }}>
        Approval status: <strong>{plan.approval_status}</strong>
        {plan.approved_by && <span className="muted"> by {plan.approved_by}</span>}
      </motion.div>

      {isPending && (
        <motion.div className="approval-actions" variants={fadeUp} transition={{ duration: 0.3 }}>
          <input
            className="text-input"
            value={approverName}
            onChange={(e) => setApproverName(e.target.value)}
            placeholder="Approver name"
            style={{ maxWidth: "240px" }}
          />
          <motion.button className="btn btn-approve" disabled={busy} onClick={() => onApprove(approverName)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            APPROVE RESPONSE
          </motion.button>
          <motion.button className="btn btn-reject" disabled={busy} onClick={() => setShowReject((s) => !s)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            REJECT
          </motion.button>
          {showReject && (
            <motion.div
              className="reject-box"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              transition={{ duration: 0.2 }}
            >
              <input
                className="text-input"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection"
              />
              <motion.button className="btn btn-reject" disabled={busy} onClick={() => onReject(approverName, rejectReason)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                Confirm Reject
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}

      <p className="safety-note">
        This is an AI-generated recommendation. No real dispatch occurs until an authorized human approves it above; approval here only triggers a simulated dispatch for this demo.
      </p>
    </motion.div>
  );
}
