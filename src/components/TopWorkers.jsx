import { Link } from "react-router-dom";
import { getWorkers } from "../data/sharedStore";

function getShortLocation(fullAddress) {
  if (!fullAddress) return "";
  return fullAddress.split(",")[0].trim().toLowerCase();
}

function TopWorkers({ searchedLocation }) {
  const locationKey = getShortLocation(searchedLocation);
  const allWorkers = getWorkers();

  // Filter by location if available, else show all sorted by rating
  const workers = searchedLocation
    ? allWorkers.filter((w) =>
        w.city.toLowerCase().includes(locationKey) ||
        locationKey.includes(w.city.toLowerCase())
      )
    : allWorkers;

  // Always show top 4 by rating
  const topWorkers = [...workers].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);

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
          No top-rated workers found near "{searchedLocation.split(",")[0]}". Try a different location.
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
          {topWorkers.map((worker, index) => (
            <div
              key={index}
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

              <Link to="/worker" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    backgroundColor: "var(--primary)",
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

export default TopWorkers;
