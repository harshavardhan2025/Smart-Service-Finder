import { useEffect, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import { OpenStreetMapProvider } from "leaflet-geosearch";

const provider = new OpenStreetMapProvider();

const pinIcon = new L.DivIcon({
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.3)); cursor: pointer;">📍</div>`,
  className: "custom-leaflet-pin",
  iconSize: [30, 42],
  iconAnchor: [15, 36],
  popupAnchor: [0, -32],
});

function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

function MapPicker({ onLocationChange, onCoordsChange }) {
  const [position, setPosition] = useState([17.385, 78.4867]);
  const [search, setSearch] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detectedLabel, setDetectedLabel] = useState("");

  // Auto-detect on mount
  useEffect(() => {
    autoDetect(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoDetect = async (showLoader = true) => {
    if (showLoader) setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (loc) => {
        const { latitude, longitude } = loc.coords;
        setPosition([latitude, longitude]);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const label = data?.display_name
            ? data.display_name
            : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          setSearch(label);
          setDetectedLabel(label);

          localStorage.setItem("userLocation", label);
          if (data?.address) {
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.suburb ||
              data.address.county ||
              "";
            if (city) localStorage.setItem("userCity", city);
          }
          if (onLocationChange) onLocationChange(label);
          if (onCoordsChange) onCoordsChange({ lat: latitude, lng: longitude });
        } catch (err) {
          console.error("Reverse geocode failed:", err);
          const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setSearch(fallback);
          setDetectedLabel(fallback);
          if (onLocationChange) onLocationChange(fallback);
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const searchLocation = async () => {
    if (!search.trim()) return;
    try {
      const results = await provider.search({ query: search });
      if (results.length > 0) {
        const { x, y, label } = results[0];
        setPosition([y, x]);
        setSearch(label);
        localStorage.setItem("userLocation", label);
        if (onLocationChange) onLocationChange(label);
        if (onCoordsChange) onCoordsChange({ lat: y, lng: x });
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (err) {
      console.error("Location search failed:", err);
      alert("Could not search location. Please check your internet connection and try again.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") searchLocation();
  };

  return (
    <div style={{ marginTop: "12px", padding: "0 20px 20px 20px" }}>

      <div style={{ marginBottom: "14px", display: "flex", gap: "10px" }}>
        <input
          id="location-search-input"
          type="text"
          placeholder={detecting ? "Detecting your location..." : "Search location..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1 }}
        />

        {/* Auto-detect GPS button */}
        <button
          id="gps-auto-detect-btn"
          title="Auto-detect my current location"
          onClick={() => autoDetect(true)}
          disabled={detecting}
          style={{
            padding: "8px 10px",
            borderRadius: "5px",
            border: "1px solid #2196F3",
            background: "#e3f2fd",
            color: "#1565c0",
            cursor: detecting ? "not-allowed" : "pointer",
            fontSize: "18px",
            lineHeight: 1,
          }}
        >
          {detecting ? "⏳" : "🎯"}
        </button>

        {/* Search button */}
        <button
          id="location-search-btn"
          onClick={searchLocation}
          style={{ backgroundColor: "var(--primary)", color: "white" }}
        >
          Search Location 🔍
        </button>
      </div>

      {/* Detected label badge */}
      {detectedLabel && !detecting && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "20px",
            padding: "4px 12px",
            fontSize: "12px",
            color: "#166534",
            marginBottom: "10px",
            fontWeight: 600,
          }}
        >
          <span>✅</span>
          <span>Location detected</span>
        </div>
      )}

      {/* Map */}
      <div
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #cbd5e1",
          boxShadow: "0 4px 12px rgba(0,0,0,0.07)",
        }}
      >
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "360px", width: "100%" }}
        >
          <ChangeMapView center={position} />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={pinIcon}>
            <Popup>
              {detectedLabel || search || "Selected Location"}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

export default MapPicker;
