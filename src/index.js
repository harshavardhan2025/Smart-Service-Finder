import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'leaflet/dist/leaflet.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Inject auth token into all internal API requests
const originalFetch = window.fetch;
window.fetch = function(resource, config) {
  const isInternal = typeof resource === 'string' && (resource.includes('/api') || resource.startsWith('/'));
  if (isInternal) {
    let token = sessionStorage.getItem("authToken") || sessionStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("token");
    if (!token) {
      try {
        const raw = localStorage.getItem("authSession");
        if (raw) {
          const s = JSON.parse(raw);
          token = s.authToken || s.token;
        }
      } catch (e) {}
    }
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

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "849555982996-giolb22mkrfbg8c4ut0ohbv1ps9giv2o.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
