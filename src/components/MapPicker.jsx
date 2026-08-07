import { useEffect, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

// ─── Photon helpers ──────────────────────────────────────────────────────────
// Forward geocode: search text → coordinates + label
async function photonSearch(query) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) }); // Generous 15s timeout
  if (!res.ok) throw new Error(`Photon search HTTP ${res.status}`);
  const data = await res.json();
  const features = data?.features;
  if (!features || features.length === 0) return null;

  const f = features[0];
  const [lon, lat] = f.geometry.coordinates;
  const p = f.properties;
  const city = p.city || p.town || p.village || p.county || p.name || query;
  const label = [p.name, p.city || p.town || p.village, p.state, p.country]
    .filter(Boolean).join(", ");
  return { lat, lon, label, city };
}

// Reverse geocode: coordinates → label + city
async function photonReverse(lat, lon) {
  const url = `https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) }); // Generous 15s timeout
  if (!res.ok) throw new Error(`Photon reverse HTTP ${res.status}`);
  const data = await res.json();
  const features = data?.features;
  if (!features || features.length === 0) return null;

  const f = features[0];
  const p = f.properties;
  const city = p.city || p.town || p.village || p.county || p.name || "";
  const label = [p.name, p.housenumber, p.street, p.city || p.town || p.village, p.state, p.country]
    .filter(Boolean).join(", ");
  return { label, city };
}
// ─────────────────────────────────────────────────────────────────────────────

const pinIcon = new L.DivIcon({
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.3)); cursor: pointer;">📍</div>`,
  className: "custom-leaflet-pin",
  iconSize: [30, 42],
  iconAnchor: [15, 36],
  popupAnchor: [0, -32],
});

