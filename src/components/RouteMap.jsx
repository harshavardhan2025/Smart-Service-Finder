import React, { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ── Photon geocoder (no API key, worldwide OSM-based) ─────────────────────────
async function photonSearch(query) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) }); // Generous 15s timeout
  if (!res.ok) throw new Error(`Photon HTTP ${res.status}`);
  const data = await res.json();
  const f = data?.features?.[0];
  if (!f) return null;
  const [lon, lat] = f.geometry.coordinates;
  return [lat, lon];
}

// 🌐 Nominatim Fallback helper via our CORS-safe backend proxy
async function nominatimSearch(query) {
  const url = `/api/workers/geocode?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Backend geocode proxy HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.lat || !data?.lon) return null;
  return [parseFloat(data.lat), parseFloat(data.lon)];
}
// ─────────────────────────────────────────────────────────────────────────────

// Custom Icon Definitions
const workerIcon = new L.DivIcon({
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));">👷</div>`,
  className: "custom-map-pin",
  iconSize: [36, 36],
  iconAnchor: [18, 32]
});

const homeIcon = new L.DivIcon({
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));">🏠</div>`,
  className: "custom-map-pin",
  iconSize: [36, 36],
  iconAnchor: [18, 32]
});

// Fit map bounds to include both markers
function RecenterMap({ pos1, pos2 }) {
  const map = useMap();
  useEffect(() => {
    if (pos1 && pos2) {
      const bounds = L.latLngBounds([pos1, pos2]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pos1) {
      map.setView(pos1, 13);
    }
  }, [pos1, pos2, map]);
  return null;
}

const RouteMap = ({ startAddress, endAddress }) => {
  const [posA, setPosA] = useState(null); // Worker / start location
  const [posB, setPosB] = useState(null); // Customer / end location
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultCenter = [17.3850, 78.4867]; // Hyderabad fallback

  useEffect(() => {
    const geocodeBoth = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryA = startAddress || "Hyderabad, India";
        const queryB = endAddress || "Banjara Hills, Hyderabad";

        console.log(`🛰️ Photon Route: [${queryA}] --> [${queryB}]`);

        let resA, resB;
        try {
          [resA, resB] = await Promise.all([
            photonSearch(queryA),
            photonSearch(queryB)
          ]);
        } catch (e) {
          console.warn("Photon RouteMap geocoding failed, trying Nominatim fallback:", e.message);
          try {
            [resA, resB] = await Promise.all([
              nominatimSearch(queryA),
              nominatimSearch(queryB)
            ]);
          } catch (err) {
            console.error("Nominatim routing fallback failed too:", err.message);
          }
        }

        if (resA) setPosA(resA);
        if (resB) setPosB(resB);

        if (!resA && !resB) {
          setError("Could not resolve coordinates for these addresses.");
        }

      } catch (err) {
        console.error("Photon RouteMap geocoding error:", err);
        setError("Live geocoding temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    };

    geocodeBoth();
  }, [startAddress, endAddress]);

  if (loading) {
    return (
      <div style={{ height: 260, backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div className="spinner" style={{ width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Calculating Optimal Path...</span>
      </div>
    );
  }

  if (error && !posA && !posB) {
    return (
      <div style={{ height: 260, backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", padding: 20, textAlign: "center", fontSize: 13 }}>
        ⚠️ <strong>Mapping Unavailable:</strong>&nbsp;{error}
      </div>
    );
  }

  const displayPosA = posA || defaultCenter;

  return (
    <div style={{ height: 260, position: "relative", width: "100%" }}>
      <MapContainer
        center={displayPosA}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.cyclosm.org">CyclOSM</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"
          maxZoom={20}
        />

        <RecenterMap pos1={posA} pos2={posB} />

        {posA && (
          <Marker position={posA} icon={workerIcon}>
            <Popup><strong>🧑‍🏭 Worker Location</strong><br />{startAddress}</Popup>
          </Marker>
        )}

        {posB && (
          <Marker position={posB} icon={homeIcon}>
            <Popup><strong>🏠 Customer Location</strong><br />{endAddress}</Popup>
          </Marker>
        )}

        {posA && posB && (
          <Polyline
            positions={[posA, posB]}
            color="#3b82f6"
            weight={4}
            dashArray="10, 10"
            opacity={0.8}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
