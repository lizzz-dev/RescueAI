import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listHospitals().then(setHospitals).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header"><h2>Hospitals</h2></div>
      {loading && <p className="muted">Loading hospitals...</p>}
      <div className="hospital-grid">
        {hospitals.map((h) => {
          const total = h.emergency_beds + h.icu_beds;
          const loadPct = total ? Math.round((h.current_load / total) * 100) : 0;
          return (
            <div className="hospital-card" key={h.id}>
              <div className="hospital-card-header">
                <h4>{h.name}</h4>
                <span className={`status-tag status-${h.status.toLowerCase()}`}>{h.status}</span>
              </div>
              <div className="hospital-stats">
                <div><span className="muted">Emergency beds</span><div>{h.emergency_beds}</div></div>
                <div><span className="muted">ICU beds</span><div>{h.icu_beds}</div></div>
                <div><span className="muted">Trauma capacity</span><div>{h.trauma_capacity}</div></div>
              </div>
              <div className="confidence-track" style={{ marginTop: 10 }}>
                <div
                  className="confidence-fill"
                  style={{ width: `${loadPct}%`, backgroundColor: loadPct > 80 ? "#dc2626" : loadPct > 50 ? "#ca8a04" : "#16a34a" }}
                />
              </div>
              <div className="muted small">{loadPct}% current load</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