function ChangeMapView({ center }) {
  const map = useMap();
  const [lat, lng] = center;
  useEffect(() => {
    let timer;
    if (map) {
      const currentCenter = map.getCenter();
      const latDiff = Math.abs(currentCenter.lat - lat);
      const lngDiff = Math.abs(currentCenter.lng - lng);

      // Only call setView if the target center coordinate has moved significantly.
      // This prevents the map from constantly snapping and resetting user's zoom/pan on minor updates.
      if (latDiff > 0.0001 || lngDiff > 0.0001) {
        const currentZoom = map.getZoom();
        map.setView([lat, lng], currentZoom || 13);
      }

      timer = setTimeout(() => {
        if (map && map._container) {
          try {
            map.invalidateSize();
          } catch (e) {
            console.warn("map.invalidateSize failed safely: ", e);
          }
        }
      }, 100);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [lat, lng, map]);
  return null;
}

function MapPicker({ onLocationChange, onCoordsChange }) {
  const [position, setPosition] = useState(() => {
    const savedLat = localStorage.getItem("userCoordsLat");
    const savedLng = localStorage.getItem("userCoordsLng");
    if (savedLat && savedLng) return [parseFloat(savedLat), parseFloat(savedLng)];
    return [14.471306, 78.824165]; // Kadapa default
  });

  const [search, setSearch] = useState(() =>
    localStorage.getItem("userLocation") || "Kadapa, Andhra Pradesh, India"
  );

  const [detectedLabel, setDetectedLabel] = useState(() =>
    localStorage.getItem("userLocation") || "Kadapa, Andhra Pradesh, India"
  );

  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const applyLocation = (lat, lon, label, city) => {
    setPosition([lat, lon]);
    setSearch(label);
    setDetectedLabel(label);
    localStorage.setItem("userLocation", label);
    localStorage.setItem("userCity", city);
    localStorage.setItem("userCoordsLat", lat.toString());
    localStorage.setItem("userCoordsLng", lon.toString());
    localStorage.setItem("manualLocationSet", "true");
    localStorage.setItem("userLocationTimestamp", Date.now().toString());
    if (onLocationChange) onLocationChange(label);
    if (onCoordsChange) onCoordsChange({ lat, lng: lon });
  };

  const detectIpFallback = async () => {
    try {
      const res = await fetch("/api/workers/ip-location");
      if (res.ok) {
        const data = await res.json();
        if (data && data.lat && data.lon) {
          applyLocation(data.lat, data.lon, data.label, data.city);
          return true;
        }
      }
    } catch (e) {
      console.error("IP fallback fetch failed:", e);
    }
    return false;
  };

  const autoDetectLocation = async () => {
    setIsSearching(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      const success = await detectIpFallback();
      setIsSearching(false);
      if (!success) {
        setLocationError("Failed to auto-detect location. Please search manually.");
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const result = await photonReverse(latitude, longitude);
          if (result) {
            applyLocation(latitude, longitude, result.label, result.city);
          } else {
            applyLocation(latitude, longitude, `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, "");
          }
        } catch (err) {
          applyLocation(latitude, longitude, `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, "");
        }
        setIsSearching(false);
      },
      async (err) => {
        console.warn("Manual geolocation auto-detect failed:", err);
        if (err.code === 1) {
          setLocationError("Location permission denied. Please allow location access in your browser/device settings.");
        } else if (err.code === 2) {
          setLocationError("Location is turned off or unavailable. Please turn on your device's GPS/Location services.");
        } else if (err.code === 3) {
          setLocationError("Location request timed out. Please check your signal or try again.");
        } else {
          setLocationError("Failed to auto-detect location. Please search manually.");
        }
        setIsSearching(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // On mount, load initial position
  useEffect(() => {
    const savedLat = parseFloat(localStorage.getItem("userCoordsLat")) || 14.471306;
    const savedLng = parseFloat(localStorage.getItem("userCoordsLng")) || 78.824165;
    const savedLocation = localStorage.getItem("userLocation") || "Kadapa, Andhra Pradesh, India";

    setPosition([savedLat, savedLng]);
    setSearch(savedLocation);
    setDetectedLabel(savedLocation);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Dragging / clicking the map → Photon reverse geocode with coordinates fallback
  const handleMapInteraction = async (lat, lng) => {
    setPosition([lat, lng]);
    try {
      const result = await photonReverse(lat, lng);
      if (result) {
        applyLocation(lat, lng, result.label, result.city);
        return;
      }
    } catch (e) {
      console.warn("Photon reverse geocode failed, using coordinates fallback:", e.message);
    }

    // Fallback: show raw coordinates as label
    const fallbackLabel = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    applyLocation(lat, lng, fallbackLabel, "");
  };

  const MapEventsHandler = () => {
    useMapEvents({
      click(e) { handleMapInteraction(e.latlng.lat, e.latlng.lng); },
    });
    return null;
  };

  // ── Search ─────────────────────────────────────────────────────────────────
  const searchLocation = async () => {
    if (!search.trim()) return;
    setIsSearching(true);

    // 1. Try Photon forward geocode (client-side)
    try {
      const result = await photonSearch(search.trim());
      if (result) {
        applyLocation(result.lat, result.lon, result.label, result.city);
        setIsSearching(false);
        return;
      }
    } catch (e) {
      console.warn("Photon search failed, trying backend proxy:", e.message);
    }

    // 2. Try Backend Proxy Fallback
    try {
      const res = await fetch(`/api/workers/geocode?q=${encodeURIComponent(search.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.lat && data?.lon) {
          applyLocation(parseFloat(data.lat), parseFloat(data.lon), data.label || search, data.city || "");
        }
      }
    } catch (e) {
      console.warn("Backend geocode proxy failed:", e.message);
    }

    setIsSearching(false);
    alert("Location not found. Please try with another location.");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") searchLocation();
  };

  return (
    <div style={{ padding: "16px 20px 20px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Search & Auto-Detect Bar */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <input
            id="location-search-input"
            type="text"
            placeholder="Search street, area, or landmark..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1.5px solid var(--border-color, #e2e8f0)",
              backgroundColor: "var(--bg-card-hover, #ffffff)",
              color: "var(--text-main, #0f172a)",
              fontSize: "13.5px",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>
        <button
          id="location-search-btn"
          onClick={searchLocation}
          disabled={isSearching}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#0284c7",
            color: "white",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap"
          }}
        >
          {isSearching ? "Searching..." : "Search 🔍"}
        </button>
        <button
          id="location-autodetect-btn"
          onClick={autoDetectLocation}
          disabled={isSearching}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1.5px solid rgba(2, 132, 199, 0.3)",
            backgroundColor: "rgba(2, 132, 199, 0.08)",
            color: "#0284c7",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap"
          }}
        >
          Auto Detect 📍
        </button>
      </div>

      {/* Selected Location Pill */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "var(--primary-light, #f0fdf4)",
        border: "1px solid rgba(34, 197, 94, 0.25)",
        borderRadius: "10px",
        padding: "8px 14px",
        fontSize: "12.5px",
        color: "var(--text-main, #0f172a)",
        fontWeight: 500
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ color: "#16a34a", fontWeight: "bold" }}>📍 Selected:</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {detectedLabel || search || "Click map to choose location"}
          </span>
        </div>
      </div>

      {/* Interactive Map */}
      <div
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          border: "1.5px solid var(--border-color, #cbd5e1)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
          height: "320px",
          width: "100%",
          position: "relative"
        }}
      >
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <ChangeMapView center={position} />
          <MapEventsHandler />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <Marker
            position={position}
            icon={pinIcon}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const latlng = e.target.getLatLng();
                handleMapInteraction(latlng.lat, latlng.lng);
              }
            }}
          >
            <Popup>{detectedLabel || search || "Selected Location"}</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Error Alert if any */}
      {locationError && (
        <div style={{
          padding: "10px 14px",
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          borderRadius: "8px",
          fontSize: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{locationError}</span>
          <button
            onClick={() => setLocationError(null)}
            style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", fontWeight: "bold" }}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}

export default MapPicker;
