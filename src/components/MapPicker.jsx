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
  map.setView(center, 13);
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

  // On mount, sync persisted coords → parent
  useEffect(() => {
    const savedLat = parseFloat(localStorage.getItem("userCoordsLat")) || 14.471306;
    const savedLng = parseFloat(localStorage.getItem("userCoordsLng")) || 78.824165;
    const savedLocation = localStorage.getItem("userLocation") || "Kadapa, Andhra Pradesh, India";
    const savedCity = localStorage.getItem("userCity") || "Kadapa";

    if (!localStorage.getItem("userLocation")) {
      localStorage.setItem("userLocation", savedLocation);
      localStorage.setItem("userCity", savedCity);
      localStorage.setItem("userCoordsLat", savedLat.toString());
      localStorage.setItem("userCoordsLng", savedLng.toString());
    }

    setPosition([savedLat, savedLng]);
    setSearch(savedLocation);
    setDetectedLabel(savedLocation);
    if (onLocationChange) onLocationChange(savedLocation);
    if (onCoordsChange) onCoordsChange({ lat: savedLat, lng: savedLng });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const applyLocation = (lat, lon, label, city) => {
    setPosition([lat, lon]);
    setSearch(label);
    setDetectedLabel(label);
    localStorage.setItem("userLocation", label);
    localStorage.setItem("userCity", city);
    localStorage.setItem("userCoordsLat", lat.toString());
    localStorage.setItem("userCoordsLng", lon.toString());
    if (onLocationChange) onLocationChange(label);
    if (onCoordsChange) onCoordsChange({ lat, lng: lon });
  };

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

    // 2. Fallback: backend proxy (which has a robust server-side Nominatim resolver!)
    try {
      const res = await fetch(`/api/workers/geocode?q=${encodeURIComponent(search.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.lat && data?.lon) {
          applyLocation(parseFloat(data.lat), parseFloat(data.lon), data.label || search, data.city || "");
          setIsSearching(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Backend geocode proxy failed:", e.message);
    }

    setIsSearching(false);
    alert("Location not found. Please try a different search term.");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") searchLocation();
  };

  return (
    <div style={{ marginTop: "12px", padding: "0 20px 20px 20px" }}>

      <div style={{ marginBottom: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          id="location-search-input"
          type="text"
          placeholder="Search any location, street, village, colony..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, minWidth: "200px" }}
        />
        <button
          id="location-search-btn"
          onClick={searchLocation}
          disabled={isSearching}
          style={{ backgroundColor: "var(--primary)", color: "white", opacity: isSearching ? 0.7 : 1 }}
        >
          {isSearching ? "Searching..." : "Search Location 🔍"}
        </button>
        <button
          id="location-autodetect-btn"
          onClick={async () => {
            if (!navigator.geolocation) {
              alert("Geolocation is not supported by your browser.");
              return;
            }
            setIsSearching(true);
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
              (err) => {
                setIsSearching(false);
                alert("Failed to auto-detect location. Please search manually or check location permissions.");
                console.error("Auto-detect failed:", err);
              },
              { enableHighAccuracy: true, timeout: 8000 }
            );
          }}
          disabled={isSearching}
          style={{ backgroundColor: "#0284c7", color: "white", opacity: isSearching ? 0.7 : 1 }}
        >
          Auto Detect 📍
        </button>
      </div>

      {/* Detected label badge */}
      {detectedLabel && (
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
          <MapEventsHandler />
          <TileLayer
            attribution='&copy; <a href="https://www.cyclosm.org">CyclOSM</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"
            maxZoom={20}
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
    </div>
  );
}

export default MapPicker;
