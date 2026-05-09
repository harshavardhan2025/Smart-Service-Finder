import { Link } from "react-router-dom";
import { getWorkers } from "../data/sharedStore";

function getShortLocation(fullAddress) {
  if (!fullAddress) return "";
  return fullAddress.split(",")[0].trim().toLowerCase();
}

function CheapWorkers({ searchedLocation }) {
  const locationKey = getShortLocation(searchedLocation);
  const allWorkers = getWorkers();

  // Filter by location if available
  const workers = searchedLocation
    ? allWorkers.filter((w) =>
        w.city.toLowerCase().includes(locationKey) ||
        locationKey.includes(w.city.toLowerCase())
      )
    : allWorkers;

  // Filter by budget-friendly (price <= 300) and take top 4
  const cheapWorkers = [...workers]
    .filter(w => (w.price || 500) <= 300)
    .sort((a, b) => (a.price || 0) - (b.price || 0))
    .slice(0, 4);

  return (
    <div className="fade-in" style={{ padding: "20px", margin: "20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <h2 style={{ margin: "0 0 4px 0", color: "var(--text-primary)", fontWeight: 800 }}>💰 Budget-Friendly Workers</h2>
        <span
          style={{
            background: "var(--success-grad)",
            color: "white",
            padding: "4px 10px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "bold",
            boxShadow: "0 2px 4px var(--primary-glow)"
          }}
        >
          Great Value
        </span>
      </div>
      {searchedLocation && (
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 10px 0" }}>
          Near <strong style={{ color: "var(--primary)" }}>{searchedLocation.split(",")[0]}</strong>
        </p>
      )}
      <p style={{ color: "var(--text-secondary)", marginTop: searchedLocation ? "0" : "-10px", marginBottom: "15px" }}>
        Highly rated professionals at pocket-friendly rates!
      </p>

      {cheapWorkers.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
          No budget workers found near "{searchedLocation.split(",")[0]}". Try a different location.
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
          {cheapWorkers.map((worker, index) => (
            <div
              key={index}
              className="premium-card"
              style={{ minWidth: "220px", flex: "0 0 auto" }}
            >
              <h3 style={{ margin: "0 0 5px 0", color: "var(--text-primary)" }}>{worker.name}</h3>
              <p style={{ color: "var(--text-secondary)", margin: "5px 0", fontWeight: 500 }}>{worker.service}</p>
              <p style={{ margin: "4px 0", fontSize: "13px", color: "var(--primary)", fontWeight: "bold" }}>
                📍 {worker.city}
              </p>
              <p style={{ fontWeight: 800, color: "var(--success)", margin: "8px 0", fontSize: "16px" }}>
                {worker.price}
              </p>
              <p style={{ margin: "5px 0" }}><span style={{ color: "#f59e0b" }}>⭐</span> {worker.rating}</p>

              <Link to="/worker" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    background: "var(--success-grad)",
                    color: "white",
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
