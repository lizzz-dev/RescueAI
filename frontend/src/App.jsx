import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
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
  Menu,
  X,
} from "lucide-react";
import PageTransition from "./components/PageTransition.jsx";
import ParticleBackground from "./components/ParticleBackground.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Incidents from "./pages/Incidents.jsx";
import IncidentDetail from "./pages/IncidentDetail.jsx";
import Resources from "./pages/Resources.jsx";
import Hospitals from "./pages/Hospitals.jsx";
import MapPage from "./pages/MapPage.jsx";
import Analytics from "./pages/Analytics.jsx";
import Notifications from "./pages/Notifications.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import TacticalOperatorModal, { OPERATOR_PRESETS } from "./components/TacticalOperatorModal.jsx";

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

const PRIMARY_MOBILE_TABS = [
  { id: "dashboard", label: "Command", icon: LayoutDashboard },
  { id: "incidents", label: "Incidents", icon: AlertOctagon },
  { id: "map", label: "Tactical Map", icon: Map },
  { id: "resources", label: "Fleets", icon: Truck },
];

const SECONDARY_MOBILE_TABS = [
  { id: "hospitals", label: "Trauma & ICU", icon: Building2, desc: "Real-time bed telemetry & ER load" },
  { id: "analytics", label: "Telemetry & Stats", icon: BarChart3, desc: "District risk metrics & MTTT" },
  { id: "notifications", label: "Comms & Alerts", icon: Bell, desc: "Broadcast dispatch orders & alerts" },
  { id: "audit", label: "Audit Ledger", icon: FileText, desc: "Cryptographic chain-of-custody logs" },
];

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.warn("RescueAI module render error caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="section-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <h3 style={{ color: "#f43f5e", marginBottom: "8px" }}>Telemetry Feed Exception</h3>
          <p className="muted" style={{ marginBottom: "20px" }}>
            This view encountered a display error. You can reset it or navigate using the sidebar without refreshing.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reset Module View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [activeOperator, setActiveOperator] = useState(() => {
    try {
      const saved = localStorage.getItem("rescueai_active_operator");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return OPERATOR_PRESETS[1]; // Defaults to Tariq Malik // COMMANDER // NDMA 1122
  });

  const handleSelectOperator = (op) => {
    setActiveOperator(op);
    try {
      localStorage.setItem("rescueai_active_operator", JSON.stringify(op));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent("rescueai_operator_changed", { detail: op }));
    setShowOperatorModal(false);
  };

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
    setShowMobileMore(false);
  };

  const navigate = (id) => {
    setSelectedIncidentId(null);
    setPage(id);
    setShowMobileMore(false);
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
      {/* Ambient particle network */}
      <ParticleBackground />

      {/* Tactical Sidebar */}
      <aside className="sidebar">
        <div
          className="sidebar-brand"
          onClick={() => navigate("dashboard")}
          title="Return to Command Center"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("dashboard")}
        >
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
          <div
            className="commander-badge interactive"
            onClick={() => setShowOperatorModal(true)}
            role="button"
            tabIndex={0}
            title="Click to Switch Tactical Callsign or Operational Role"
            onKeyDown={(e) => e.key === "Enter" && setShowOperatorModal(true)}
          >
            <div
              className="commander-avatar"
              style={{
                background: `linear-gradient(135deg, #1e3a8a, ${activeOperator?.color || "var(--cyan)"})`,
              }}
            >
              {activeOperator?.initials || "OP"}
            </div>
            <div className="commander-info">
              <div className="commander-info-title-row">
                <span className="commander-info-title">{activeOperator?.name || "OPERATOR-01"}</span>
                <span className="commander-status-dot" title="COMMS ONLINE // ENCRYPTED"></span>
              </div>
              <div className="commander-info-role">{activeOperator?.role || "TACTICAL CONTROLLER // NDMA HQ"}</div>
            </div>
            <div className="commander-switch-hint">
              <span>SWITCH</span>
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
            {/* Mobile Operator Quick Trigger */}
            <button
              className="mobile-operator-badge"
              onClick={() => setShowOperatorModal(true)}
              title={`Callsign: ${activeOperator?.name || "Tariq Malik"} // Tap to Switch`}
              aria-label="Tactical Operator Switcher"
            >
              <div
                className="mobile-operator-avatar"
                style={{
                  background: `linear-gradient(135deg, #1e3a8a, ${activeOperator?.color || "var(--cyan)"})`,
                }}
              >
                {activeOperator?.initials || "TM"}
              </div>
            </button>
          </div>
        </header>

        <main className="main-content">
          <AnimatePresence mode="wait">
            <PageTransition pageKey={page + (selectedIncidentId || "")}>
              <ErrorBoundary key={page}>
                {renderPage()}
              </ErrorBoundary>
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      {/* Fixed Tactical Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {PRIMARY_MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = page === tab.id || (tab.id === "incidents" && page === "incident-detail");
          return (
            <button
              key={tab.id}
              className={`mobile-nav-btn ${isActive ? "active" : ""}`}
              onClick={() => navigate(tab.id)}
            >
              <span className="mobile-nav-icon"><Icon size={18} /></span>
              <span className="mobile-nav-label">{tab.label}</span>
            </button>
          );
        })}
        <button
          className={`mobile-nav-btn ${showMobileMore || SECONDARY_MOBILE_TABS.some((t) => t.id === page) ? "active" : ""}`}
          onClick={() => setShowMobileMore(!showMobileMore)}
          aria-expanded={showMobileMore}
          aria-label="More Tactical Modules"
        >
          <span className="mobile-nav-icon">
            {showMobileMore ? <X size={18} /> : <Menu size={18} />}
          </span>
          <span className="mobile-nav-label">More</span>
        </button>
      </nav>

      {/* Mobile More Tactical Drawer */}
      <AnimatePresence>
        {showMobileMore && (
          <>
            <div
              className="mobile-drawer-backdrop"
              onClick={() => setShowMobileMore(false)}
            />
            <div className="mobile-drawer-sheet">
              <div className="mobile-drawer-handle" />
              <div className="mobile-drawer-header">
                <div>
                  <div className="mobile-drawer-title">Tactical Modules</div>
                  <div className="mobile-drawer-subtitle">RescueAI Operations & Telemetry</div>
                </div>
                <button
                  className="mobile-drawer-close"
                  onClick={() => setShowMobileMore(false)}
                  aria-label="Close Drawer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Active Operator Quick Switch in Drawer */}
              <div
                className="mobile-drawer-operator"
                onClick={() => {
                  setShowMobileMore(false);
                  setShowOperatorModal(true);
                }}
                role="button"
                tabIndex={0}
              >
                <div
                  className="mobile-drawer-op-avatar"
                  style={{
                    background: `linear-gradient(135deg, #1e3a8a, ${activeOperator?.color || "var(--cyan)"})`,
                  }}
                >
                  {activeOperator?.initials || "TM"}
                </div>
                <div className="mobile-drawer-op-info">
                  <div className="mobile-drawer-op-name">{activeOperator?.name || "Tariq Malik"}</div>
                  <div className="mobile-drawer-op-role">{activeOperator?.role || "COMMANDER // NDMA 1122"}</div>
                </div>
                <div className="mobile-drawer-op-badge">SWITCH</div>
              </div>

              <div className="mobile-drawer-list">
                {SECONDARY_MOBILE_TABS.map((item) => {
                  const Icon = item.icon;
                  const isActive = page === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`mobile-drawer-item ${isActive ? "active" : ""}`}
                      onClick={() => navigate(item.id)}
                    >
                      <div className="mobile-drawer-item-icon"><Icon size={18} /></div>
                      <div className="mobile-drawer-item-text">
                        <div className="mobile-drawer-item-title">{item.label}</div>
                        <div className="mobile-drawer-item-desc">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Tactical Callsign & Operator Switcher Modal */}
      <AnimatePresence>
        {showOperatorModal && (
          <TacticalOperatorModal
            activeOperator={activeOperator}
            onSelect={handleSelectOperator}
            onClose={() => setShowOperatorModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
