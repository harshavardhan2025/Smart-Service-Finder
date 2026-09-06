import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import LocationSearch from "../components/LocationSearch";
import { filterWorkersClientSide } from "../utils/workerService";
import { FaStar, FaMapMarkerAlt, FaFilter, FaSortAmountDown, FaArrowLeft } from "react-icons/fa";

function getShortLocation(fullAddress) {
  if (!fullAddress) return "";
  const storedCity = localStorage.getItem("userCity");
  if (storedCity) return storedCity.toLowerCase().trim();

  const firstSegment = fullAddress.split(",")[0].trim();
  if (!isNaN(parseFloat(firstSegment))) {
    return "";
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
        const userCoords = savedLat && savedLng ? { lat: parseFloat(savedLat), lng: parseFloat(savedLng) } : { lat: 16.989062, lng: 82.243878 };
        const locationKey = savedLoc ? getShortLocation(savedLoc) : "Kakinada, Andhra Pradesh";

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
        const getNormalizedService = (q) => {
          if (q.includes("plumb")) return "plumbing";
          if (q.includes("electr")) return "electrical";
          if (q.includes("carpent")) return "carpentry";
          if (q.includes("paint")) return "painting";
          if (q.includes("clean")) return "cleaning";
          if (q.includes("doc") || q.includes("med")) return "doctor";
          if (q.includes("ac ") || q === "ac" || q.includes("air cond")) return "ac repair";
          if (q.includes("pack") || q.includes("mov")) return "packers";
          if (q.includes("mechanic")) return "mechanic";
          return q;
        };
        const normQ = getNormalizedService(qLower);

        const normalFiltered = allLocalWorkers.filter(w => {
          const wService = w.service ? w.service.toLowerCase() : "";
          const wName = w.name ? w.name.toLowerCase() : "";
          const wCity = w.city ? w.city.toLowerCase() : "";

          const serviceMatch = wService.includes(qLower) || wService.includes(normQ) || normQ.includes(wService);
          const nameMatch = wName.includes(qLower);
          const cityMatch = wCity.includes(qLower);
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
      
      {/* Main Content Container */}
      <div 
        style={{ 
          flex: 1, 
          maxWidth: "1100px", 
          width: "100%", 
          margin: "0 auto", 
          padding: isMobile ? "12px 12px 90px 12px" : "24px 20px 50px 20px",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? "14px" : "18px",
          boxSizing: "border-box"
        }}
      >
        {/* Navigation / Header Actions Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", width: "100%" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <button 
              className="btn-secondary" 
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px", 
                padding: "8px 14px", 
                borderRadius: "10px", 
                fontSize: "13px", 
                fontWeight: 700,
                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                cursor: "pointer"
              }}
            >
              <FaArrowLeft size={12} /> Back to Home
            </button>
          </Link>
          
          {isMobile && (
            <button 
              className="btn-primary" 
              onClick={() => setFiltersOpen(!filtersOpen)}
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px", 
                padding: "8px 14px", 
                borderRadius: "10px", 
                fontSize: "13px", 
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <FaFilter size={12} /> {filtersOpen ? "Hide Filters ▲" : "Filters ▼"}
            </button>
          )}
        </div>

        {/* Search & Location Bar */}
        <LocationSearch
          value={searchText}
          onChange={setSearchText}
          onSearch={(newQuery) => setSearchParams({ q: newQuery })}
          detectedLocation={localStorage.getItem("userLocation") || "Kakinada, Andhra Pradesh, India"}
        />

        {/* Search Title & Count */}
        <div style={{ padding: "0 4px" }}>
          <h2 style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: "var(--text-main)", margin: "0 0 4px 0", letterSpacing: "-0.2px" }}>
            🔍 Results for "{query}"
          </h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: isMobile ? "12.5px" : "14px", fontWeight: 500 }}>
            Found {processedWorkers.length} verified professional{processedWorkers.length === 1 ? "" : "s"} near your location.
          </p>
        </div>

        {/* Layout split: Sidebar Filters + Vertical Cards */}
        <div style={{ display: "flex", gap: "18px", flexDirection: isMobile ? "column" : "row", alignItems: "flex-start", width: "100%" }}>
          
          {/* Filters Sidebar */}
          {(!isMobile || filtersOpen) && (
            <div 
              className="premium-card fade-in" 
              style={{ 
                flex: isMobile ? "1 1 100%" : "0 0 250px", 
                width: isMobile ? "100%" : "250px",
                padding: "16px 18px", 
                height: "fit-content",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                background: "var(--bg-card)",
                boxShadow: "var(--card-shadow)",
                border: "1.5px solid var(--border-color)",
                borderRadius: "16px",
                boxSizing: "border-box"
              }}
            >
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)", margin: "0 0 10px 0" }}>
                  <FaSortAmountDown size={13} /> Sort Results
                </h3>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ 
                    width: "100%", 
                    padding: "10px 12px", 
                    borderRadius: "10px",
                    border: "1.5px solid var(--border-color)",
                    backgroundColor: "var(--bg-card-hover)",
                    color: "var(--text-main)",
                    fontWeight: 600,
                    fontSize: "13px",
                    outline: "none"
                  }}
                >
                  <option value="rating">Popularity (Rating)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)", margin: "0 0 10px 0" }}>
                  <FaFilter size={13} /> Star Rating
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[0, 3, 4, 4.5].map((ratingVal) => (
                    <label 
                      key={ratingVal} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px", 
                        cursor: "pointer", 
                        fontSize: "13px",
                        fontWeight: 600,
                        color: minRating === ratingVal ? "var(--text-main)" : "var(--text-secondary)"
                      }}
                    >
                      <input 
                        type="radio" 
                        name="ratingFilter" 
                        checked={minRating === ratingVal} 
                        onChange={() => setMinRating(ratingVal)}
                        style={{ width: "15px", height: "15px", cursor: "pointer" }}
                      />
                      {ratingVal === 0 ? "All Ratings" : `${ratingVal} ★ & above`}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results Listings */}
          <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
            {loading ? (
              <div className="premium-card" style={{ padding: "40px 20px", textAlign: "center", borderRadius: "16px", border: "1.5px solid var(--border-color)" }}>
                <p style={{ fontStyle: "italic", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500, margin: 0 }}>
                  Scanning nearby databases for matching experts...
                </p>
              </div>
            ) : processedWorkers.length === 0 ? (
              <div className="premium-card" style={{ padding: "40px 20px", textAlign: "center", borderRadius: "16px", border: "1.5px solid var(--border-color)" }}>
                <span style={{ fontSize: "40px", display: "block", marginBottom: "8px" }}>🔍</span>
                <h3 style={{ margin: "0 0 6px 0", color: "var(--text-main)", fontSize: "17px", fontWeight: 800 }}>No professionals found</h3>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13.5px" }}>Try using alternate search keywords or resetting filters.</p>
              </div>
            ) : (
              processedWorkers.map((worker) => (
                <div 
                  key={worker._id || worker.id}
                  className="premium-card search-result-row-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: isMobile ? "14px" : "16px 20px",
                    gap: "10px",
                    background: "var(--bg-card)",
                    border: "1.5px solid var(--border-color)",
                    boxShadow: "var(--card-shadow)",
                    borderRadius: "16px",
                    boxSizing: "border-box",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
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
                      e.currentTarget.style.boxShadow = "var(--card-shadow)";
                    }
                  }}
                >
                  {/* Top Row: Avatar + Name + Category + Rating */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
                    {/* Avatar */}
                    <div 
                      style={{ 
                        width: isMobile ? "46px" : "54px", 
                        height: isMobile ? "46px" : "54px", 
                        borderRadius: "12px", 
                        background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: isMobile ? "22px" : "26px",
                        color: "white",
                        flexShrink: 0,
                        boxShadow: "0 3px 8px rgba(0, 0, 0, 0.08)"
                      }}
                    >
                      {worker.service && worker.service.toLowerCase().includes("doc") ? "🩺" : 
                       worker.service && worker.service.toLowerCase().includes("plumb") ? "🔧" : 
                       worker.service && worker.service.toLowerCase().includes("paint") ? "🎨" : 
                       worker.service && worker.service.toLowerCase().includes("car") ? "🚗" : 
                       worker.service && worker.service.toLowerCase().includes("electr") ? "⚡" : "👷"}
                    </div>

                    {/* Middle: Name & Badges */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                        <h3 style={{ fontSize: isMobile ? "15px" : "16.5px", fontWeight: 800, margin: 0, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {worker.name}
                        </h3>
                        <span 
                          style={{ 
                            backgroundColor: "var(--primary-light)", 
                            color: "var(--primary-dark)", 
                            padding: "2px 7px", 
                            borderRadius: "6px", 
                            fontSize: "11px", 
                            fontWeight: 700,
                            border: "1px solid var(--border-color)",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {worker.service}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "var(--warning)", fontWeight: 800, fontSize: "12.5px" }}>
                          <FaStar size={12} /> {worker.rating || "5.0"}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600 }}>
                          <FaMapMarkerAlt size={11} /> {worker.city}
                        </span>
                        {worker.distanceKm !== undefined && (
                          <span style={{ backgroundColor: "rgba(49, 82, 91, 0.08)", color: "var(--text-main)", padding: "1px 7px", borderRadius: "10px", fontSize: "10.5px", fontWeight: 700 }}>
                            {worker.distanceKm < 0.5 ? "Under 0.5 km away" : `${worker.distanceKm} km away`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clean Divider */}
                  <div style={{ height: "1px", backgroundColor: "var(--border-color)", opacity: 0.6, margin: "2px 0" }} />

                  {/* Bottom Row: Standard Rate on Left, Book Button on Right */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <div>
                      <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", display: "block", fontWeight: 600 }}>Standard Rate</span>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.2px" }}>
                        ₹{worker.price || 349}
                      </span>
                    </div>

                    <Link 
                      to="/worker" 
                      onClick={() => localStorage.setItem("selected_worker", JSON.stringify(worker))}
                      style={{ textDecoration: "none" }}
                    >
                      <button 
                        className="btn-primary" 
                        style={{ 
                          padding: "8px 18px", 
                          borderRadius: "10px", 
                          fontSize: "13px", 
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 3px 10px rgba(49, 82, 91, 0.15)"
                        }}
                      >
                        Book Now ➔
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

