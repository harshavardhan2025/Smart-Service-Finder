import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { filterWorkersClientSide } from "../utils/workerService";
import SkeletonLoader from "./SkeletonLoader";

function getShortLocation(fullAddress) {
  const storedCity = localStorage.getItem("userCity");
  if (storedCity) return storedCity.toLowerCase().trim();

  if (!fullAddress) return "";
  const firstSegment = fullAddress.split(",")[0].trim();
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
  const [loading, setLoading] = useState(() => {
    return !!(searchedLocation || userCoords);
  });

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
    .slice(0, 20);

  return (
    <div className="fade-in" style={{ padding: "20px 24px", margin: "14px 0px", background: "linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(234, 179, 8, 0.01) 100%)", borderRadius: "0px", borderTop: "1.5px solid rgba(234, 179, 8, 0.12)", borderBottom: "1.5px solid rgba(234, 179, 8, 0.12)", borderLeft: "none", borderRight: "none" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
        🔥 Top-Rated Professionals
      </h2>
      {searchedLocation && (
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 8px 0" }}>
          Near <strong style={{ color: "var(--primary)" }}>{searchedLocation.split(",")[0]}</strong>
        </p>
      )}

      {loading ? (
        <div className="horizontal-scroll-container" style={{ display: "flex", overflowX: "auto", gap: "15px", paddingBottom: "10px" }}>
          <SkeletonLoader type="card" count={4} />
        </div>
      ) : topWorkers.length === 0 ? (
        <div className="horizontal-scroll-container" style={{ display: "flex", overflowX: "auto", gap: "15px", paddingBottom: "10px" }}>
          <div className="premium-card" style={{ minWidth: "220px", height: "215px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
            <span style={{ fontSize: "24px", marginBottom: "8px" }}>🔍</span>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold" }}>No top-rated professionals</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px" }}>found near this location.</p>
          </div>
        </div>
      ) : (
        <div className="horizontal-scroll-container" style={{ display: "flex", overflowX: "auto", gap: "15px", paddingBottom: "10px" }}>
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
                <span style={{ color: "var(--warning)" }}>⭐</span> {worker.rating}
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
                  Book
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
