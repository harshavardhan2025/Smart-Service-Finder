import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'leaflet/dist/leaflet.css';
import App from './App';

// Inject auth token into all internal API requests
const originalFetch = window.fetch;
window.fetch = function(resource, config) {
  const isInternal = typeof resource === 'string' && (resource.includes('/api') || resource.startsWith('/'));
  if (isInternal) {
    const token = sessionStorage.getItem("authToken");
    if (token) {
      config = config || {};
      config.headers = config.headers || {};
      if (config.headers instanceof Headers) {
        if (!config.headers.has('Authorization')) config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        if (!config.headers['Authorization']) config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }
  return originalFetch(resource, config);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
