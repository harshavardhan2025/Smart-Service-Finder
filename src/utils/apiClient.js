/**
 * 🚀 UNIFIED API GATEWAY
 * Standardized client that dynamically injects auth telemetry and executes robust try-catch cycles.
 */
const BASE_URL = "/api";

const apiClient = async (endpoint, options = {}) => {
  // Automatic Header Construction
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Security Relay: Dynamically latch on the session token automatically!
  const token = sessionStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`, config);
    
    // Advanced Status Diagnostics
    if (!response.ok) {
       const errorData = await response.json().catch(() => ({}));
       throw new Error(errorData.error || errorData.message || `HTTP FAIL: ${response.status}`);
    }

    // Auto-deserialization
    const data = await response.json();
    return { data, error: null };

  } catch (err) {
    console.error(`[API_FAILURE] URL:${endpoint} Details:`, err.message);
    return { data: null, error: err.message };
  }
};

// Semantic Expressives Helpers
export const api = {
  get: (url, opts) => apiClient(url, { method: "GET", ...opts }),
  post: (url, body, opts) => apiClient(url, { method: "POST", body: JSON.stringify(body), ...opts }),
  put: (url, body, opts) => apiClient(url, { method: "PUT", body: JSON.stringify(body), ...opts }),
  patch: (url, body, opts) => apiClient(url, { method: "PATCH", body: JSON.stringify(body), ...opts }),
  delete: (url, opts) => apiClient(url, { method: "DELETE", ...opts }),
};

export default api;
