import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  AlertOctagon,
  Map,
  Truck,
  Building2,
  BarChart3,
  Bell,
  FileText,
  ShieldAlert,
  Radio,
  Clock,
  Activity,
} from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import Incidents from "./pages/Incidents.jsx";
import IncidentDetail from "./pages/IncidentDetail.jsx";
import Resources from "./pages/Resources.jsx";
import Hospitals from "./pages/Hospitals.jsx";
import MapPage from "./pages/MapPage.jsx";
import Analytics from "./pages/Analytics.jsx";
import Notifications from "./pages/Notifications.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";

const NAV_ITEMS = [
  { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
  { id: "incidents", label: "Active Incidents", icon: AlertOctagon },
  { id: "map", label: "Tactical Map", icon: Map },
  { id: "resources", label: "Rescue Fleets", icon: Truck },
  { id: "hospitals", label: "Trauma & ICU", icon: Building2 },
  { id: "analytics", label: "Telemetry & Stats", icon: BarChart3 },
  { id: "notifications", label: "Comms & Alerts", icon: Bell },
  { id: "audit", label: "Audit Ledger", icon: FileText },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-GB", { hour12: false }) + " PKT");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const openIncident = (id) => {
    setSelectedIncidentId(id);
    setPage("incident-detail");
  };

  const navigate = (id) => {
    setSelectedIncidentId(null);
    setPage(id);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard onOpenIncident={openIncident} onNavigate={navigate} />;
      case "incidents":
        return <Incidents onOpenIncident={openIncident} />;
      case "incident-detail":
        return <IncidentDetail incidentId={selectedIncidentId} onBack={() => navigate("incidents")} />;
      case "map":
        return <MapPage />;
      case "resources":
        return <Resources />;
      case "hospitals":
        return <Hospitals />;
      case "analytics":
        return <Analytics />;
      case "notifications":
        return <Notifications />;
      case "audit":
        return <AuditLogs />;
      default:
        return <Dashboard onOpenIncident={openIncident} onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-shell">
      {/* Tactical Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="brand-title">RESCUE.AI</div>
            <div className="brand-subtitle">
              <span className="badge-dot"></span>
              TACTICAL EOC
            </div>
          </div>
        </div>

        <div className="nav-section-label">Operations</div>
        <nav>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id || (item.id === "incidents" && page === "incident-detail");
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => navigate(item.id)}
              >
                <span className="nav-icon"><Icon size={17} /></span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="commander-badge">
            <div className="commander-avatar">AK</div>
            <div>
              <div className="commander-info-title">Amir Khan</div>
              <div className="commander-info-role">COMMANDER // NDMA 1122</div>
            </div>
          </div>
          <p className="sidebar-disclaimer">
            Decision-support telemetry only. Real-world dispatch strictly requires human commander authorization.
          </p>
        </div>
      </aside>

      {/* Main Content Area with Tactical Telemetry Top Bar */}
      <div className="main-wrapper">
        <header className="telemetry-header">
          <div className="telemetry-left">
            <div className="telemetry-pill">
              <span className="live-indicator"></span>
              LIVE TELEMETRY // AI ENGINE ACTIVE
            </div>
            <div className="defcon-pill">
              <Activity size={13} />
              READINESS: DEFCON 2
            </div>
          </div>
          <div className="telemetry-right">
            <div className="telemetry-clock">
              <Clock size={14} />
              <span className="clock-highlight">{currentTime || "20:45:00 PKT"}</span>
            </div>
          </div>
        </header>

        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
