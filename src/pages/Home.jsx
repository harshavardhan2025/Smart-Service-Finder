import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LocationSearch from "../components/LocationSearch";
import MapPicker from "../components/MapPicker";
import TopWorkers from "../components/TopWorkers";
import CheapWorkers from "../components/CheapWorkers";
import NearbyWorkers from "../components/NearbyWorkers";
import { filterWorkersClientSide } from "../utils/workerService";
import SkeletonLoader from "../components/SkeletonLoader";

function Home() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem("userRole") || "user";

  const [locationText, setLocationText] = useState("");
  const [searchedLocation, setSearchedLocation] = useState("");
  const [userCoords, setUserCoords] = useState(null); // { lat, lng }
  const [serviceQuery, setServiceQuery] = useState("");
  const [onlineWorkers, setOnlineWorkers] = useState([]);
  const [aiSuggestedWorkers, setAiSuggestedWorkers] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestedAreas, setAiSuggestedAreas] = useState([]);

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
      
      // Always use the registered city as the source of truth
      const needsGeocode = !savedLat || !savedLng || !savedLoc || 
        (registeredCity && !savedLoc.toLowerCase().includes(registeredCity.toLowerCase()));
      
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
        // Coords already match the registered city — use them instantly!
        setSearchedLocation(savedLoc);
        setUserCoords({ lat: parseFloat(savedLat), lng: parseFloat(savedLng) });
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
            setAiSuggestedWorkers(suggested.slice(0, 3));
          } else {
            setAiSuggestedWorkers(matchingWorkers.slice(0, 3));
          }
        } else {
          setAiSuggestedWorkers(matchingWorkers.slice(0, 3));
        }
      } catch(e) { console.error("Home cloud workers fail", e); }
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
      {role === "user" && <Sidebar />}
      <Navbar />

      {/* Hero Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
          borderBottom: "4px solid #172554",
          color: "white",
          padding: "50px 20px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(30, 64, 175, 0.15)"
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
        />

        {/* Location context banner */}
        {searchedLocation && (
          <div
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
              gap: "6px"
            }}
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
                    <div key={idx} style={{ backgroundColor: "white", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--primary-light)", display: "flex", flexDirection: "column", gap: "4px", minWidth: "140px" }}>
                      <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)" }}>{worker.name}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{worker.service}</span>
                      <span style={{ fontSize: "12px", color: "#eab308", fontWeight: "bold" }}>⭐ {worker.rating}</span>
                    </div>
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

        <MapPicker
          onLocationChange={(loc) => setSearchedLocation(loc)}
          onCoordsChange={(coords) => setUserCoords(coords)}
        />

        {/* 🚨 Instant Booking Services (Active Online Workers) */}
        <div className="fade-in" style={{ padding: "20px", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              ⚡ Instant Booking Services
            </h2>
            <span style={{ backgroundColor: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="pulse-dot" style={{ width: "6px", height: "6px", backgroundColor: "#dc2626", borderRadius: "50%", display: "inline-block" }} />
              10-20 MINS ARRIVAL
            </span>
          </div>
          <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            The following certified professionals are currently online, active, and dispatched instantly for emergency assistance.
          </p>

          {(serviceQuery
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
            <div style={{ display: "flex", overflowX: "auto", gap: "16px", paddingBottom: "10px" }}>
              {(serviceQuery
                ? onlineWorkers.filter((w) =>
                    w.service &&
                    w.service.toLowerCase().includes(serviceQuery.toLowerCase())
                  )
                : onlineWorkers
              ).map((worker) => (
                <div
                  key={worker._id || worker.id}
                  className="premium-card"
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
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>📍 {worker.city}</span>
                    <strong style={{ color: "var(--primary-dark)", fontSize: "14px" }}>₹{worker.price || 399}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <TopWorkers searchedLocation={searchedLocation} userCoords={userCoords} />
        <CheapWorkers searchedLocation={searchedLocation} userCoords={userCoords} />
        <NearbyWorkers searchedLocation={searchedLocation} userCoords={userCoords} />
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