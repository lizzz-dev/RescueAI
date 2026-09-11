import React, { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";

const TYPE_COLORS = {
  incident: "#f43f5e",
  Ambulance: "#6384ff",
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

/* Individual 3D Marker with backface culling and fixed scale */
function GlobeMarker({ lat, lon, color, size = 0.06, label, pulse = false }) {
  const pos = useMemo(() => latLonToXYZ(lat, lon, 2.02), [lat, lon]);
  const groupRef = useRef();
  const meshRef = useRef();
  const [isFacingCamera, setIsFacingCamera] = useState(true);

  // Scratch vectors to avoid allocations in render loop
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const toCam = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock, camera }) => {
    if (!groupRef.current) return;

    // Pulse animation
    if (meshRef.current && pulse) {
      const s = 1 + Math.sin(clock.elapsedTime * 3.5) * 0.25;
      meshRef.current.scale.set(s, s, s);
    }

    // Mathematical Backface Culling: check if marker is facing the camera
    groupRef.current.getWorldPosition(worldPos);
    toCam.subVectors(camera.position, worldPos);
    const facing = worldPos.dot(toCam) > 0.1;
    if (facing !== isFacingCamera) {
      setIsFacingCamera(facing);
    }
  });

  return (
    <group ref={groupRef} position={pos}>
      {/* Outer pulsing halo */}
      {pulse && (
        <mesh>
          <sphereGeometry args={[size * 2.2, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.16} />
        </mesh>
      )}

      {/* Main 3D beacon dot */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Crisp 2D Tag — only shown when on front hemisphere, NO distanceFactor, NO blur */}
      {label && isFacingCamera && (
        <Html
          position={[0, size * 1.6, 0]}
          center
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div
            style={{
              background: "#0a0f1e",
              border: `1px solid ${color}`,
              padding: "2px 7px",
              borderRadius: "4px",
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: "600",
              color: "#e2e8f0",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(0,0,0,0.7)",
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

/* 3D Planetary Globe with Rotating Wireframe & Pins */
function PlanetaryGlobe({ incidents, resources, hospitals }) {
  const globeGroupRef = useRef();

  // Auto-rotate the globe and its surface markers together
  useFrame((_, delta) => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={globeGroupRef}>
      {/* Solid dark core */}
      <Sphere args={[1.98, 48, 48]}>
        <meshBasicMaterial color="#0a0f1e" />
      </Sphere>

      {/* Lat/Lon tactical wireframe */}
      <Sphere args={[2.0, 32, 32]}>
        <meshBasicMaterial color="#1e2a4a" wireframe transparent opacity={0.4} />
      </Sphere>

      {/* Atmospheric cyan halo */}
      <Sphere args={[2.01, 24, 24]}>
        <meshBasicMaterial color="#6384ff" wireframe transparent opacity={0.06} />
      </Sphere>

      {/* Incidents (Pulsing Red) */}
      {incidents.map(
        (inc) =>
          typeof inc.latitude === "number" && (
            <GlobeMarker
              key={`inc-${inc.id}`}
              lat={inc.latitude}
              lon={inc.longitude}
              color={TYPE_COLORS.incident}
              size={0.065}
              pulse
              label={`${inc.incident_type} — ${inc.severity || "?"}`}
            />
          )
      )}

      {/* Resources */}
      {resources.map(
        (r) =>
          typeof r.latitude === "number" && (
            <GlobeMarker
              key={`res-${r.id}`}
              lat={r.latitude}
              lon={r.longitude}
              color={TYPE_COLORS[r.resource_type] || "#94a3b8"}
              size={0.042}
              label={`${r.name} (${r.status})`}
            />
          )
      )}

      {/* Hospitals */}
      {hospitals.map(
        (h) =>
          typeof h.latitude === "number" && (
            <GlobeMarker
              key={`hosp-${h.id}`}
              lat={h.latitude}
              lon={h.longitude}
              color={TYPE_COLORS.hospital}
              size={0.05}
              label={`${h.name} — ${h.emergency_beds} ER`}
            />
          )
      )}
    </group>
  );
}

/* Ambient Orbiting Particles */
function GlobeParticles({ count = 100 }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.8 + Math.random() * 1.5;
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
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#6384ff" transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

/* 3D Scene Root */
function GlobeScene({ incidents, resources, hospitals }) {
  return (
    <Canvas
      camera={{ position: [0, 1, 5], fov: 45 }}
      style={{ width: "100%", height: "100%", background: "#0a0f1e" }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={["#0a0f1e"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 6, 6]} intensity={0.6} />

      <PlanetaryGlobe incidents={incidents} resources={resources} hospitals={hospitals} />
      <GlobeParticles />

      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate={false}
        minDistance={3.5}
        maxDistance={8}
        dampingFactor={0.05}
        enableDamping
      />
    </Canvas>
  );
}

/* Fallback SVG Map (when WebGL disabled) */
function FallbackMap({ incidents, resources, hospitals }) {
  const WIDTH = 640,
    HEIGHT = 440,
    PAD = 30;
  const all = [
    ...incidents.map((i) => ({ lat: i.latitude, lon: i.longitude })),
    ...resources.map((r) => ({ lat: r.latitude, lon: r.longitude })),
    ...hospitals.map((h) => ({ lat: h.latitude, lon: h.longitude })),
  ].filter((p) => typeof p.lat === "number" && typeof p.lon === "number");

  const bounds =
    all.length === 0
      ? { minLat: 24.8, maxLat: 24.95, minLon: 66.95, maxLon: 67.1 }
      : (() => {
          const lats = all.map((p) => p.lat),
            lons = all.map((p) => p.lon);
          const pad = 0.01;
          return {
            minLat: Math.min(...lats) - pad,
            maxLat: Math.max(...lats) + pad,
            minLon: Math.min(...lons) - pad,
            maxLon: Math.max(...lons) + pad,
          };
        })();

  const project = (lat, lon) => {
    const x = PAD + ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon || 1)) * (WIDTH - 2 * PAD);
    const y = HEIGHT - PAD - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * (HEIGHT - 2 * PAD);
    return [x, y];
  };

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: "100%", borderRadius: "10px" }}>
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#0a0f1e" rx="10" />
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={(HEIGHT / 8) * i}
          x2={WIDTH}
          y2={(HEIGHT / 8) * i}
          stroke="#1e2a4a"
          strokeWidth="0.5"
        />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={(WIDTH / 10) * i}
          y1={0}
          x2={(WIDTH / 10) * i}
          y2={HEIGHT}
          stroke="#1e2a4a"
          strokeWidth="0.5"
        />
      ))}
      {hospitals.map((h) => {
        const [x, y] = project(h.latitude, h.longitude);
        return (
          <g key={`h-${h.id}`}>
            <rect x={x - 5} y={y - 5} width="10" height="10" fill={TYPE_COLORS.hospital} rx="2" />
            <title>{h.name}</title>
          </g>
        );
      })}
      {resources.map((r) => {
        const [x, y] = project(r.latitude, r.longitude);
        return (
          <g key={`r-${r.id}`}>
            <circle cx={x} cy={y} r={4} fill={TYPE_COLORS[r.resource_type] || "#94a3b8"} />
            <title>{r.name}</title>
          </g>
        );
      })}
      {incidents.map((inc) => {
        const [x, y] = project(inc.latitude, inc.longitude);
        return (
          <g key={`i-${inc.id}`}>
            <circle cx={x} cy={y} r={7} fill="none" stroke={TYPE_COLORS.incident} strokeWidth="1.5" />
            <circle cx={x} cy={y} r={3} fill={TYPE_COLORS.incident} />
            <title>{inc.incident_type}</title>
          </g>
        );
      })}
    </svg>
  );
}

