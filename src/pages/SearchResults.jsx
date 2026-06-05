import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import LocationSearch from "../components/LocationSearch";
import { filterWorkersClientSide } from "../utils/workerService";
import { FaStar, FaMapMarkerAlt, FaFilter, FaSortAmountDown, FaArrowLeft } from "react-icons/fa";

function getShortLocation(fullAddress) {
  if (!fullAddress) return "";
  const lower = fullAddress.toLowerCase();
  if (lower.includes("kakinada")) return "kakinada";
  if (lower.includes("rajahmundry")) return "rajahmundry";
  if (lower.includes("new delhi") || lower.includes("delhi")) return "new delhi";
  if (lower.includes("hyderabad")) return "hyderabad";
  if (lower.includes("kadapa")) return "kadapa";
  
  const firstSegment = fullAddress.split(",")[0].trim();
  if (!isNaN(parseFloat(firstSegment))) {
    const storedCity = localStorage.getItem("userCity");
    if (storedCity) return storedCity.toLowerCase().trim();
  }
  return firstSegment.toLowerCase();
}

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchText, setSearchText] = useState(query);

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("rating"); // rating, price-asc, price-desc
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    setSearchText(query);
  }, [query]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const savedLat = localStorage.getItem("userCoordsLat");
        const savedLng = localStorage.getItem("userCoordsLng");
        const savedLoc = localStorage.getItem("userLocation");
        const userCoords = savedLat && savedLng ? { lat: parseFloat(savedLat), lng: parseFloat(savedLng) } : null;
        const locationKey = savedLoc ? getShortLocation(savedLoc) : "";

        // Get nearby workers
        const allLocalWorkers = await filterWorkersClientSide(userCoords, locationKey);
        
        // Fetch AI semantic categories mapping
        let aiServices = [];
        try {
          const aiResp = await fetch(`/api/ai/search?q=${encodeURIComponent(query)}`);
          if (aiResp.ok) {
            const aiData = await aiResp.json();
            if (aiData.success && Array.isArray(aiData.services)) {
              aiServices = aiData.services.map(s => s.toLowerCase());
            }
          }
        } catch (e) {
          console.error("AI semantic query failed:", e);
        }

        // Filter by search query (normal search)
        const qLower = query.toLowerCase().trim();
        const normalFiltered = allLocalWorkers.filter(w => {
          const serviceMatch = w.service && w.service.toLowerCase().includes(qLower);
          const nameMatch = w.name && w.name.toLowerCase().includes(qLower);
          const cityMatch = w.city && w.city.toLowerCase().includes(qLower);
          return serviceMatch || nameMatch || cityMatch;
        });

        // Filter by AI recommendation search mapping
        const aiFiltered = allLocalWorkers.filter(w => {
          return w.service && aiServices.includes(w.service.toLowerCase());
        });

        // Merge and de-duplicate both sets
        const mergedMap = new Map();
        normalFiltered.forEach(w => {
          const id = w._id || w.id;
          mergedMap.set(id, w);
        });
        aiFiltered.forEach(w => {
          const id = w._id || w.id;
          if (!mergedMap.has(id)) {
            mergedMap.set(id, w);
          }
        });

        setWorkers(Array.from(mergedMap.values()));
      } catch (err) {
        console.error("Search fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  // Apply filters and sorting
  const processedWorkers = [...workers]
    .filter(w => (w.rating || 0) >= minRating)
    .sort((a, b) => {
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === "price-asc") {
        return (a.price || 0) - (b.price || 0);
      } else if (sortBy === "price-desc") {
        return (b.price || 0) - (a.price || 0);
      }
      return 0;
    });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />
      
      <div 
        style={{ 
          flex: 1, 
          maxWidth: "1200px", 
          width: "100%", 
          margin: "0 auto", 
          padding: isMobile ? "20px 14px" : "30px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}
      >
        {/* Navigation / Header Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <button 
              className="btn-secondary" 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                padding: "10px 18px", 
                borderRadius: "12px", 
                fontSize: "14px", 
                fontWeight: "bold",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}
            >
              <FaArrowLeft /> Back to Home
            </button>
          </Link>
          
          {isMobile && (
            <button 
              className="btn-primary" 
              onClick={() => setFiltersOpen(!filtersOpen)}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                padding: "10px 18px", 
                borderRadius: "12px", 
                fontSize: "14px", 
                fontWeight: "bold"
              }}
            >
              <FaFilter /> {filtersOpen ? "Hide Filters ▲" : "Show Filters ▼"}
            </button>
          )}
        </div>

        <div className="premium-card" style={{ padding: "10px", background: "var(--bg-card)" }}>
          <LocationSearch
            value={searchText}
            onChange={setSearchText}
            onSearch={(newQuery) => setSearchParams({ q: newQuery })}
            detectedLocation={localStorage.getItem("userLocation") || ""}
          />
        </div>

        <div>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
            🔍 Search Results for "{query}"
          </h2>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14.5px", fontWeight: 500 }}>
            Found {processedWorkers.length} matching verified professionals near your active location.
          </p>
        </div>

        {/* Layout split: Sidebar Filters + Vertical Cards */}
        <div style={{ display: "flex", gap: "24px", flexDirection: isMobile ? "column" : "row", alignItems: "flex-start" }}>
          
          {/* Filters Sidebar */}
          {(!isMobile || filtersOpen) && (
            <div 
              className="premium-card fade-in" 
              style={{ 
                flex: isMobile ? "1 1 100%" : "0 0 280px", 
                width: "100%",
                padding: "24px", 
                height: "fit-content",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                background: "var(--bg-card)",
                boxShadow: "var(--shadow-3d)",
                border: "1.5px solid var(--border)",
                borderRadius: "20px",
                animation: "fadeIn 0.2s ease-out"
              }}
            >
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)", margin: "0 0 14px 0" }}>
                  <FaSortAmountDown /> Sort Results
                </h3>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ 
                    width: "100%", 
                    padding: "12px 14px", 
                    borderRadius: "12px",
                    border: "1.5px solid var(--border)",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    color: "var(--text-main)",
                    fontWeight: 600,
                    outline: "none"
                  }}
                >
                  <option value="rating">Popularity (Rating)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)", margin: "0 0 14px 0" }}>
                  <FaFilter /> Star Rating
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[0, 3, 4, 4.5].map((ratingVal) => (
                    <label 
                      key={ratingVal} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px", 
                        cursor: "pointer", 
                        fontSize: "14px",
                        fontWeight: 600,
                        color: minRating === ratingVal ? "var(--text-primary)" : "var(--text-secondary)"
                      }}
                    >
                      <input 
                        type="radio" 
                        name="ratingFilter" 
                        checked={minRating === ratingVal} 
                        onChange={() => setMinRating(ratingVal)}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      {ratingVal === 0 ? "All Ratings" : `${ratingVal} ★ & above`}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results Listings */}
          <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: "18px" }}>
            {loading ? (
              <div className="premium-card" style={{ padding: "50px", textAlign: "center" }}>
                <p style={{ fontStyle: "italic", color: "var(--text-secondary)", fontSize: "15px", fontWeight: 500 }}>
                  Scanning nearby databases for matching experts...
                </p>
              </div>
            ) : processedWorkers.length === 0 ? (
              <div className="premium-card" style={{ padding: "50px", textAlign: "center" }}>
                <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>🔍</span>
                <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontSize: "18px", fontWeight: 800 }}>No professionals found</h3>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14.5px" }}>Try using alternate search keywords or resetting filters.</p>
              </div>
            ) : (
              processedWorkers.map((worker) => (
                <div 
                  key={worker._id || worker.id}
                  className="premium-card search-result-row-card"
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    padding: isMobile ? "12px 14px" : "14px 18px",
                    gap: "14px",
                    alignItems: isMobile ? "stretch" : "center",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    background: "var(--bg-card)",
                    border: "1.5px solid var(--border)",
                    boxShadow: "var(--shadow-3d)",
                    borderRadius: "16px"
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "var(--shadow-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "var(--shadow-3d)";
                    }
                  }}
                >
                  {/* Left Side: Compact Avatar */}
                  <div 
                    style={{ 
                      width: "60px", 
                      height: "60px", 
                      borderRadius: "12px", 
                      background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      color: "white",
                      flexShrink: 0,
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)"
                    }}
                  >
                    {worker.service && worker.service.toLowerCase().includes("doc") ? "🩺" : 
                     worker.service && worker.service.toLowerCase().includes("plumb") ? "🔧" : 
                     worker.service && worker.service.toLowerCase().includes("paint") ? "🎨" : "👷"}
                  </div>

                  {/* Middle Side: Worker Details */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "2px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                          {worker.name}
                        </h3>
                        <span 
                          style={{ 
                            backgroundColor: "var(--primary-light)", 
                            color: "var(--primary-dark)", 
                            padding: "2px 8px", 
                            borderRadius: "6px", 
                            fontSize: "11px", 
                            fontWeight: "bold",
                            border: "1px solid var(--border)"
                          }}
                        >
                          {worker.service}
                        </span>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", margin: "4px 0" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#eab308", fontWeight: "bold", fontSize: "13px" }}>
                          <FaStar /> {worker.rating}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)", fontSize: "12.5px", fontWeight: 600 }}>
                          <FaMapMarkerAlt /> {worker.city}
                        </span>
                        {worker.distanceKm !== undefined && (
                          <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "1px 6px", borderRadius: "8px", fontSize: "11px", fontWeight: 700 }}>
                            {worker.distanceKm < 0.5 ? "Under 0.5 km away" : `${worker.distanceKm} km away`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Price & Action */}
                  <div 
                    style={{ 
                      width: isMobile ? "100%" : "180px", 
                      display: "flex", 
                      flexDirection: isMobile ? "row" : "column", 
                      justifyContent: isMobile ? "space-between" : "center", 
                      alignItems: isMobile ? "center" : "flex-end",
                      borderLeft: isMobile ? "none" : "1px solid var(--border)",
                      paddingLeft: isMobile ? "0" : "18px",
                      paddingTop: isMobile ? "10px" : "0",
                      borderTop: isMobile ? "1px solid var(--border)" : "none",
                      gap: "10px"
                    }}
                  >
                    <div style={{ textAlign: isMobile ? "left" : "right" }}>
                      <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", display: "block", fontWeight: 600 }}>Standard Rate</span>
                      <span className="price-badge" style={{ margin: "4px 0 0 0", fontSize: "13.5px" }}>₹{worker.price || 349}</span>
                    </div>

                    <Link 
                      to="/worker" 
                      onClick={() => localStorage.setItem("selected_worker", JSON.stringify(worker))}
                      style={{ textDecoration: "none", width: isMobile ? "auto" : "100%" }}
                    >
                      <button 
                        className="btn-primary" 
                        style={{ 
                          width: "100%", 
                          padding: "8px 14px", 
                          borderRadius: "8px", 
                          fontSize: "12px", 
                          fontWeight: "bold",
                          boxShadow: "0 4px 12px rgba(49, 82, 91, 0.12)"
                        }}
                      >
                        Book
                      </button>
                    </Link>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default SearchResults;
