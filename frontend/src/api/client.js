const BASE = "/api";

async function request(path, options = {}) {
  let res;
  let url = `${BASE}${path}`;

  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (err) {
    throw new Error(`500: Network Error (${err.message || err})`);
  }

  if (!res || !res.ok) {
    let detail = res ? res.statusText : "Network Error";
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch (e) {
      /* ignore parse failure */
    }
    throw new Error(`${res ? res.status : 500}: ${detail}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Incidents
  listIncidents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/incidents${qs ? `?${qs}` : ""}`);
  },
  getIncident: (id) => request(`/incidents/${id}`),
  createIncident: (payload) =>
    request(`/incidents`, { method: "POST", body: JSON.stringify(payload) }),
  addReport: (id, payload) =>
    request(`/incidents/${id}/reports`, { method: "POST", body: JSON.stringify(payload) }),
  analyzeIncident: (id) => request(`/incidents/${id}/analyze`, { method: "POST" }),
  getResponsePlan: (id) => request(`/incidents/${id}/response-plan`),
  approveResponse: (id, payload) =>
    request(`/incidents/${id}/approve`, { method: "POST", body: JSON.stringify(payload) }),
  rejectResponse: (id, payload) =>
    request(`/incidents/${id}/reject`, { method: "POST", body: JSON.stringify(payload) }),
  resolveIncident: (id) => request(`/incidents/${id}/resolve`, { method: "POST" }),

  // Resources / hospitals
  listResources: () => request(`/resources`),
  listAvailableResources: () => request(`/resources/available`),
  listHospitals: () => request(`/hospitals`),

  // Dashboard / analytics
  dashboardStats: () => request(`/dashboard/stats`),
  dashboardAnalytics: () => request(`/dashboard/analytics`),

  // Audit / notifications
  listAuditLogs: (incidentId) =>
    request(`/audit-logs${incidentId ? `?incident_id=${incidentId}` : ""}`),
  listNotifications: () => request(`/notifications`),

  // Demo mode
  loadDemoScenario: () => request(`/demo/load-scenario`, { method: "POST" }),
};