/* Main Export */
export default function MapView({ incidents = [], resources = [], hospitals = [] }) {
  const webglAvailable = useMemo(() => {
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl") || canvas.getContext("webgl2"));
    } catch {
      return false;
    }
  }, []);

  return (
    <div className="map-wrapper">
      {webglAvailable ? (
        <div className="globe-container">
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
                Initializing tactical globe...
              </div>
            }
          >
            <GlobeScene incidents={incidents} resources={resources} hospitals={hospitals} />
          </Suspense>
          <div className="globe-overlay">
            <div className="globe-legend-item">
              <div className="globe-legend-dot" style={{ background: TYPE_COLORS.incident }} />
              <span>Incident</span>
            </div>
            <div className="globe-legend-item">
              <div className="globe-legend-dot" style={{ background: TYPE_COLORS.hospital }} />
              <span>Hospital</span>
            </div>
            <div className="globe-legend-item">
              <div className="globe-legend-dot" style={{ background: TYPE_COLORS.Ambulance }} />
              <span>Ambulance</span>
            </div>
            <div className="globe-legend-item">
              <div className="globe-legend-dot" style={{ background: TYPE_COLORS["Rescue Team"] }} />
              <span>SAR Team</span>
            </div>
            <div className="globe-legend-item">
              <div className="globe-legend-dot" style={{ background: TYPE_COLORS["Fire Unit"] }} />
              <span>Fire Unit</span>
            </div>
          </div>
        </div>
      ) : (
        <FallbackMap incidents={incidents} resources={resources} hospitals={hospitals} />
      )}
      <p className="map-disclaimer">
        Drag to rotate • Scroll to zoom • Synthetic demo coordinates (Karachi sample environment)
      </p>
    </div>
  );
}
