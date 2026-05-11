import React, { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { OpenStreetMapProvider } from "leaflet-geosearch";

const provider = new OpenStreetMapProvider();

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

// Self-contained hook/component to automatically fit boundary frame between both points
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
  const [posA, setPosA] = useState(null); // Worker Loc
  const [posB, setPosB] = useState(null); // Cust Loc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default baseline just in case everything fails (Hyderabad)
  const defaultCenter = [17.3850, 78.4867];

  useEffect(() => {
    const geocodeBoth = async () => {
      setLoading(true);
      setError(null);
      try {
        // Standard cleansing of input address queries
        const queryA = startAddress || "Hyderabad, India";
        const queryB = endAddress || "Banjara Hills, Hyderabad";

        console.log(`🛰️ Geocoding Route: [${queryA}] --> [${queryB}]`);

        const [resA, resB] = await Promise.all([
          provider.search({ query: queryA }),
          provider.search({ query: queryB })
        ]);

        if (resA && resA.length > 0) {
          setPosA([resA[0].y, resA[0].x]);
        }
        if (resB && resB.length > 0) {
          setPosB([resB[0].y, resB[0].x]);
        }

        if ((!resA || resA.length === 0) && (!resB || resB.length === 0)) {
          setError("Could not resolve valid global coordinates for these addresses.");
        }

      } catch (err) {
        console.error("Geocoding Engine Fail:", err);
        setError("Live geocoding service temporarily offline.");
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
         <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Calculating Optimal Path Live...</span>
      </div>
    );
  }

  if (error && !posA && !posB) {
     return (
       <div style={{ height: 260, backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", padding: 20, textAlign: "center", fontSize: 13 }}>
          ⚠️ <strong>Mapping Unavailable:</strong> {error}
       </div>
     );
  }

  // Fallback rendering centers if one coordinate exists but not the other
  const displayPosA = posA || defaultCenter;
  const displayPosB = posB || [displayPosA[0] + 0.01, displayPosA[1] + 0.01];

  return (
    <div style={{ height: 260, position: "relative", width: "100%" }}>
      <MapContainer 
         center={displayPosA} 
         zoom={13} 
         style={{ height: "100%", width: "100%" }}
         scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterMap pos1={posA} pos2={posB} />

        {posA && (
          <Marker position={posA} icon={workerIcon}>
            <Popup><strong>🧑‍🏭 Your Position</strong><br/>{startAddress}</Popup>
          </Marker>
        )}

        {posB && (
          <Marker position={posB} icon={homeIcon}>
            <Popup><strong>🏠 Customer Drop</strong><br/>{endAddress}</Popup>
          </Marker>
        )}

        {/* Draw live dynamic dashed tracing route line between current real positions! */}
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
