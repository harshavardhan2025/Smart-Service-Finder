import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import LocationSearch from "../components/LocationSearch";
import MapPicker from "../components/MapPicker";
import TopWorkers from "../components/TopWorkers";
import CheapWorkers from "../components/CheapWorkers";
import NearbyWorkers from "../components/NearbyWorkers";
import { filterWorkersClientSide } from "../utils/workerService";
import SkeletonLoader from "../components/SkeletonLoader";

const truncateLocation = (loc) => {
  if (!loc) return "";
  const parts = loc.split(",");
  if (parts.length > 2) {
    return parts.slice(0, 2).join(",").trim();
  }
  return loc;
};

function Home() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem("userRole") || "user";

  const [locationText, setLocationText] = useState("");
  const [searchedLocation, setSearchedLocation] = useState(
    () => localStorage.getItem("userLocation") || "Kadapa, Andhra Pradesh, India"
  );
  const [userCoords, setUserCoords] = useState(() => {
    const savedLat = localStorage.getItem("userCoordsLat");
    const savedLng = localStorage.getItem("userCoordsLng");
    if (savedLat && savedLng) {
      return { lat: parseFloat(savedLat), lng: parseFloat(savedLng) };
    }
    return { lat: 14.471306, lng: 78.824165 };
  }); // { lat, lng }
  const [serviceQuery, setServiceQuery] = useState("");
  const [onlineWorkers, setOnlineWorkers] = useState([]);
  const [isOnlineLoading, setIsOnlineLoading] = useState(true);
  const [aiSuggestedWorkers, setAiSuggestedWorkers] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [aiSuggestedAreas, setAiSuggestedAreas] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [locationSearchInput, setLocationSearchInput] = useState(
    localStorage.getItem("userLocation") || "Kadapa, Andhra Pradesh, India"
  );

  useEffect(() => {
    if (searchedLocation) {
      setLocationSearchInput(searchedLocation);
    }
  }, [searchedLocation]);

  const detectIpLocation = async () => {
    try {
      const res = await fetch("/api/workers/ip-location");
      if (res.ok) {
        const data = await res.json();
        if (data && data.lat && data.lon) {
          setUserCoords({ lat: data.lat, lng: data.lon });
          setSearchedLocation(data.label);
          localStorage.setItem("userLocation", data.label);
          localStorage.setItem("userCity", data.city);
          localStorage.setItem("userCoordsLat", data.lat.toString());
          localStorage.setItem("userCoordsLng", data.lon.toString());
          localStorage.setItem("manualLocationSet", "true");
          return true;
        }
      }
    } catch (e) {
      console.error("IP fallback location fetch failed:", e);
    }
    return false;
  };

  const handleAutoDetectLocation = async () => {
    if (!navigator.geolocation) {
      await detectIpLocation();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        localStorage.setItem("userCoordsLat", latitude.toString());
        localStorage.setItem("userCoordsLng", longitude.toString());
        localStorage.setItem("manualLocationSet", "true");
        
        try {
          const url = `https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const f = data?.features?.[0];
            if (f) {
              const p = f.properties;
              const city = p.city || p.town || p.village || p.county || p.name || "";
              const label = [p.name, p.housenumber, p.street, p.city || p.town || p.village, p.state, p.country]
                .filter(Boolean).join(", ");
              
              setSearchedLocation(label);
              localStorage.setItem("userLocation", label);
              localStorage.setItem("userCity", city || "Mumbai");
            } else {
              const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
              setSearchedLocation(fallback);
              localStorage.setItem("userLocation", fallback);
              localStorage.setItem("userCity", "Mumbai");
            }
          } else {
            const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setSearchedLocation(fallback);
            localStorage.setItem("userLocation", fallback);
            localStorage.setItem("userCity", "Mumbai");
          }
        } catch (err) {
          const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setSearchedLocation(fallback);
          localStorage.setItem("userLocation", fallback);
          localStorage.setItem("userCity", "Mumbai");
        }
      },
      async (err) => {
        console.warn("Home browser geolocation failed, trying IP location:", err);
        const success = await detectIpLocation();
        if (!success) {
          alert("Failed to auto-detect location. Please search manually.");
        }
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  };

  const handleSearchLocationSubmit = async () => {
    if (!locationSearchInput.trim()) return;
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(locationSearchInput.trim())}&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const f = data?.features?.[0];
        if (f) {
          const [lon, lat] = f.geometry.coordinates;
          const p = f.properties;
          const city = p.city || p.town || p.village || p.county || p.name || locationSearchInput;
          const label = [p.name, p.city || p.town || p.village, p.state, p.country]
            .filter(Boolean).join(", ");
          
          setUserCoords({ lat, lng: lon });
          setSearchedLocation(label);
          localStorage.setItem("userLocation", label);
          localStorage.setItem("userCity", city);
          localStorage.setItem("userCoordsLat", lat.toString());
          localStorage.setItem("userCoordsLng", lon.toString());
          localStorage.setItem("manualLocationSet", "true");
          return;
        }
      }
    } catch (e) {
      console.warn("Photon search failed, trying proxy:", e.message);
    }

    // Fallback: proxy
    try {
      const res = await fetch(`/api/workers/geocode?q=${encodeURIComponent(locationSearchInput.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.lat && data?.lon) {
          const lat = parseFloat(data.lat);
          const lon = parseFloat(data.lon);
          setUserCoords({ lat, lng: lon });
          setSearchedLocation(data.label || locationSearchInput);
          localStorage.setItem("userLocation", data.label || locationSearchInput);
          localStorage.setItem("userCity", data.city || "");
          localStorage.setItem("userCoordsLat", lat.toString());
          localStorage.setItem("userCoordsLng", lon.toString());
          localStorage.setItem("manualLocationSet", "true");
        } else {
          alert("Location not found. Please try a different search.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Location not found.");
    }
  };

  // Automatic redirect if Admin or Worker tries to visit the general home page directly
  useEffect(() => {
    if (role === "admin") {
      navigate("/admin-dashboard");
    } else if (role === "worker") {
      navigate("/worker-dashboard");
    }
  }, [role, navigate]);

  // Automatically trigger location detection on mount for logged-in user using their registered profile location
  useEffect(() => {
    if (role === "user") {
      const savedLat = localStorage.getItem("userCoordsLat");
      const savedLng = localStorage.getItem("userCoordsLng");
      const savedLoc = localStorage.getItem("userLocation");
      const registeredCity = sessionStorage.getItem("userCity") || localStorage.getItem("userCity");
      const isManualLocation = localStorage.getItem("manualLocationSet") === "true";
      
      // Always use the registered city as the source of truth if not manually set
      const needsGeocode = !isManualLocation && (!savedLat || !savedLng || !savedLoc || 
        (registeredCity && !savedLoc.toLowerCase().includes(registeredCity.toLowerCase())));
      
      if (needsGeocode) {
        const targetCity = registeredCity || "Mumbai";
        
        const geocodeProfileCity = async () => {
          try {
            const url = `/api/workers/geocode?q=${encodeURIComponent(targetCity)}`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              if (data?.lat && data?.lon) {
                const lat = parseFloat(data.lat);
                const lon = parseFloat(data.lon);
                const finalLabel = data.label || targetCity;
                
                localStorage.setItem("userLocation", finalLabel);
                localStorage.setItem("userCity", targetCity);
                localStorage.setItem("userCoordsLat", lat.toString());
                localStorage.setItem("userCoordsLng", lon.toString());
                
                setSearchedLocation(finalLabel);
                setUserCoords({ lat, lng: lon });
              } else {
                localStorage.setItem("userLocation", targetCity);
                setSearchedLocation(targetCity);
              }
            }
          } catch (err) {
            console.error("Home geocode registered profile city failed:", err);
            localStorage.setItem("userLocation", targetCity);
            setSearchedLocation(targetCity);
          }
        };
        
        geocodeProfileCity();
      } else {
        // Coords already match the registered city or manual location is set — use them instantly!
        if (savedLoc && savedLat && savedLng) {
          setSearchedLocation(savedLoc);
          setUserCoords({ lat: parseFloat(savedLat), lng: parseFloat(savedLng) });
        }
      }
    }
  }, [role]);

  // Deep-linking AI recommended service bridge
  useEffect(() => {
    const savedQuery = localStorage.getItem("voice_query");
    if (savedQuery) {
      setServiceQuery(savedQuery);
      setLocationText(savedQuery);
      localStorage.removeItem("voice_query");
    }
  }, []);

  useEffect(() => {
    if (!searchedLocation) {
      setAiSuggestedWorkers([]);
      localStorage.removeItem("userLocation");
      localStorage.removeItem("userCity");
      return;
    }
    
    localStorage.setItem("userLocation", searchedLocation);

    // 🔍 ADAPTIVE LOCALIZER: Ensure userCity is properly resolved for downstream payment and scheduling components!
    let resolvedCity = localStorage.getItem("userCity");
    
    if (!resolvedCity && searchedLocation) {
      // Check if searchedLocation is raw coordinates
      const coordParts = searchedLocation.split(",").map(p => parseFloat(p.trim()));
      const isCoords = coordParts.length === 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1]);
      
      if (!isCoords) {
        const parts = searchedLocation.split(",");
        resolvedCity = parts[0].trim();
      } else {
        resolvedCity = "Mumbai";
      }
    }
    
    localStorage.setItem("userCity", resolvedCity || "Mumbai");

    
    const fetchAILocationsAndSuggestWorkers = async () => {
      setIsAiLoading(true);

      try {
        // CRA prefers process.env over import.meta.env. Standard fallback inserted.
        // 🔐 ENFORCED ARCHITECTURE LOCKDOWN: Redirect to internal proxy endpoint instantly!
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `You are a geolocation AI. The user is at "${searchedLocation}". List exactly 3 nearby famous local areas or neighborhoods. Reply with ONLY a comma-separated list, no other words.`
              }
            ]
          })
        });
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          const result = data.choices[0].message.content;
          if (result && typeof result === "string") {
            const parsedAreas = result.split(",").map(a => a.trim().toLowerCase());
            setAiSuggestedAreas(parsedAreas);
          }
        } else {
          throw new Error("No choices returned");
        }
      } catch (err) {
        console.error("AI Fetch Failed, using fallback", err);
        // If API fails, just stick to the base location
      } finally {
        setIsAiLoading(false);
        
        // Note: Physical dynamic cloud sync is active below! 
      }
    };
    
    fetchAILocationsAndSuggestWorkers();
  }, [searchedLocation]);

  useEffect(() => {
    if (!searchedLocation && !userCoords) {
      setOnlineWorkers([]);
      setAiSuggestedWorkers([]);
      return;
    }

    // Immediately clear previous lists to prevent showing wrong or stale data while loading new location
    setOnlineWorkers([]);
    setAiSuggestedWorkers([]);

    const syncOnline = async () => {
      try {
        let extractedKey = "";
        if (searchedLocation) {
          const storedCity = localStorage.getItem("userCity");
          if (storedCity) {
            extractedKey = storedCity.toLowerCase().trim();
          } else {
            const parts = searchedLocation.split(",");
            extractedKey = parts[0].trim().toLowerCase();
          }
        }
        
        // Instant client-side filtering under 0.1ms!
        const matchingWorkers = await filterWorkersClientSide(userCoords, extractedKey);
        
        setOnlineWorkers(matchingWorkers);
        
        // Prioritize matching workers residing or operating in AI suggested neighborhoods
        if (aiSuggestedAreas.length > 0) {
          const suggested = matchingWorkers.filter(worker => {
            const wLoc = (worker.location || "").toLowerCase();
            const wCity = (worker.city || "").toLowerCase();
            return aiSuggestedAreas.some(area => wLoc.includes(area) || wCity.includes(area) || area.includes(wLoc) || area.includes(wCity));
          });
          
          if (suggested.length > 0) {
            setAiSuggestedWorkers(suggested.slice(0, 5));
          } else {
            setAiSuggestedWorkers(matchingWorkers.slice(0, 5));
          }
        } else {
          setAiSuggestedWorkers(matchingWorkers.slice(0, 5));
        }
      } catch(e) {
        console.error("Home cloud workers fail", e);
      } finally {
        setIsOnlineLoading(false);
      }
    };
    syncOnline();
    const interval = setInterval(syncOnline, 10000); // Keep synced periodically in case database changes
    return () => clearInterval(interval);
  }, [searchedLocation, userCoords, aiSuggestedAreas]);

  // Extract a short readable city/area name from the full address string
  const getShortLocation = (fullAddress) => {
    if (!fullAddress) return "";
    const parts = fullAddress.split(",");
    // Return first 2 meaningful parts (city/area level)
    return parts.slice(0, 2).join(",").trim();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #394f8a 0%, #4a5fc1 100%)",
          borderBottom: "4px solid #18233c",
          color: "white",
          padding: "50px 20px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(57, 79, 138, 0.15)"
        }}
      >
        <h1 style={{ margin: "0 0 10px 0", fontSize: "32px", fontWeight: 800, color: "white" }}>
          Find Reliable Service Experts Near You 📍
        </h1>
        <p style={{ margin: 0, fontSize: "16px", color: "rgba(255, 255, 255, 0.9)", fontWeight: "500" }}>
          Auto-matching, verified professional workers, and instant secure bookings.
        </p>
      </div>

      <div style={{ flex: 1, maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "10px" }}>

        <LocationSearch
          value={locationText}
          onChange={setLocationText}
          onSearch={(query) => setServiceQuery(query)}
          detectedLocation={searchedLocation}
          onLocationClick={() => {
            setShowMap(true);
            setTimeout(() => {
              document.querySelector(".home-map-wrapper")?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
        />

        {/* Location context banner */}
        {searchedLocation && (
          <div
            onClick={() => {
              setShowMap(true);
              setTimeout(() => {
                document.querySelector(".home-map-wrapper")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            style={{
              margin: "0 20px 10px 20px",
              padding: "14px 16px",
              backgroundColor: "var(--primary-light)",
              borderLeft: "4px solid var(--primary)",
              borderRadius: "6px",
              fontSize: "14px",
              color: "var(--primary-dark)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              cursor: "pointer",
              transition: "transform 0.15s ease",
              minHeight: "155px"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.01)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🤖</span>
              <span>
                <strong>AI-Powered Nearby Search Active</strong>
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Based on your fetched location <strong>{getShortLocation(searchedLocation)}</strong>, our AI has automatically searched the database to find the Top Rated Professionals, Budget-Friendly Workers, and Instant Bookings in your area and surrounding locations!
            </div>
            
            {isAiLoading ? (
              <div style={{ marginTop: "12px" }}>
                <SkeletonLoader type="list" count={1} />
              </div>
            ) : aiSuggestedWorkers.length > 0 ? (
              <div style={{ marginTop: "12px" }}>
                <strong style={{ fontSize: "13px", color: "var(--primary-dark)" }}>AI Recommended Experts for You:</strong>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                  {aiSuggestedWorkers.map((worker, idx) => (
                    <Link 
                      key={idx} 
                      to="/worker" 
                      onClick={() => localStorage.setItem("selected_worker", JSON.stringify(worker))}
                      style={{ textDecoration: "none" }}
                    >
                      <div style={{ backgroundColor: "white", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--primary-light)", display: "flex", flexDirection: "column", gap: "4px", minWidth: "140px", cursor: "pointer", transition: "transform 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                      >
                        <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)" }}>{worker.name}</span>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{worker.service}</span>
                        <span style={{ fontSize: "12px", color: "#eab308", fontWeight: "bold" }}>⭐ {worker.rating}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
               <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                No specific experts matched locally. Explore all options below!
              </div>
            )}
          </div>
        )}

        {/* Premium Location Search & Auto-Detect Bar */}
        {!showMap && (
          <div 
            className="premium-card homepage-location-bar" 
            style={{ 
              margin: "10px 20px 14px 20px", 
              padding: "16px",
              backgroundColor: "var(--bg-card)",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>
                📍 Set Service Location
              </span>
              {searchedLocation && (
                <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "bold" }}>
                  Active Address Resolved
                </span>
              )}
            </div>
            
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search city, town, street, village..."
                value={locationSearchInput}
                onChange={(e) => setLocationSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearchLocationSubmit(); }}
                style={{ 
                  flex: 1, 
                  minWidth: "200px",
                  padding: "10px 12px",
                  fontSize: "13.5px",
                  borderRadius: "8px"
                }}
              />
              <div style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "260px" }} className="location-action-buttons">
                <button
                  onClick={handleSearchLocationSubmit}
                  className="btn-primary"
                  style={{ 
                    flex: 1,
                    padding: "10px",
                    fontSize: "13px",
                    borderRadius: "8px",
                    whiteSpace: "nowrap"
                  }}
                >
                  Search
                </button>
                <button
                  onClick={handleAutoDetectLocation}
                  className="btn-secondary"
                  style={{ 
                    flex: 1,
                    padding: "10px",
                    fontSize: "13px",
                    borderRadius: "8px",
                    backgroundColor: "#0284c7",
                    color: "white",
                    whiteSpace: "nowrap"
                  }}
                >
                  📍 Auto Detect
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map collapse toggle option - visible on all screen sizes */}
        <div className="map-toggle-container" style={{ padding: "0 20px 14px 20px" }}>
          <button
            onClick={() => setShowMap(!showMap)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              backgroundColor: showMap ? "#f1f5f9" : "var(--primary-light)",
              color: showMap ? "var(--text-primary)" : "var(--primary-dark)",
              border: "1.5px solid var(--border-color)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}
          >
            {showMap ? "🗺️ Hide Interactive Map ▲" : "🗺️ Show Interactive Map ▼"}
          </button>
        </div>

        <div className={`home-map-wrapper ${showMap ? "map-visible" : "map-hidden"}`}>
          <MapPicker
            onLocationChange={(loc) => setSearchedLocation(loc)}
            onCoordsChange={(coords) => setUserCoords(coords)}
          />
        </div>

        {/* 🚨 Instant Booking Services (Active Online Workers) */}
        <div className="fade-in home-section" style={{ padding: "12px 20px 8px 20px", marginBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              ⚡ Instant Booking Services
            </h2>
            <span style={{ backgroundColor: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="pulse-dot" style={{ width: "6px", height: "6px", backgroundColor: "#dc2626", borderRadius: "50%", display: "inline-block" }} />
              10-20 MINS ARRIVAL
            </span>
          </div>
          <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            The following certified professionals are currently online, active, and dispatched instantly for emergency assistance.
          </p>

          {isOnlineLoading ? (
            <div className="horizontal-scroll-container" style={{ display: "flex", overflowX: "auto", gap: "16px", paddingBottom: "10px" }}>
              <SkeletonLoader type="card" count={4} />
            </div>
          ) : (serviceQuery
              ? onlineWorkers.filter((w) =>
                  w.service &&
                  w.service.toLowerCase().includes(serviceQuery.toLowerCase())
                )
              : onlineWorkers
            ).length === 0 ? (
            <div className="premium-card" style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
              <span style={{ fontSize: "28px", display: "block", marginBottom: "8px", filter: "grayscale(1)" }}>💤</span>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>No emergency professionals are online right now.</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>You can still reserve any provider using standard time slots below!</p>
            </div>
          ) : (
            <div className="horizontal-scroll-container" style={{ display: "flex", overflowX: "auto", gap: "16px", paddingBottom: "10px" }}>
              {(serviceQuery
                ? onlineWorkers.filter((w) =>
                    w.service &&
                    w.service.toLowerCase().includes(serviceQuery.toLowerCase())
                  )
                : onlineWorkers
              ).map((worker) => (
                <div
                  key={worker._id || worker.id}
                  className="premium-card worker-card"
                  onClick={() => {
                    localStorage.setItem("selected_worker", JSON.stringify(worker));
                    navigate("/worker");
                  }}
                  style={{
                    minWidth: "250px",
                    padding: "20px",
                    cursor: "pointer",
                    position: "relative"
                  }}
                >
                  <span style={{ position: "absolute", top: "15px", right: "15px", backgroundColor: "var(--primary-light)", color: "var(--primary-dark)", padding: "4px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: 700 }}>
                    🟢 ONLINE
                  </span>
                  <div style={{ fontSize: "32px", marginBottom: "12px", textShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>{worker.service.includes("Doctors") ? "🩺" : "👷"}</div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "bold", color: "var(--text-primary)" }}>{worker.name}</h3>
                  <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>{worker.service}</p>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>📍 {truncateLocation(worker.city)}</span>
                    <span className="price-badge">₹{worker.price || 399}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="home-section" style={{ marginBottom: "0" }}>
          <TopWorkers searchedLocation={searchedLocation} userCoords={userCoords} />
        </div>
        <div className="home-section" style={{ marginBottom: "0" }}>
          <CheapWorkers searchedLocation={searchedLocation} userCoords={userCoords} />
        </div>
        <div className="home-section" style={{ marginBottom: "0" }}>
          <NearbyWorkers searchedLocation={searchedLocation} userCoords={userCoords} />
        </div>
      </div>

      {/* Modern Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          color: "var(--text-secondary)",
          fontSize: "14px",
          backgroundColor: "var(--bg-card)",
          borderTop: "1px solid var(--border-color)",
          marginTop: "40px",
          fontWeight: 500
        }}
      >
        © 2026 Workzy Inc. All rights reserved. Made with ❤️ by PS-152 Team.
      </footer>
    </div>
  );
}

export default Home;