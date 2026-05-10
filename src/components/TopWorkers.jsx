import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function getShortLocation(fullAddress) {
  if (!fullAddress) return "";
  const lower = fullAddress.toLowerCase();
  if (lower.includes("kakinada")) return "kakinada";
  if (lower.includes("rajahmundry")) return "rajahmundry";
  return fullAddress.split(",")[0].trim().toLowerCase();
}

function TopWorkers({ searchedLocation }) {
  const [cloudWorkers, setCloudWorkers] = useState([]);
  
  useEffect(() => {
    const fetchWorkers = async () => {
       try {
         const resp = await fetch("http://localhost:5000/api/workers");
         if (resp.ok) setCloudWorkers(await resp.json());
       } catch(e) { console.error("Top workers fail"); }
    };
    fetchWorkers();
  }, []);

  const locationKey = getShortLocation(searchedLocation);
  
  // Filter by location if available, else show all sorted by rating
  const candidates = searchedLocation
    ? cloudWorkers.filter((w) =>
        w.city.toLowerCase().includes(locationKey) ||
        locationKey.includes(w.city.toLowerCase())
      )
    : cloudWorkers;

  // Always show top 4 by rating
  const topWorkers = [...candidates].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);

  return (
    <div className="fade-in" style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
        🔥 Top-Rated Professionals
      </h2>
      {searchedLocation && (
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 15px 0" }}>
          Near <strong style={{ color: "var(--primary)" }}>{searchedLocation.split(",")[0]}</strong>
        </p>
      )}

      {topWorkers.length === 0 ? (
        <p style={{ color: "gray", fontStyle: "italic" }}>
          Scanning cloud for top professionals...
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            gap: "15px",
            paddingBottom: "10px"
          }}
        >
          {topWorkers.map((worker) => (
            <div
              key={worker._id}
              className="premium-card"
              style={{ minWidth: "220px", flex: "0 0 auto" }}
            >
              <h3 style={{ margin: "0 0 5px 0", fontSize: "18px", color: "var(--text-primary)" }}>{worker.name}</h3>
              <p style={{ color: "var(--text-secondary)", margin: "5px 0", fontWeight: 500 }}>{worker.service}</p>
              <p style={{ margin: "5px 0", fontSize: "13px", color: "var(--primary)", fontWeight: "bold" }}>
                📍 {worker.city}
              </p>
              <p style={{ margin: "8px 0", fontWeight: "bold", fontSize: "14px" }}>
                <span style={{ color: "#f59e0b" }}>⭐</span> {worker.rating}
              </p>
              <p style={{ margin: "4px 0 10px 0", fontWeight: "800", fontSize: "16px", color: "var(--success)" }}>
                ₹{worker.price || 350}
              </p>

              <Link 
                to="/worker" 
                onClick={() => localStorage.setItem("selected_worker", JSON.stringify(worker))}
                style={{ textDecoration: 'none' }}
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
                    cursor: "pointer"
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
