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
  const [workers, setWorkers] = useState([]);
  const [locationError, setLocationError] = useState(null);


  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch("/api/workers?adminView=true");
        if (res.ok) {
          const data = await res.json();
          setWorkers(data);
        }
      } catch (err) {
        console.error("Error fetching workers for map:", err);
      }
    };
    fetchWorkers();
  }, []);

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

  // On mount, sync persisted coords → parent and auto-detect geolocation automatically
  useEffect(() => {
    const savedLat = parseFloat(localStorage.getItem("userCoordsLat")) || 14.471306;
    const savedLng = parseFloat(localStorage.getItem("userCoordsLng")) || 78.824165;
    const savedLocation = localStorage.getItem("userLocation") || "Kadapa, Andhra Pradesh, India";
    const savedCity = localStorage.getItem("userCity") || "Kadapa";

    if (!localStorage.getItem("userLocation")) {
      // If saved location is stale (older than 1 hour), ignore it
      const savedTimestamp = parseInt(localStorage.getItem("userLocationTimestamp"), 10) || 0;
      const now = Date.now();
      const oneHour = 3600000;
      const isStale = now - savedTimestamp > oneHour;
      if (isStale) {
        localStorage.removeItem("userLocation");
        localStorage.removeItem("userCity");
        localStorage.removeItem("userCoordsLat");
        localStorage.removeItem("userCoordsLng");
        localStorage.removeItem("manualLocationSet");
        localStorage.removeItem("userLocationTimestamp");
      } else {
        localStorage.setItem("userLocation", savedLocation);
        localStorage.setItem("userCity", savedCity);
        localStorage.setItem("userCoordsLat", savedLat.toString());
        localStorage.setItem("userCoordsLng", savedLng.toString());
      }
    }

    setPosition([savedLat, savedLng]);
    setSearch(savedLocation);
    setDetectedLabel(savedLocation);
    if (onLocationChange) onLocationChange(savedLocation);
    if (onCoordsChange) onCoordsChange({ lat: savedLat, lng: savedLng });

    // Automatically detect location on mount ONLY if not manually set before
    if (localStorage.getItem("manualLocationSet") !== "true") {
      if (navigator.geolocation) {
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
          },
          async (err) => {
            console.warn("Automatic geolocation auto-detect failed on mount, trying IP location:", err);
            await detectIpFallback();
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        detectIpFallback();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            setIsSearching(true);
            if (!navigator.geolocation) {
              const success = await detectIpFallback();
              setIsSearching(false);
              if (!success) {
                alert("Failed to auto-detect location. Please search manually.");
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
                console.warn("Manual geolocation auto-detect failed, trying IP location:", err);
                if (err.code === 1) {
                  setLocationError("Location permission denied. Please allow location access in your device/browser settings.");
                } else if (err.code === 2) {
                  setLocationError("Location is turned off or unavailable. Please turn on your device's GPS/Location services.");
                } else if (err.code === 3) {
                  setLocationError("Location request timed out. Please check your signal or try again.");
                }

                const success = await detectIpFallback();
                setIsSearching(false);
                if (!success && err.code !== 1 && err.code !== 2 && err.code !== 3) {
                  setLocationError("Failed to auto-detect location. Please search manually.");
                }
              },
              { enableHighAccuracy: true, timeout: 8000 }
            );
          }}
          disabled={isSearching}
          style={{ backgroundColor: "#0284c7", color: "white", opacity: isSearching ? 0.7 : 1 }}
        >
          Auto Detect 📍
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("manualLocationSet");
            window.location.reload();
          }}
          style={{ backgroundColor: "#ef4444", color: "white" }}
        >
          Reset Location 🔄
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

          {workers.map((worker) => {
            if (!worker.lat || !worker.lon) return null;
            const workerIcon = new L.DivIcon({
              html: `<div style="font-size: 30px; filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.3)); cursor: pointer;">👷</div>`,
              className: "custom-worker-pin",
              iconSize: [30, 42],
              iconAnchor: [15, 36],
              popupAnchor: [0, -32],
            });
            return (
              <Marker
                key={worker._id || worker.id}
                position={[worker.lat, worker.lon]}
                icon={workerIcon}
              >
                <Popup>
                  <div style={{ fontFamily: "'Outfit', sans-serif" }}>
                    <strong style={{ fontSize: "14px" }}>{worker.name}</strong>
                    <div style={{ color: "#4f46e5", fontWeight: 700, fontSize: "12px", marginTop: "2px" }}>{worker.service}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                      ⭐ {worker.rating} • ₹{worker.price} • {worker.city}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {locationError && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99999,
          display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white", padding: "24px", borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)", maxWidth: "400px", width: "100%",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>📍</div>
            <h3 style={{ margin: "0 0 12px 0", color: "#1e293b", fontFamily: "'Outfit', sans-serif" }}>Location Access Needed</h3>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", lineHeight: "1.5" }}>{locationError}</p>
            <button
              onClick={() => setLocationError(null)}
              style={{
                backgroundColor: "#4f46e5", color: "white", border: "none",
                padding: "12px 24px", borderRadius: "8px", fontWeight: "600",
                cursor: "pointer", width: "100%", fontSize: "16px"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

  </div>
);
}

export default MapPicker;
