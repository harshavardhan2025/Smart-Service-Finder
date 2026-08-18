const BASE_URL = "/api";

const apiClient = async (endpoint, options = {}) => {
  const token = sessionStorage.getItem("authToken");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || `HTTP ${response.status}`);
    }
    return { data: await response.json(), error: null };
  } catch (err) {
    console.error(`[API] ${endpoint}:`, err.message);
    return { data: null, error: err.message };
  }
};

export const api = {
  get:    (url, opts)       => apiClient(url, { method: "GET",    ...opts }),
  post:   (url, body, opts) => apiClient(url, { method: "POST",   body: JSON.stringify(body), ...opts }),
  put:    (url, body, opts) => apiClient(url, { method: "PUT",    body: JSON.stringify(body), ...opts }),
  patch:  (url, body, opts) => apiClient(url, { method: "PATCH",  body: JSON.stringify(body), ...opts }),
  delete: (url, opts)       => apiClient(url, { method: "DELETE", ...opts }),
};

export default api;
