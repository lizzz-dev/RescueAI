import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crosshair } from "lucide-react";
import { api } from "../api/client.js";
import MapView from "../components/MapView.jsx";

export default function MapPage() {
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listIncidents(), api.listResources(), api.listHospitals()])
      .then(([i, r, h]) => {
        setIncidents(i);
        setResources(r);
        setHospitals(h);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h2>Tactical Map</h2>
          <p className="header-subtitle">Interactive 3D globe with real-time incident and resource overlay.</p>
        </div>
        <motion.div
          className="telemetry-pill"
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crosshair size={13} />
          LIVE TACTICAL OVERLAY
        </motion.div>
      </div>
      {loading && <p className="muted" style={{ fontFamily: "var(--font-mono)" }}>Acquiring satellite feed...</p>}
      <motion.div
        className="section-card"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ padding: 0, overflow: "hidden" }}
      >
        <MapView incidents={incidents} resources={resources} hospitals={hospitals} />
      </motion.div>
    </div>
  );
}
