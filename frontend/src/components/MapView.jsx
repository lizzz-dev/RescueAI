import React, { useRef, useMemo, useState, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  Globe,
  Map as MapIcon,
  Crosshair,
  Pause,
  Play,
} from "lucide-react";

const TYPE_COLORS = {
  incident: "#f43f5e",
  criticalIncident: "#ff1744",
  Ambulance: "#38bdf8",
  "Rescue Team": "#10b981",
  "Search & Rescue Team": "#10b981",
  "Fire Unit": "#f97316",
  "Medical Team": "#a855f7",
  "Heavy Rescue Equipment": "#06b6d4",
  "Water Tanker": "#0ea5e9",
  Shelter: "#eab308",
  "Utility Team": "#64748b",
  "Food Supply": "#84cc16",
  hospital: "#ec4899",
};

/* Real geopolitical border coordinates of Pakistan (closed polygon) */
const PAKISTAN_BORDER = [
  [25.12, 62.32], [25.26, 63.47], [25.20, 64.63], [25.40, 66.50],
  [24.86, 67.00], [24.14, 67.45], [23.70, 68.10],
  [24.10, 68.90], [24.35, 70.75], [25.75, 70.20], [26.70, 70.40],
  [27.60, 71.20], [28.40, 71.80], [29.50, 72.80], [30.40, 73.50],
  [31.10, 74.50], [31.60, 74.58], [32.15, 75.05], [32.55, 74.55],
  [33.00, 74.15], [33.85, 74.10], [34.35, 73.50], [34.80, 74.40],
  [35.15, 76.10], [35.50, 76.90], [36.85, 75.43], [37.05, 74.50],
  [36.85, 73.30], [36.00, 71.60], [34.90, 71.40], [34.12, 71.10],
  [33.90, 70.10], [32.95, 69.90], [32.30, 69.40], [30.92, 66.45],
  [29.50, 65.50], [29.00, 64.00], [28.97, 61.58], [27.50, 62.60],
  [26.10, 62.00], [25.30, 61.70], [25.05, 61.75], [25.12, 62.32],
];

/* 4 Main Cardinal Reference Hubs (Minimalist text, NO bulky boxes) */
const KEY_HUBS = [
  { name: "KARACHI", lat: 24.86, lon: 67.00 },
  { name: "LAHORE", lat: 31.55, lon: 74.35 },
  { name: "ISLAMABAD", lat: 33.68, lon: 73.05 },
  { name: "QUETTA", lat: 30.18, lon: 66.98 },
];

/* Convert lat/lon to 3D sphere coordinates */
function latLonToXYZ(lat, lon, radius = 2) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

