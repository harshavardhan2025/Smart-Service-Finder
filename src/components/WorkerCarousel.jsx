import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { filterWorkersClientSide } from "../utils/workerService";
import SkeletonLoader from "./SkeletonLoader";

// ponytail: merged CheapWorkers + TopWorkers — only difference was sortBy key and header
function getShortLocation(fullAddress) {
  const storedCity = localStorage.getItem("userCity");
  if (storedCity) return storedCity.toLowerCase().trim();
  if (!fullAddress) return "";
  return fullAddress.split(",")[0].trim().toLowerCase();
}

const truncateLocation = (loc) => {
  if (!loc) return "";
  const parts = loc.split(",");
  return parts.length > 2 ? parts.slice(0, 2).join(",").trim() : loc;
};

function WorkerCarousel({
  searchedLocation,
  userCoords,
  flat = false,
  excludeEmail = "",
  sortBy = "rating",         // "rating" | "price"
  title = "",
  subtitle = "",
  accentColor = "rgba(234, 179, 8, 0.05)",
  accentBorder = "rgba(234, 179, 8, 0.12)",
}) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(!!(searchedLocation || userCoords));

  useEffect(() => {
    if (!searchedLocation && !userCoords) {
      setWorkers([]);
      setLoading(false);
      return;
    }
    setWorkers([]);
    setLoading(true);

    const load = async () => {
      try {
        const locationKey = getShortLocation(searchedLocation);
        const results = await filterWorkersClientSide(userCoords, locationKey);
        setWorkers(results);
      } catch (e) {
        console.error("WorkerCarousel fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchedLocation, userCoords]);

  const sorted = [...workers]
    .filter(w => !excludeEmail || (w.email || "").toLowerCase() !== excludeEmail.toLowerCase())
    .sort((a, b) =>
      sortBy === "price"
        ? (a.price || 0) - (b.price || 0)
        : (b.rating || 0) - (a.rating || 0)
    )
    .slice(0, 20);

  const containerStyle = flat
    ? { padding: 0 }
    : {
        padding: "20px 24px",
        margin: "14px 0px",
        background: `linear-gradient(135deg, ${accentColor} 0%, rgba(0,0,0,0.01) 100%)`,
        borderTop: `1.5px solid ${accentBorder}`,
        borderBottom: `1.5px solid ${accentBorder}`,
        borderLeft: "none",
        borderRight: "none",
      };

  const scrollRow = { display: "flex", overflowX: "auto", gap: "15px", paddingBottom: "10px" };

  return (
    <div className="fade-in" style={containerStyle}>
      {!flat && title && (
        <>
          <h2 style={{ margin: "0 0 4px 0", color: "var(--text-primary)", fontWeight: 800 }}>{title}</h2>
          {subtitle && <p style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>{subtitle}</p>}
        </>
      )}

      <div className="horizontal-scroll-container custom-scrollbar" style={scrollRow}>
        {loading ? (
          <SkeletonLoader type="card" count={4} />
        ) : sorted.length === 0 ? (
          <div className="premium-card" style={{ minWidth: "220px", height: "215px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
            <span style={{ fontSize: "24px", marginBottom: "8px" }}>🔍</span>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold" }}>No professionals found</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px" }}>near this location.</p>
          </div>
        ) : (
          sorted.map((worker) => (
            <div key={worker._id} className="premium-card worker-card" style={{ minWidth: "220px", flex: "0 0 auto" }}>
              <h3 style={{ margin: "0 0 5px 0", color: "var(--text-primary)" }}>{worker.name}</h3>
              <p style={{ color: "var(--text-secondary)", margin: "5px 0", fontWeight: 500 }}>{worker.service}</p>
              <p style={{ margin: "4px 0", fontSize: "13px", color: "var(--primary)", fontWeight: "bold" }}>
                📍 {truncateLocation(worker.city)}
              </p>
              {worker.distanceKm !== undefined && (
                <span style={{ display: "inline-block", backgroundColor: "var(--info-light)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "2px 10px", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  🗺️ {worker.distanceKm < 0.5 ? "below 0.5 km" : `${worker.distanceKm} km away`}
                </span>
              )}
              <span className="price-badge">₹{worker.price || 350}</span>
              <p style={{ margin: "5px 0" }}>
                <span style={{ color: "var(--warning)" }}>⭐</span> {worker.rating}
              </p>
              <Link to="/worker" onClick={() => localStorage.setItem("selected_worker", JSON.stringify(worker))} style={{ textDecoration: "none" }}>
                <button style={{ width: "100%", marginTop: "10px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "bold", cursor: "pointer" }}>
                  Book
                </button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WorkerCarousel;
