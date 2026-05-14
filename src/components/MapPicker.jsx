import { useEffect, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import { OpenStreetMapProvider } from "leaflet-geosearch";

const provider = new OpenStreetMapProvider();

// Custom high-fidelity red pin symbol emoji (📍) with centering offsets
const pinIcon = new L.DivIcon({
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.3)); cursor: pointer;">📍</div>`,
  className: "custom-leaflet-pin",
  iconSize: [30, 42],
  iconAnchor: [15, 36], // Bottom tip of the pin aligns exactly with latitude/longitude
  popupAnchor: [0, -32]
});

function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

function MapPicker() {
  const [position, setPosition] = useState([
    17.3850,
    78.4867
  ]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (location) => {
        setPosition([
          location.coords.latitude,
          location.coords.longitude
        ]);
      },
      (err) => console.error("Map location tracking failed:", err),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, []);

  const searchLocation = async () => {
    const results = await provider.search({
      query: search
    });
    if (results.length > 0) {
      setPosition([
        results[0].y,
        results[0].x
      ]);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <div
        style={{
          marginBottom: "14px",
          display: "flex",
          gap: "10px"
        }}
      >
        <input
          type="text"
          placeholder="Search location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={searchLocation} style={{ backgroundColor: "var(--primary)", color: "white" }}>
          Search Location 🔍
        </button>
      </div>

      <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #cbd5e1", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <MapContainer
          center={position}
          zoom={13}
          style={{
            height: "400px",
            width: "100%"
          }}
        >
          <ChangeMapView center={position} />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={pinIcon}>
            <Popup>
              Selected Location
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

export default MapPicker;
