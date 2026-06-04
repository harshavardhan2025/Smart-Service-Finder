import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import "leaflet/dist/leaflet.css";
import App from './App';
import reportWebVitals from './reportWebVitals';

// 🔒 GLOBAL AUTONOMOUS FETCH INTERCEPTOR
// Transparently upgrade every native fetch across the entire runtime cluster to satisfy Backend Security Protocols!
const originalFetch = window.fetch;
window.fetch = function() {
  let [resource, config] = arguments;
  
  // Only inject into internal API traffic to prevent token leakage to external domain partners!
  const isInternalApi = typeof resource === 'string' && (resource.includes('/api') || resource.startsWith('/'));
  
  if (isInternalApi) {
    const token = sessionStorage.getItem("authToken");
    if (token) {
      config = config || {};
      config.headers = config.headers || {};
      
      // Standardize map vs object headers recursively
      if (config.headers instanceof Headers) {
         if (!config.headers.has('Authorization')) {
            config.headers.set('Authorization', `Bearer ${token}`);
         }
      } else {
         if (!config.headers['Authorization']) {
            config.headers['Authorization'] = `Bearer ${token}`;
         }
      }
    }
  }
  return originalFetch(resource, config);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
