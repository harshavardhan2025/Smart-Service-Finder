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
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      if (showLoader) setDetecting(false);
      return;
    }

    if (showLoader) setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (loc) => {
        const { latitude, longitude } = loc.coords;
        
        // Define key seeded cities for Euclidean proximity fallback
        const localMatches = [
          { name: "Kakinada, Andhra Pradesh, India", city: "Kakinada", coords: { lat: 16.989062, lon: 82.243878 } },
          { name: "Rajahmundry, Andhra Pradesh, India", city: "Rajahmundry", coords: { lat: 17.000538, lon: 81.804034 } },
          { name: "New Delhi, Delhi, India", city: "New Delhi", coords: { lat: 28.613939, lon: 77.209021 } },
          { name: "Hyderabad, Telangana, India", city: "Hyderabad", coords: { lat: 17.385044, lon: 78.486671 } }
        ];
        
        const getDist = (lat1, lon1, lat2, lon2) => Math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2);
        
        const getNearestCity = (lat, lon) => {
          let nearest = localMatches[0];
          let minDist = getDist(lat, lon, nearest.coords.lat, nearest.coords.lon);
          for (let i = 1; i < localMatches.length; i++) {
            const dist = getDist(lat, lon, localMatches[i].coords.lat, localMatches[i].coords.lon);
            if (dist < minDist) {
              minDist = dist;
              nearest = localMatches[i];
            }
          }
          return nearest;
        };

        const nearest = getNearestCity(latitude, longitude);
        const snapLat = nearest.coords.lat;
        const snapLng = nearest.coords.lon;
        
        setPosition([snapLat, snapLng]);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                "Accept": "application/json"
              }
            }
          );
          const data = await res.json();
          
          let label = data?.display_name;
          let city = "";
          
          if (data?.address) {
            city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.suburb ||
              data.address.county ||
              "";
          }
          
          // Snaps coordinates & name to our key regions if it falls outside our core database targets
          if (!city || !["kakinada", "rajahmundry", "new delhi", "hyderabad"].includes(city.toLowerCase())) {
            label = nearest.name;
            city = nearest.city;
          }

          setSearch(label);
          setDetectedLabel(label);

          localStorage.setItem("userLocation", label);
          localStorage.setItem("userCity", city);
          
          if (onLocationChange) onLocationChange(label);
          if (onCoordsChange) onCoordsChange({ lat: snapLat, lng: snapLng });
        } catch (err) {
          console.error("Reverse geocode failed:", err);
          console.error("Full Error:", err);
          
          const fallbackLabel = nearest.name;
          const fallbackCity = nearest.city;
          
          setSearch(fallbackLabel);
          setDetectedLabel(fallbackLabel);
          
          localStorage.setItem("userLocation", fallbackLabel);
          localStorage.setItem("userCity", fallbackCity);
          
          if (onLocationChange) onLocationChange(fallbackLabel);
          if (onCoordsChange) onCoordsChange({ lat: snapLat, lng: snapLng });
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        console.error("Full Error:", err);
        alert(`Location Error: ${err.message}`);
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleMapInteraction = async (lat, lng) => {
    const localMatches = [
      { name: "Kakinada, Andhra Pradesh, India", city: "Kakinada", coords: { lat: 16.989062, lon: 82.243878 } },
      { name: "Rajahmundry, Andhra Pradesh, India", city: "Rajahmundry", coords: { lat: 17.000538, lon: 81.804034 } },
      { name: "New Delhi, Delhi, India", city: "New Delhi", coords: { lat: 28.613939, lon: 77.209021 } },
      { name: "Hyderabad, Telangana, India", city: "Hyderabad", coords: { lat: 17.385044, lon: 78.486671 } }
    ];
    
    const getDist = (lat1, lon1, lat2, lon2) => Math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2);
    
    let nearest = localMatches.find(city => getDist(lat, lng, city.coords.lat, city.coords.lon) < 0.25); // ~25km
    if (!nearest) {
      // Find absolute nearest even if outside 25km
      let minD = Infinity;
      localMatches.forEach(item => {
        const d = getDist(lat, lng, item.coords.lat, item.coords.lon);
        if (d < minD) {
          minD = d;
          nearest = item;
        }
      });
    }
    
    const snapLat = nearest.coords.lat;
    const snapLng = nearest.coords.lon;
    setPosition([snapLat, snapLng]);
    
    const label = nearest.name;
    const city = nearest.city;
    
    setSearch(label);
    setDetectedLabel(label);
    localStorage.setItem("userLocation", label);
    localStorage.setItem("userCity", city);
    if (onLocationChange) onLocationChange(label);
    if (onCoordsChange) onCoordsChange({ lat: snapLat, lng: snapLng });
  };

  const MapEventsHandler = () => {
    useMapEvents({
      click(e) {
        handleMapInteraction(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const searchLocation = async () => {
    if (!search.trim()) return;
    
    const query = search.toLowerCase().trim();
    
    // High-performance local coordinate dictionary (matching seeded cities)
    const LOCAL_GEO_DB = {
      "kakinada": { lat: 16.989062, lon: 82.243878, label: "Kakinada, Andhra Pradesh, India", city: "Kakinada" },
      "rajahmundry": { lat: 17.000538, lon: 81.804034, label: "Rajahmundry, Andhra Pradesh, India", city: "Rajahmundry" },
      "new delhi": { lat: 28.613939, lon: 77.209021, label: "New Delhi, Delhi, India", city: "New Delhi" },
      "hyderabad": { lat: 17.385044, lon: 78.486671, label: "Hyderabad, Telangana, India", city: "Hyderabad" }
    };
    
    // 1. Check exact or fuzzy local match
    const localMatch = Object.keys(LOCAL_GEO_DB).find(k => query.includes(k) || k.includes(query));
    if (localMatch) {
      const { lat, lon, label, city } = LOCAL_GEO_DB[localMatch];
      setPosition([lat, lon]);
      setSearch(label);
      localStorage.setItem("userLocation", label);
      localStorage.setItem("userCity", city);
      if (onLocationChange) onLocationChange(label);
      if (onCoordsChange) onCoordsChange({ lat, lng: lon });
      return;
    }
    
    // 2. Remote fallback
    try {
      const results = await provider.search({ query: search });
      if (results.length > 0) {
        const { x, y, label } = results[0];
        setPosition([y, x]);
        setSearch(label);
        localStorage.setItem("userLocation", label);
        
        // Resolve city name
        const labelLower = label.toLowerCase();
        let city = labelLower.includes("kakinada") ? "Kakinada" :
                   labelLower.includes("rajahmundry") ? "Rajahmundry" :
                   (labelLower.includes("new delhi") || labelLower.includes("delhi")) ? "New Delhi" :
                   labelLower.includes("hyderabad") ? "Hyderabad" : "";
        if (!city) {
          const localMatches = [
            { city: "Kakinada", coords: { lat: 16.989062, lon: 82.243878 } },
            { city: "Rajahmundry", coords: { lat: 17.000538, lon: 81.804034 } },
            { city: "New Delhi", coords: { lat: 28.613939, lon: 77.209021 } },
            { city: "Hyderabad", coords: { lat: 17.385044, lon: 78.486671 } }
          ];
          const getDist = (lat1, lon1, lat2, lon2) => Math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2);
          
          let nearest = localMatches[0];
          let minDist = getDist(y, x, nearest.coords.lat, nearest.coords.lon);
          for (let i = 1; i < localMatches.length; i++) {
            const dist = getDist(y, x, localMatches[i].coords.lat, localMatches[i].coords.lon);
            if (dist < minDist) {
              minDist = dist;
              nearest = localMatches[i];
            }
          }
          city = nearest.city;
        }
        localStorage.setItem("userCity", city);
        
        if (onLocationChange) onLocationChange(label);
        if (onCoordsChange) onCoordsChange({ lat: y, lng: x });
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (err) {
      console.error("Location search failed:", err);
      console.error("Full Error:", err);
      // Coordinate direct input fallback if Nominatim is blocked/offline
      const coordParts = search.split(",").map(p => parseFloat(p.trim()));
      if (coordParts.length === 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1])) {
        const [lat, lng] = coordParts;
        setPosition([lat, lng]);
        
        const localMatches = [
          { name: "Kakinada, Andhra Pradesh, India", city: "Kakinada", coords: { lat: 16.989062, lon: 82.243878 } },
          { name: "Rajahmundry, Andhra Pradesh, India", city: "Rajahmundry", coords: { lat: 17.000538, lon: 81.804034 } },
          { name: "New Delhi, Delhi, India", city: "New Delhi", coords: { lat: 28.613939, lon: 77.209021 } },
          { name: "Hyderabad, Telangana, India", city: "Hyderabad", coords: { lat: 17.385044, lon: 78.486671 } }
        ];
        const getDist = (lat1, lon1, lat2, lon2) => Math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2);
        
        let nearest = localMatches[0];
        let minDist = getDist(lat, lng, nearest.coords.lat, nearest.coords.lon);
        for (let i = 1; i < localMatches.length; i++) {
          const dist = getDist(lat, lng, localMatches[i].coords.lat, localMatches[i].coords.lon);
          if (dist < minDist) {
            minDist = dist;
            nearest = localMatches[i];
          }
        }
        
        const label = nearest.name;
        const city = nearest.city;
        
        setSearch(label);
        setDetectedLabel(label);
        localStorage.setItem("userLocation", label);
        localStorage.setItem("userCity", city);
        
        if (onLocationChange) onLocationChange(label);
        if (onCoordsChange) onCoordsChange({ lat, lng });
      } else {
        alert("Could not search location. Please check your internet connection and try again.");
      }
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
          <MapEventsHandler />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker 
            position={position} 
            icon={pinIcon}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const marker = e.target;
                if (marker) {
                  const latlng = marker.getLatLng();
                  handleMapInteraction(latlng.lat, latlng.lng);
                }
              }
            }}
          >
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
