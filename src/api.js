const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
let authTokenProvider = null;

export function setApiAuthTokenProvider(provider) {
  authTokenProvider = provider;
}

async function request(path, options = {}) {
  const token = authTokenProvider ? await authTokenProvider() : null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }
  return payload;
}

export const api = {
  getUsers() {
    return request("/users");
  },
  getEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.flagged !== undefined) query.set("flagged", String(params.flagged));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/events${suffix}`);
  },
  getAlerts(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.status) query.set("status", params.status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/alerts${suffix}`);
  },
  updateAlert(alertId, body) {
    return request(`/alerts/${alertId}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  createEvent(body) {
    return request("/events", { method: "POST", body: JSON.stringify(body) });
  },
  createTransaction(body) {
    return request("/transactions", { method: "POST", body: JSON.stringify(body) });
  },
  getDashboardSummary() {
    return request("/dashboard/summary");
  },
  getMe() {
    return request("/auth/me");
  },
};