/* Disperse items near the same coordinates so they never stack on top of each other */
function dispersePoints(items, baseSpread = 0.42) {
  const groups = {};
  items.forEach((item) => {
    if (typeof item.latitude !== "number" || typeof item.longitude !== "number") return;
    const key = `${item.latitude.toFixed(1)}_${item.longitude.toFixed(1)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const result = [];
  Object.values(groups).forEach((group) => {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      group.forEach((item, idx) => {
        if (idx === 0) {
          result.push(item);
        } else {
          const angle = ((idx - 1) / (group.length - 1)) * Math.PI * 2;
          const dist = baseSpread * (0.5 + 0.5 * ((idx % 3) / 2));
          const latOffset = Math.sin(angle) * dist;
          const lonOffset = Math.cos(angle) * (dist / Math.cos((item.latitude * Math.PI) / 180));
          result.push({
            ...item,
            latitude: item.latitude + latOffset,
            longitude: item.longitude + lonOffset,
          });
        }
      });
    }
  });
  return result;
}

/* 3D Tactical Glowing Outline of Pakistan */
function PakistanBorder() {
  const points = useMemo(() => {
    return PAKISTAN_BORDER.map(([lat, lon]) => {
      const [x, y, z] = latLonToXYZ(lat, lon, 2.012);
      return new THREE.Vector3(x, y, z);
    });
  }, []);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color="#38bdf8" linewidth={2} transparent opacity={0.85} />
    </line>
  );
}

/* Minimalist Clean City Markers (Zero heavy boxes) */
function MinimalHubs() {
  return (
    <group>
      {KEY_HUBS.map((c) => {
        const pos = latLonToXYZ(c.lat, c.lon, 2.014);
        return (
          <group key={c.name} position={pos}>
            <mesh>
              <sphereGeometry args={[0.007, 8, 8]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.012, 0.015, 16]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <Html position={[0, 0.02, 0]} center style={{ pointerEvents: "none", userSelect: "none" }}>
              <span
                style={{
                  fontSize: "8px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "800",
                  color: "#38bdf8",
                  letterSpacing: "1px",
                  textShadow: "0 0 6px rgba(56, 189, 248, 0.9), 0 0 2px #000",
                  whiteSpace: "nowrap",
                }}
              >
                {c.name}
              </span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* Individual 3D Marker Beacon (Needle-sharp, non-overlapping) */
function GlobeBeacon({ lat, lon, color, size = 0.01, item, onHover, isCritical = false }) {
  const pos = useMemo(() => latLonToXYZ(lat, lon, 2.016), [lat, lon]);
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current && isCritical) {
      const s = 1 + Math.sin(clock.elapsedTime * 4.0) * 0.2;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={pos}>
      {/* Subtle tight glow for critical items */}
      {isCritical && (
        <mesh>
          <sphereGeometry args={[size * 1.5, 10, 10]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} />
        </mesh>
      )}

      {/* Sharp laser dot */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover({ ...item, color, lat, lon });
        }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

/* Tactical Reference Grid Rings */
function TacticalRings() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.006, 2.011, 64]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[2.006, 2.011, 64]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.835, 1.84, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* 3D Planetary Globe with Rotating Wireframe & Pins */
function PlanetaryGlobe({
  incidents,
  resources,
  hospitals,
  showIncidents,
  showHospitals,
  showResources,
  autoRotate,
  onHover,
  globeRef,
}) {
  // Disperse points so items in the same city fan out cleanly
  const dispersedIncidents = useMemo(() => dispersePoints(incidents, 0.45), [incidents]);
  const dispersedHospitals = useMemo(() => dispersePoints(hospitals, 0.38), [hospitals]);
  const dispersedResources = useMemo(() => dispersePoints(resources, 0.5), [resources]);

  useFrame((_, delta) => {
    if (globeRef.current && autoRotate) {
      globeRef.current.rotation.y += delta * 0.045; // Smooth majestic rotation!
    }
  });

  return (
    <group ref={globeRef} rotation={[-0.42, 1.95, 0]}>
      {/* Solid dark core */}
      <Sphere args={[1.98, 48, 48]}>
        <meshBasicMaterial color="#060a14" />
      </Sphere>

      {/* Tactical wireframe */}
      <Sphere args={[2.0, 36, 36]}>
        <meshBasicMaterial color="#14203a" wireframe transparent opacity={0.45} />
      </Sphere>

      {/* Atmospheric halo */}
      <Sphere args={[2.02, 28, 28]}>
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.04} />
      </Sphere>

      <TacticalRings />
      <PakistanBorder />
      <MinimalHubs />

      {/* Incidents (Pulsing Red Beacons) */}
      {showIncidents &&
        dispersedIncidents.map((inc) => {
          const isCrit = inc.severity === "CRITICAL";
          return (
            <GlobeBeacon
              key={`inc-${inc.id}`}
              lat={inc.latitude}
              lon={inc.longitude}
              color={isCrit ? TYPE_COLORS.criticalIncident : TYPE_COLORS.incident}
              size={isCrit ? 0.013 : 0.009}
              isCritical={isCrit}
              item={{
                type: "Incident",
                title: inc.incident_type,
                location: inc.location,
                severity: inc.severity,
                status: inc.status,
              }}
              onHover={onHover}
            />
          );
        })}

      {/* Hospitals (Pink Medical Beacons) */}
      {showHospitals &&
        dispersedHospitals.map((h) => {
          return (
            <GlobeBeacon
              key={`hosp-${h.id}`}
              lat={h.latitude}
              lon={h.longitude}
              color={TYPE_COLORS.hospital}
              size={0.008}
              item={{
                type: "Hospital",
                title: h.name,
                city: h.city,
                beds: `${h.emergency_beds} ER / ${h.icu_beds} ICU`,
              }}
              onHover={onHover}
            />
          );
        })}

      {/* Resources (Ambulances, SAR, Fire Units) */}
      {showResources &&
        dispersedResources.map((r) => {
          const col = TYPE_COLORS[r.resource_type] || "#38bdf8";
          return (
            <GlobeBeacon
              key={`res-${r.id}`}
              lat={r.latitude}
              lon={r.longitude}
              color={col}
              size={0.006}
              item={{
                type: "Resource",
                title: r.name,
                category: r.resource_type,
                status: r.status,
              }}
              onHover={onHover}
            />
          );
        })}
    </group>
  );
}

/* Ambient Orbiting Telemetry Particles */
function GlobeParticles({ count = 90 }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi);
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, [count]);

  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.014} color="#38bdf8" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

/* Camera Helper to Recenter Pakistan */
function CameraHelper({ controlsRef, globeRef }) {
  const { camera } = useThree();

  useEffect(() => {
    window.__rescueai_focus_pakistan = () => {
      if (globeRef.current) {
        globeRef.current.rotation.set(-0.42, 1.95, 0);
      }
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      camera.position.set(0, 0, 2.75);
    };
    return () => {
      delete window.__rescueai_focus_pakistan;
    };
  }, [camera, controlsRef, globeRef]);

  return null;
}

/* 3D Scene Root */
function GlobeScene({
  incidents,
  resources,
  hospitals,
  showIncidents,
  showHospitals,
  showResources,
  autoRotate,
  onHover,
  globeRef,
  controlsRef,
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.75], fov: 45 }}
      style={{ width: "100%", height: "100%", background: "#060a14" }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#060a14"]} />
      <ambientLight intensity={0.7} />
      <pointLight position={[6, 6, 6]} intensity={0.9} />
      <pointLight position={[-6, -4, -6]} intensity={0.4} color="#38bdf8" />

      <PlanetaryGlobe
        incidents={incidents}
        resources={resources}
        hospitals={hospitals}
        showIncidents={showIncidents}
        showHospitals={showHospitals}
        showResources={showResources}
        autoRotate={autoRotate}
        onHover={onHover}
        globeRef={globeRef}
      />
      <GlobeParticles />
      <CameraHelper controlsRef={controlsRef} globeRef={globeRef} />

      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan={false}
        minDistance={2.12}
        maxDistance={6.5}
        dampingFactor={0.06}
        enableDamping
        rotateSpeed={0.65}
      />
    </Canvas>
  );
}

/* 2D Tactical Flat Grid Map — Perfectly sized and centered for the 520px container */
function FlatGridMap({
  incidents,
  resources,
  hospitals,
  showIncidents,
  showHospitals,
  showResources,
  onHover,
}) {
  const WIDTH = 920;
  const HEIGHT = 520;
  const PAD_X = 80;
  const PAD_TOP = 30;
  const PAD_BOTTOM = 95; // 95px clearance so bottom legend never covers Karachi / Gwadar

  // Geographic bounds tightly fitted to Pakistan with breathing room
  const bounds = { minLat: 23.3, maxLat: 37.4, minLon: 60.2, maxLon: 76.8 };

  const project = (lat, lon) => {
    const x = PAD_X + ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * (WIDTH - 2 * PAD_X);
    const y =
      HEIGHT -
      PAD_BOTTOM -
      ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
    return [x, y];
  };

  const borderPoints = PAKISTAN_BORDER.map(([lat, lon]) => project(lat, lon).join(",")).join(" ");

  // Disperse same-city coordinates in 2D as well so dots never stack
  const dispersedIncidents = useMemo(() => dispersePoints(incidents, 0.45), [incidents]);
  const dispersedHospitals = useMemo(() => dispersePoints(hospitals, 0.38), [hospitals]);
  const dispersedResources = useMemo(() => dispersePoints(resources, 0.5), [resources]);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#060a14" rx="10" />

      {/* Tactical Lat/Lon Grid lines with coordinate labels */}
      {[26, 30, 34].map((latVal) => {
        const [, y] = project(latVal, bounds.minLon);
        return (
          <g key={`lat-${latVal}`}>
            <line x1={0} y1={y} x2={WIDTH} y2={y} stroke="#14203a" strokeWidth="0.75" strokeDasharray="3 3" />
            <text x={12} y={y + 3} fill="#475569" fontSize="9" fontFamily="monospace">
              {latVal}°N
            </text>
          </g>
        );
      })}

      {[64, 68, 72, 76].map((lonVal) => {
        const [x] = project(bounds.minLat, lonVal);
        return (
          <g key={`lon-${lonVal}`}>
            <line x1={x} y1={0} x2={x} y2={HEIGHT} stroke="#14203a" strokeWidth="0.75" strokeDasharray="3 3" />
            <text x={x - 10} y={20} fill="#475569" fontSize="9" fontFamily="monospace">
              {lonVal}°E
            </text>
          </g>
        );
      })}

      {/* Pakistan Border SVG Polygon with tactical glow */}
      <polygon
        points={borderPoints}
        fill="rgba(56, 189, 248, 0.04)"
        stroke="#38bdf8"
        strokeWidth="1.6"
        strokeDasharray="5 3"
      />

      {/* Key City Landmark Hubs */}
      {KEY_HUBS.map((c) => {
        const [x, y] = project(c.lat, c.lon);
        return (
          <g key={c.name}>
            <circle cx={x} cy={y} r={3} fill="#38bdf8" />
            <circle cx={x} cy={y} r={7} fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
            <text
              x={x + 9}
              y={y + 3}
              fill="#38bdf8"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="0.5px"
            >
              {c.name}
            </text>
          </g>
        );
      })}

      {/* Hospitals */}
      {showHospitals &&
        dispersedHospitals.map((h) => {
          const [x, y] = project(h.latitude, h.longitude);
          return (
            <g
              key={`h-${h.id}`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() =>
                onHover &&
                onHover({
                  type: "Hospital",
                  title: h.name,
                  city: h.city,
                  beds: `${h.emergency_beds} ER / ${h.icu_beds} ICU`,
                  color: TYPE_COLORS.hospital,
                  lat: h.latitude,
                  lon: h.longitude,
                })
              }
              onMouseLeave={() => onHover && onHover(null)}
            >
              <rect x={x - 3} y={y - 3} width="6" height="6" fill={TYPE_COLORS.hospital} rx="1" />
              <title>{`${h.name} (${h.city})`}</title>
            </g>
          );
        })}

      {/* Resources */}
      {showResources &&
        dispersedResources.map((r) => {
          const [x, y] = project(r.latitude, r.longitude);
          const col = TYPE_COLORS[r.resource_type] || "#38bdf8";
          return (
            <g
              key={`r-${r.id}`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() =>
                onHover &&
                onHover({
                  type: "Resource",
                  title: r.name,
                  category: r.resource_type,
                  status: r.status,
                  color: col,
                  lat: r.latitude,
                  lon: r.longitude,
                })
              }
              onMouseLeave={() => onHover && onHover(null)}
            >
              <circle cx={x} cy={y} r={2.5} fill={col} />
              <title>{`${r.name} (${r.resource_type})`}</title>
            </g>
          );
        })}

      {/* Incidents */}
      {showIncidents &&
        dispersedIncidents.map((inc) => {
          const [x, y] = project(inc.latitude, inc.longitude);
          const isCrit = inc.severity === "CRITICAL";
          const col = isCrit ? TYPE_COLORS.criticalIncident : TYPE_COLORS.incident;
          return (
            <g
              key={`i-${inc.id}`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() =>
                onHover &&
                onHover({
                  type: "Incident",
                  title: inc.incident_type,
                  location: inc.location,
                  severity: inc.severity,
                  status: inc.status,
                  color: col,
                  lat: inc.latitude,
                  lon: inc.longitude,
                })
              }
              onMouseLeave={() => onHover && onHover(null)}
            >
              {isCrit && <circle cx={x} cy={y} r={7} fill="none" stroke={col} strokeWidth="1" opacity="0.6" />}
              <circle cx={x} cy={y} r={isCrit ? 4.5 : 3.5} fill={col} />
              <title>{`${inc.incident_type} (${inc.location}) — ${inc.severity || ""}`}</title>
            </g>
          );
        })}
    </svg>
  );
}

/* Main Tactical Map View Export */
export default function MapView({ incidents = [], resources = [], hospitals = [] }) {
  const [viewMode, setViewMode] = useState("3d");
  const [hovered, setHovered] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true); // Auto-rotate ON by default!

  // Incidents & Hospitals active by default, Fleets toggleable to keep view clear
  const [showIncidents, setShowIncidents] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showResources, setShowResources] = useState(false);

  const globeRef = useRef();
  const controlsRef = useRef();

  const handleFocusPakistan = () => {
    if (window.__rescueai_focus_pakistan) {
      window.__rescueai_focus_pakistan();
    }
  };

  const activeCount =
    (showIncidents ? incidents.length : 0) +
    (showHospitals ? hospitals.length : 0) +
    (showResources ? resources.length : 0);

  return (
    <div className="map-wrapper">
      {/* Top Bar Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          padding: "10px 16px",
          background: "rgba(10, 16, 30, 0.95)",
          borderBottom: "1px solid var(--panel-border)",
          borderTopLeftRadius: "var(--radius-lg)",
          borderTopRightRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Crosshair size={15} color="#38bdf8" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#94a3b8", letterSpacing: "1px" }}>
            TACTICAL SECTOR // <strong style={{ color: "#38bdf8" }}>PAKISTAN EOC</strong> (
            <strong style={{ color: "#e2e8f0" }}>{activeCount} NODES</strong>)
          </span>

          <button
            onClick={handleFocusPakistan}
            title="Recenter camera on Pakistan"
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Crosshair size={12} />
            Focus Pakistan
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle 3D auto rotation"
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              background: autoRotate ? "rgba(99, 102, 241, 0.25)" : "transparent",
              color: autoRotate ? "#a5b4fc" : "#64748b",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {autoRotate ? <Pause size={11} /> : <Play size={11} />}
            {autoRotate ? "Pause" : "Spin"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            style={{
              padding: "4px 9px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              background: showIncidents ? "rgba(244, 63, 94, 0.2)" : "rgba(255,255,255,0.03)",
              color: showIncidents ? "#f43f5e" : "#64748b",
              border: showIncidents ? "1px solid #f43f5e" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontWeight: showIncidents ? "700" : "400",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f43f5e" }} />
            Crises ({incidents.length})
          </button>

          <button
            onClick={() => setShowHospitals(!showHospitals)}
            style={{
              padding: "4px 9px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              background: showHospitals ? "rgba(236, 72, 153, 0.2)" : "rgba(255,255,255,0.03)",
              color: showHospitals ? "#ec4899" : "#64748b",
              border: showHospitals ? "1px solid #ec4899" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontWeight: showHospitals ? "700" : "400",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "2px", background: "#ec4899" }} />
            Hospitals ({hospitals.length})
          </button>

          <button
            onClick={() => setShowResources(!showResources)}
            style={{
              padding: "4px 9px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              background: showResources ? "rgba(56, 189, 248, 0.2)" : "rgba(255,255,255,0.03)",
              color: showResources ? "#38bdf8" : "#64748b",
              border: showResources ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontWeight: showResources ? "700" : "400",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }} />
            Fleets ({resources.length})
          </button>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setViewMode("3d")}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              background: viewMode === "3d" ? "rgba(99, 102, 241, 0.25)" : "transparent",
              color: viewMode === "3d" ? "#818cf8" : "#64748b",
              border: viewMode === "3d" ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontWeight: viewMode === "3d" ? "700" : "500",
            }}
          >
            <Globe size={12} />
            3D Globe
          </button>
          <button
            onClick={() => setViewMode("2d")}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              background: viewMode === "2d" ? "rgba(99, 102, 241, 0.25)" : "transparent",
              color: viewMode === "2d" ? "#818cf8" : "#64748b",
              border: viewMode === "2d" ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontWeight: viewMode === "2d" ? "700" : "500",
            }}
          >
            <MapIcon size={12} />
            2D Grid
          </button>
        </div>
      </div>

      <div className="globe-container" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {viewMode === "3d" ? (
          <Suspense
            fallback={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#64748b",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                }}
              >
                Acquiring orbital telemetry feed...
              </div>
            }
          >
            <GlobeScene
              incidents={incidents}
              resources={resources}
              hospitals={hospitals}
              showIncidents={showIncidents}
              showHospitals={showHospitals}
              showResources={showResources}
              autoRotate={autoRotate}
              onHover={setHovered}
              globeRef={globeRef}
              controlsRef={controlsRef}
            />
          </Suspense>
        ) : (
          <FlatGridMap
            incidents={incidents}
            resources={resources}
            hospitals={hospitals}
            showIncidents={showIncidents}
            showHospitals={showHospitals}
            showResources={showResources}
            onHover={setHovered}
          />
        )}

        {hovered && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              zIndex: 25,
              background: "rgba(6, 10, 20, 0.95)",
              border: `1px solid ${hovered.color}`,
              boxShadow: `0 0 24px rgba(0,0,0,0.9), 0 0 12px ${hovered.color}44`,
              borderRadius: "8px",
              padding: "12px 16px",
              maxWidth: "300px",
              backdropFilter: "blur(14px)",
              fontFamily: "var(--font-mono)",
              pointerEvents: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: hovered.color,
                  boxShadow: `0 0 8px ${hovered.color}`,
                }}
              />
              <span style={{ fontSize: "11px", color: hovered.color, fontWeight: "700", textTransform: "uppercase" }}>
                {hovered.type} TELEMETRY
              </span>
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#f8fafc", marginBottom: "4px" }}>
              {hovered.title}
            </div>
            {hovered.location && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>
                Location: <span style={{ color: "#e2e8f0" }}>{hovered.location}</span>
              </div>
            )}
            {hovered.city && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>
                City: <span style={{ color: "#e2e8f0" }}>{hovered.city}</span>
              </div>
            )}
            {hovered.severity && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>
                Severity: <span style={{ color: hovered.color, fontWeight: "700" }}>{hovered.severity}</span>
              </div>
            )}
            {hovered.status && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>
                Status: <span style={{ color: "#38bdf8" }}>{hovered.status}</span>
              </div>
            )}
            {hovered.beds && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>
                Capacity: <span style={{ color: "#ec4899" }}>{hovered.beds}</span>
              </div>
            )}
            <div
              style={{
                fontSize: "10px",
                color: "#64748b",
                marginTop: "6px",
                borderTop: "1px solid #14203a",
                paddingTop: "4px",
              }}
            >
              GPS: {hovered.lat?.toFixed(4)}° N, {hovered.lon?.toFixed(4)}° E
            </div>
          </div>
        )}

        <div className="globe-overlay">
          <div className="globe-legend-item">
            <div className="globe-legend-dot" style={{ background: TYPE_COLORS.incident }} />
            <span>Crises ({incidents.length})</span>
          </div>
          <div className="globe-legend-item">
            <div className="globe-legend-dot" style={{ background: TYPE_COLORS.hospital }} />
            <span>Hospitals ({hospitals.length})</span>
          </div>
          <div className="globe-legend-item">
            <div className="globe-legend-dot" style={{ background: TYPE_COLORS.Ambulance }} />
            <span>Ambulance</span>
          </div>
          <div className="globe-legend-item">
            <div className="globe-legend-dot" style={{ background: TYPE_COLORS["Rescue Team"] }} />
            <span>SAR Teams</span>
          </div>
          <div className="globe-legend-item">
            <div className="globe-legend-dot" style={{ background: "#38bdf8" }} />
            <span>Tactical Border</span>
          </div>
        </div>
      </div>

      <p
        style={{
          marginTop: "8px",
          textAlign: "center",
          color: "#64748b",
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
        }}
      >
        Scroll to zoom in/out • Drag to rotate 3D sphere • Click "Focus Pakistan" to center • Hover nodes for telemetry
      </p>
    </div>
  );
}
