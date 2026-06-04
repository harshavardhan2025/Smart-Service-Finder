import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { filterWorkersClientSide } from "../utils/workerService";

function getShortLocation(fullAddress) {
  if (!fullAddress) return "";
  const lower = fullAddress.toLowerCase();
  if (lower.includes("kakinada")) return "kakinada";
  if (lower.includes("rajahmundry")) return "rajahmundry";
  if (lower.includes("new delhi") || lower.includes("delhi")) return "new delhi";
  if (lower.includes("hyderabad")) return "hyderabad";
  if (lower.includes("kadapa")) return "kadapa";
  
  // Fall back to stored userCity if the first segment is a raw coordinate number
  const firstSegment = fullAddress.split(",")[0].trim();
  if (!isNaN(parseFloat(firstSegment))) {
    const storedCity = localStorage.getItem("userCity");
    if (storedCity) return storedCity.toLowerCase().trim();
  }
  
  return firstSegment.toLowerCase();
}

const truncateLocation = (loc) => {
  if (!loc) return "";
  const parts = loc.split(",");
  if (parts.length > 2) {
    return parts.slice(0, 2).join(",").trim();
  }
  return loc;
};

function TopWorkers({ searchedLocation, userCoords }) {
  const [cloudWorkers, setCloudWorkers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchedLocation && !userCoords) {
      setCloudWorkers([]);
      setLoading(false);
      return;
    }

    // Immediately clear previous list to prevent showing wrong or stale data while loading new location
    setCloudWorkers([]);
    setLoading(true);

    const fetchWorkers = async () => {
      try {
        const locationKey = getShortLocation(searchedLocation);
        const results = await filterWorkersClientSide(userCoords, locationKey);
        setCloudWorkers(results);
      } catch (e) {
        console.error("Top workers fail", e);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, [searchedLocation, userCoords]);

  // Always show top 4 by rating
  const topWorkers = [...cloudWorkers]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);

  return (
    <div className="fade-in" style={{ padding: "10px 20px 14px 20px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
        🔥 Top-Rated Professionals
      </h2>
      {searchedLocation && (
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 8px 0" }}>
          Near <strong style={{ color: "var(--primary)" }}>{searchedLocation.split(",")[0]}</strong>
        </p>
      )}

      {loading ? (
        <p style={{ color: "gray", fontStyle: "italic" }}>
          Scanning for top professionals near you...
        </p>
      ) : topWorkers.length === 0 ? (
        <p style={{ color: "gray", fontStyle: "italic" }}>
          No top-rated professionals found near this location.
        </p>
      ) : (
        <div style={{ display: "flex", overflowX: "auto", gap: "15px", paddingBottom: "10px" }}>
          {topWorkers.map((worker) => (
            <div
              key={worker._id}
              className="premium-card worker-card"
              style={{ minWidth: "220px", flex: "0 0 auto" }}
            >
              <h3 style={{ margin: "0 0 5px 0", fontSize: "18px", color: "var(--text-primary)" }}>
                {worker.name}
              </h3>
              <p style={{ color: "var(--text-secondary)", margin: "5px 0", fontWeight: 500 }}>
                {worker.service}
              </p>
              <p style={{ margin: "5px 0", fontSize: "13px", color: "var(--primary)", fontWeight: "bold" }}>
                📍 {truncateLocation(worker.city)}
              </p>
              {worker.distanceKm !== undefined && (
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    borderRadius: "12px",
                    padding: "2px 10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    marginBottom: "4px",
                  }}
                >
                  🗺️ {worker.distanceKm < 0.5 ? "below 0.5 km" : `${worker.distanceKm} km away`}
                </span>
              )}
              <p style={{ margin: "8px 0", fontWeight: "bold", fontSize: "14px" }}>
                <span style={{ color: "#f59e0b" }}>⭐</span> {worker.rating}
              </p>
              <span className="price-badge">₹{worker.price || 350}</span>

              <Link
                to="/worker"
                onClick={() => localStorage.setItem("selected_worker", JSON.stringify(worker))}
                style={{ textDecoration: "none" }}
              >
                <button
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    backgroundColor: "var(--primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  View Profile
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TopWorkers;
