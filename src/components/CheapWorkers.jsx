import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function getShortLocation(fullAddress) {
  if (!fullAddress) return "";
  const lower = fullAddress.toLowerCase();
  if (lower.includes("kakinada")) return "kakinada";
  if (lower.includes("rajahmundry")) return "rajahmundry";
  return fullAddress.split(",")[0].trim().toLowerCase();
}

function CheapWorkers({ searchedLocation, userCoords }) {
  const [cloudWorkers, setCloudWorkers] = useState([]);

  useEffect(() => {
    if (!searchedLocation && !userCoords) {
      setCloudWorkers([]);
      return;
    }

    // Immediately clear previous list to prevent showing wrong or stale data while loading new location
    setCloudWorkers([]);

    const fetchBudgetWorkers = async () => {
      try {
        let url;
        if (userCoords) {
          url = `/api/workers/nearby?lat=${userCoords.lat}&lng=${userCoords.lng}&radius=15`;
        } else {
          const locationKey = getShortLocation(searchedLocation);
          url = locationKey ? `/api/workers?city=${encodeURIComponent(locationKey)}` : "/api/workers";
        }
        const resp = await fetch(url);
        if (resp.ok) setCloudWorkers(await resp.json());
      } catch (e) {
        console.error("Budget fetch fail");
      }
    };
    fetchBudgetWorkers();
  }, [searchedLocation, userCoords]);

  // Sort by price and take top 4
  const cheapWorkers = [...cloudWorkers]
    .sort((a, b) => (a.price || 0) - (b.price || 0))
    .slice(0, 4);

  return (
    <div className="fade-in" style={{ padding: "20px", margin: "20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <h2 style={{ margin: "0 0 4px 0", color: "var(--text-primary)", fontWeight: 800 }}>
          💰 Recommended Value
        </h2>
      </div>
      <p style={{ color: "var(--text-secondary)", marginBottom: "15px" }}>
        Highly rated professionals at great value rates within{" "}
        <strong style={{ color: "var(--primary)" }}>15 km</strong> of your location!
      </p>

      {cheapWorkers.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
          Scanning nearby cloud for budget-friendly workers...
        </p>
      ) : (
        <div style={{ display: "flex", overflowX: "auto", gap: "15px", paddingBottom: "10px" }}>
          {cheapWorkers.map((worker) => (
            <div
              key={worker._id}
              className="premium-card"
              style={{ minWidth: "220px", flex: "0 0 auto" }}
            >
              <h3 style={{ margin: "0 0 5px 0", color: "var(--text-primary)" }}>{worker.name}</h3>
              <p style={{ color: "var(--text-secondary)", margin: "5px 0", fontWeight: 500 }}>
                {worker.service}
              </p>
              <p style={{ margin: "4px 0", fontSize: "13px", color: "var(--primary)", fontWeight: "bold" }}>
                📍 {worker.city}
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
                  🗺️ {worker.distanceKm} km away
                </span>
              )}
              <p style={{ fontWeight: 800, color: "var(--success)", margin: "8px 0", fontSize: "16px" }}>
                ₹{worker.price}
              </p>
              <p style={{ margin: "5px 0" }}>
                <span style={{ color: "#f59e0b" }}>⭐</span> {worker.rating}
              </p>

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

export default CheapWorkers;
