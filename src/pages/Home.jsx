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
import { FaMapMarkerAlt, FaLocationArrow, FaMap, FaBolt, FaCircle, FaUser, FaStethoscope, FaPercent, FaStar } from "react-icons/fa";

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
  const userName = sessionStorage.getItem("userName") || "";

  const [locationText, setLocationText] = useState("");
  const [plans, setPlans] = useState([]);
  const [offers, setOffers] = useState([]);
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
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiBannerText, setAiBannerText] = useState("");
  const [aiBannerExpertsTitle, setAiBannerExpertsTitle] = useState("");
  const [aiBannerBonusText, setAiBannerBonusText] = useState("");

  // Compute available plans and offers for the user's selected location
  const uCity = (localStorage.getItem("userCity") || "").toLowerCase().trim();
  const today = new Date().toISOString().split("T")[0];
  const availableOffersCount = offers.filter(offer => {
    if (offer.endDate && offer.endDate < today) return false;
    if (!offer.city || offer.city.trim() === "" || offer.city.toLowerCase() === "all") return true;
    if (!uCity) return false;
    const targetCities = offer.city.toLowerCase().split(",").map(c => c.trim());
    return targetCities.some(c => uCity.includes(c) || c.includes(uCity));
  }).length;

  const availablePlansCount = plans.filter(plan => {
    if (plan.endDate && plan.endDate < today) return false;
    if (!plan.city || plan.city.trim() === "" || plan.city.toLowerCase() === "all") return true;
    if (!uCity) return false;
    const targetCities = plan.city.toLowerCase().split(",").map(c => c.trim());
    return targetCities.some(c => uCity.includes(c) || c.includes(uCity));
  }).length;

  const [aiSuggestedAreas, setAiSuggestedAreas] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationSearchInput, setLocationSearchInput] = useState(
    localStorage.getItem("userLocation") || "Kadapa, Andhra Pradesh, India"
  );

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        const flow = sessionStorage.getItem("google_auth_flow");
        if (flow === "login") {
          navigate(`/login#access_token=${accessToken}`);
        } else if (flow === "signup") {
          navigate(`/signup#access_token=${accessToken}`);
        }
      }
    }
  }, [navigate]);

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
    setLocationError(null);
    if (!navigator.geolocation) {
      const success = await detectIpLocation();
      if (!success) {
        setLocationError("Failed to auto-detect location. Please search manually.");
      }
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
        console.warn("Home browser geolocation failed:", err);
        if (err.code === 1) {
          setLocationError("Location permission denied. Please allow location access in your browser/device settings.");
        } else if (err.code === 2) {
          setLocationError("Location is turned off or unavailable. Please turn on your device's GPS/Location services.");
        } else if (err.code === 3) {
          setLocationError("Location request timed out. Please check your signal or try again.");
        } else {
          setLocationError("Failed to auto-detect location. Please search manually.");
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
      } catch (e) {
        console.error("Home cloud workers fail", e);
      } finally {
        setIsOnlineLoading(false);
      }
    };
    syncOnline();
    const interval = setInterval(syncOnline, 10000); // Keep synced periodically in case database changes
    return () => clearInterval(interval);
  }, [searchedLocation, userCoords, aiSuggestedAreas]);

  useEffect(() => {
    const fetchPlansAndOffers = async () => {
      try {
        const [pResp, oResp] = await Promise.all([
          fetch("/api/plans"),
          fetch("/api/offers")
        ]);
        if (pResp.ok) setPlans(await pResp.json());
        if (oResp.ok) setOffers(await oResp.json());
      } catch (err) {
        console.error("Failed to load plans/offers for Home page", err);
      }
    };
    fetchPlansAndOffers();
  }, []);

  // 🤖 Zy AI: Generate dynamic, personalized banner text
  useEffect(() => {
    if (isAiLoading || !searchedLocation) return;

    // Check cache — only regenerate when location or user changes
    const userName = sessionStorage.getItem("userName") || "";
    const cacheKey = `aiBanner_${searchedLocation}_${userName || "guest"}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.ts && Date.now() - parsed.ts < 30 * 60 * 1000) { // Cache for 30 mins
          setAiBannerText(parsed.bannerText || "");
          setAiBannerExpertsTitle(parsed.expertsTitle || "");
          setAiBannerBonusText(parsed.bonusText || "");
          return;
        }
      } catch (e) { /* ignore bad cache */ }
    }

    const workerNames = aiSuggestedWorkers.slice(0, 3).map(w => w.name).join(", ");
    const workerServices = [...new Set(aiSuggestedWorkers.map(w => w.service))].join(", ");
    const shortLoc = getShortLocation(searchedLocation);

    const generateBannerText = async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: `You are Zy, the Workzy AI assistant. Generate a short, engaging, personalized banner paragraph (2-3 sentences max) for the home page.
Context:
- User name: "${userName || "there"}"
- User location: "${shortLoc}"
- ${aiSuggestedWorkers.length} experts found nearby (names: ${workerNames || "none"}, services: ${workerServices || "various"})
- ${availablePlansCount} service plans available
- ${availableOffersCount} promo offers active

Reply with ONLY a JSON object with these 3 keys:
1. "bannerText": The main greeting paragraph (personalized, friendly, use 1-2 emojis). Example: "Hey Ravi! 🎯 I found 3 top-rated experts near Kakinada ready to help you today."
2. "expertsTitle": A short title for the experts section (creative, max 6 words). Example: "🔥 Top Picks Near You"
3. "bonusText": A short promo line about available plans/offers (max 1 sentence). Example: "🎁 Unlock 3 exclusive plans and 1 promo code for your area!"

No markdown, no \`\`\`json wrappers. Reply with ONLY the raw JSON.`
            }]
          })
        });

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          let raw = data.choices[0].message.content;
          // Clean markdown wrappers if AI adds them
          raw = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
          const parsed = JSON.parse(raw);
          setAiBannerText(parsed.bannerText || "");
          setAiBannerExpertsTitle(parsed.expertsTitle || "");
          setAiBannerBonusText(parsed.bonusText || "");

          // Cache the result
          localStorage.setItem(cacheKey, JSON.stringify({
            ...parsed,
            ts: Date.now()
          }));
        }
      } catch (err) {
        console.error("AI banner text generation failed:", err);
        // Fallback — keep empty, the JSX below has default text as fallback
      }
    };

    generateBannerText();
  }, [isAiLoading, searchedLocation, aiSuggestedWorkers, availablePlansCount, availableOffersCount]);

  // Extract a short readable city/area name from the full address string
  const getShortLocation = (fullAddress) => {
    if (!fullAddress) return "";
    const parts = fullAddress.split(",");
    // Return first 2 meaningful parts (city/area level)
    return parts.slice(0, 2).join(",").trim();
  };

  const getNormalizedServiceQuery = (q) => {
    if (!q) return "";
    const lower = q.toLowerCase().trim();
    if (lower.includes("plumb")) return "plumbing";
    if (lower.includes("electr")) return "electrical";
    if (lower.includes("carpent")) return "carpentry";
    if (lower.includes("paint")) return "painting";
    if (lower.includes("clean")) return "cleaning";
    if (lower.includes("doc") || lower.includes("med")) return "doctor";
    if (lower.includes("ac ") || lower === "ac" || lower.includes("air cond")) return "ac repair";
    if (lower.includes("pack") || lower.includes("mov")) return "packers";
    if (lower.includes("mechanic")) return "mechanic";
    return lower;
  };
  const normServiceQ = getNormalizedServiceQuery(serviceQuery);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero Welcome Banner - Golden Orange with Floating Clouds */}
      <div
        className="hero-welcome-banner"
        style={{
          background: "var(--hero-bg)",
          borderBottom: "2px solid var(--hero-border)",
          color: "var(--hero-text)",
          padding: "12px 16px 14px 16px",
          textAlign: "center",
          boxShadow: "0 8px 24px -6px rgba(223, 180, 83, 0.4)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Floating clouds on both sides */}
        <svg
          viewBox="0 0 24 24"
          style={{
            position: "absolute",
            left: "4%",
            bottom: "10%",
            width: "65px",
            height: "65px",
            opacity: 0.25,
            fill: "white",
            pointerEvents: "none",
            animation: "drift 25s linear infinite"
          }}
        >
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          style={{
            position: "absolute",
            right: "5%",
            top: "10%",
            width: "80px",
            height: "80px",
            opacity: 0.22,
            fill: "white",
            pointerEvents: "none",
            animation: "driftReverse 30s linear infinite"
          }}
        >
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>

        <style>{`
          @keyframes drift {
            0% { transform: translateX(0px) translateY(0px); }
            50% { transform: translateX(15px) translateY(-5px); }
            100% { transform: translateX(0px) translateY(0px); }
          }
          @keyframes driftReverse {
            0% { transform: translateX(0px) translateY(0px); }
            50% { transform: translateX(-20px) translateY(5px); }
            100% { transform: translateX(0px) translateY(0px); }
          }
        `}</style>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(30, 58, 138, 0.25)", padding: "3px 12px", borderRadius: "16px", fontSize: "10.5px", fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>
          ✨ VERIFIED ON-DEMAND SERVICE NETWORK
        </div>
        <h1 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: 900, color: "var(--hero-text)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", letterSpacing: "-0.3px" }}>
          Find Reliable Service Experts Near You <FaMapMarkerAlt size={20} style={{ color: "#dc2626" }} />
        </h1>
        <p style={{ margin: 0, fontSize: "13.5px", color: "var(--hero-subtext)", fontWeight: 700, maxWidth: "650px", marginLeft: "auto", marginRight: "auto" }}>
          Auto-matching, verified professional workers, and instant secure bookings.
        </p>
      </div>

      <div style={{ flex: 1, width: "100%", margin: "0 auto", padding: "0px", boxSizing: "border-box" }}>

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

        {/* Location context banner - Ultra Modern Glassmorphism AI Card */}
        {searchedLocation && (
          <div
            className="ai-banner-card"
            onClick={() => {
              setShowMap(true);
              setTimeout(() => {
                document.querySelector(".home-map-wrapper")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            style={{
              margin: "0 20px 20px 20px",
              padding: "24px 28px",
              background: "var(--ai-banner-bg)",
              border: "1.5px solid var(--ai-banner-border)",
              borderRadius: "20px",
              fontSize: "14px",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              minHeight: "auto",
              boxShadow: "0 16px 36px -10px rgba(0, 0, 0, 0.25), 0 0 20px rgba(16, 185, 129, 0.15)",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(0, 0, 0, 0.35), 0 0 25px rgba(16, 185, 129, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 16px 36px -10px rgba(0, 0, 0, 0.25), 0 0 20px rgba(16, 185, 129, 0.15)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)" }}>
                  🤖
                </div>
                <div>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.2px" }}>
                    Zy AI — Nearby Search Active
                  </span>
                  <div style={{ fontSize: "11px", color: "#34d399", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#34d399", display: "inline-block", boxShadow: "0 0 8px #34d399" }}></span>
                    LIVE REAL-TIME MATCHING
                  </div>
                </div>
              </div>

              <div style={{ padding: "4px 12px", borderRadius: "20px", background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.15)", fontSize: "12px", color: "#e2e8f0", fontWeight: 600 }}>
                📍 {getShortLocation(searchedLocation)}
              </div>
            </div>

            <div style={{ fontSize: "14px", color: "rgba(241, 245, 249, 0.95)", lineHeight: "1.6", fontWeight: 400 }}>
              {aiBannerText || (<>Hey {userName ? userName.split(' ')[0] : 'there'}! Based on your location <strong>{getShortLocation(searchedLocation)}</strong>, Zy found top verified experts, budget-friendly workers, and instant bookings in your area!</>)}
            </div>

            {isAiLoading ? (
              <div style={{ marginTop: "12px" }}>
                <SkeletonLoader type="list" count={1} />
              </div>
            ) : aiSuggestedWorkers.length > 0 ? (
              <div style={{ marginTop: "8px" }}>
                <strong style={{ fontSize: "13px", color: "#ffffff", letterSpacing: "0.3px", textTransform: "uppercase" }}>{aiBannerExpertsTitle || "🔍 Zy's Top Picks For You:"}</strong>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "10px" }}>
                  {aiSuggestedWorkers.map((worker, idx) => (
                    <Link
                      key={idx}
                      to="/worker"
                      onClick={() => localStorage.setItem("selected_worker", JSON.stringify(worker))}
                      style={{ textDecoration: "none" }}
                    >
                      <div style={{
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(12px)",
                        padding: "12px 16px",
                        borderRadius: "14px",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        minWidth: "160px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.16)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                          e.currentTarget.style.transform = "none";
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: "14px", color: "#ffffff" }}>{worker.name}</span>
                        <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>{worker.service}</span>
                        <span style={{ fontSize: "12px", color: "#fbbf24", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>⭐ {worker.rating}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: "8px", fontSize: "13px", color: "rgba(226, 232, 240, 0.8)" }}>
                No specific experts matched locally. Explore all options below!
              </div>
            )}

            {!isAiLoading && (availableOffersCount > 0 || availablePlansCount > 0) && (
              <div style={{ marginTop: "8px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                    🎁 Location Bonuses Unlocked!
                  </strong>
                  <div style={{ fontSize: "12px", color: "rgba(203, 213, 225, 0.9)", marginTop: "2px" }}>
                    {aiBannerBonusText || (<>Zy analyzed {availablePlansCount > 0 && <strong>{availablePlansCount} Service Plan{availablePlansCount !== 1 ? 's' : ''}</strong>}
                    {availablePlansCount > 0 && availableOffersCount > 0 && " and "}
                    {availableOffersCount > 0 && <strong>{availableOffersCount} Active Promo Offer{availableOffersCount !== 1 ? 's' : ''}</strong>} for your area!</>)}
                  </div>
                </div>
                <Link 
                  to="/plans-offers" 
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 18px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", borderRadius: "12px", fontSize: "13px", fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.04)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                >
                  View Plans & Offers →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Premium Location Search & Auto-Detect Bar */}
        <div
          className="premium-card homepage-location-bar"
          style={{
            margin: "14px 0px",
            padding: "20px 24px",
            background: "linear-gradient(135deg, rgba(2, 132, 199, 0.05) 0%, rgba(2, 132, 199, 0.01) 100%)",
            borderTop: "1.5px solid rgba(2, 132, 199, 0.12)",
            borderBottom: "1.5px solid rgba(2, 132, 199, 0.12)",
            borderRadius: "0px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <FaMapMarkerAlt size={12} /> Set Service Location
            </span>
            {searchedLocation && (
              <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: "bold" }}>
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
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <FaLocationArrow size={12} /> Auto Detect
              </button>
            </div>
          </div>
        </div>

        {/* Map collapse toggle option - visible on all screen sizes */}
        <div className="map-toggle-container" style={{ padding: "0 0px 14px 0px" }}>
          <button
            onClick={() => setShowMap(!showMap)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "0px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              backgroundColor: showMap ? "var(--bg-card-hover)" : "var(--primary-light)",
              color: showMap ? "var(--text-primary)" : "var(--primary-dark)",
              borderTop: "1.5px solid var(--border-color)",
              borderBottom: "1.5px solid var(--border-color)",
              borderLeft: "none",
              borderRight: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}
          >
            <FaMap size={14} /> {showMap ? "Hide Interactive Map ▲" : "Show Interactive Map ▼"}
          </button>
        </div>

        <div className={`home-map-wrapper ${showMap ? "map-visible" : "map-hidden"}`}>
          <MapPicker
            onLocationChange={(loc) => setSearchedLocation(loc)}
            onCoordsChange={(coords) => setUserCoords(coords)}
          />
        </div>

        {/* 🚨 Instant Booking Services (Active Online Workers) */}
        <div className="fade-in home-section" style={{ padding: "20px 24px", margin: "14px 0px", background: "linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.01) 100%)", borderRadius: "0px", borderTop: "1.5px solid rgba(239, 68, 68, 0.12)", borderBottom: "1.5px solid rgba(239, 68, 68, 0.12)", borderLeft: "none", borderRight: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <FaBolt style={{ color: "var(--warning)" }} /> Instant Booking Services
            </h2>
            <span style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="pulse-dot" style={{ width: "6px", height: "6px", backgroundcolor: "var(--danger)", borderRadius: "50%", display: "inline-block" }} />
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
            ? onlineWorkers.filter((w) => {
              if (!w.service) return false;
              const ws = w.service.toLowerCase();
              const q = serviceQuery.toLowerCase().trim();
              return ws.includes(q) || ws.includes(normServiceQ) || normServiceQ.includes(ws);
            })
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
                ? onlineWorkers.filter((w) => {
                  if (!w.service) return false;
                  const ws = w.service.toLowerCase();
                  const q = serviceQuery.toLowerCase().trim();
                  return ws.includes(q) || ws.includes(normServiceQ) || normServiceQ.includes(ws);
                })
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
                  <span style={{ position: "absolute", top: "15px", right: "15px", backgroundColor: "var(--primary-light)", color: "var(--primary-dark)", padding: "4px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <FaCircle size={8} style={{ color: "var(--success)" }} /> ONLINE
                  </span>
                  <div style={{ marginBottom: "12px" }}>
                    {worker.service.includes("Doctors") ? <FaStethoscope size={32} style={{ color: "var(--primary)" }} /> : <FaUser size={32} style={{ color: "var(--primary)" }} />}
                  </div>
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

        {/* 🏷️ Service Plans & Seasonal Offers Preview */}
        {plans.length > 0 && (
          <div className="home-section" style={{ padding: "30px 24px", borderTop: "1.5px solid var(--border-color)", borderBottom: "1.5px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaPercent style={{ color: "#34d399" }} /> Service Plans & Seasonal Offers
            </h2>
            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
              Save big on recurring home maintenance with our service plans, or copy a promo code below.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "20px" }}>
              {plans.filter(p => !p.endDate || p.endDate >= today).slice(0, 3).map((plan, idx) => (
                <div key={idx} className="premium-card" style={{ padding: "24px", border: plan.popular ? "2px solid #eab308" : "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between", transform: plan.popular ? "scale(1.02)" : "none", boxShadow: plan.popular ? "0 10px 25px rgba(234, 179, 8, 0.15)" : "var(--shadow-3d)" }}>
                  <div>
                    {plan.popular && (
                      <span style={{ backgroundColor: "var(--warning)", color: "#000000", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "2px", marginBottom: "10px" }}>
                        POPULAR <FaStar size={8} />
                      </span>
                    )}
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: plan.popular ? "#eab308" : "var(--text-main)", fontWeight: 700 }}>{plan.title}</h4>
                    <p style={{ margin: "0 0 12px 0", fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>
                      ₹{(plan.price || "").replace("₹", "")}
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>/{plan.period}</span>
                    </p>
                    <ul style={{ paddingLeft: "16px", margin: "0 0 16px 0", fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                      {plan.features.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                  <Link to="/plans-offers" style={{ textDecoration: "none" }}>
                    <button className="btn-secondary" style={{ width: "100%", padding: "10px", fontSize: "13px", borderRadius: "8px", cursor: "pointer" }}>
                      View Plan Details →
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🛡️ Trust Signals Section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 24,
          margin: "40px 20px 20px 20px",
          padding: "28px",
          background: "var(--bg-card)",
          borderRadius: "20px",
          border: "1.5px solid var(--border-color)",
          backdropFilter: "blur(12px)",
          textAlign: "center"
        }}>
          <div>
            <div style={{ color: "var(--warning)", fontSize: "20px", marginBottom: "8px" }}>⭐ ⭐ ⭐ ⭐ ⭐</div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>4.9/5 Average Rating</h4>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>From over 10,00+ satisfied homeowners</p>
          </div>
          <div style={{ borderLeft: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "24px", marginBottom: "6px" }}>🛡️</div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>100% Satisfaction Guarantee</h4>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>Not satisfied? We will re-service for free</p>
          </div>
          <div>
            <div style={{ fontSize: "24px", marginBottom: "6px" }}>⏱️</div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>Flexible Cancellation</h4>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>Cancel or switch tiers anytime with no fees</p>
          </div>
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

      {/* Location Error Modal */}
      {locationError && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99999,
          display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
        }}>
          <div style={{
            backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)", maxWidth: "400px", width: "100%",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>📍</div>
            <h3 style={{ margin: "0 0 12px 0", color: "var(--text-main)", fontFamily: "'Outfit', sans-serif" }}>Location Access Needed</h3>
            <p style={{ margin: "0 0 24px 0", color: "var(--text-secondary)", lineHeight: "1.5" }}>{locationError}</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setLocationError(null)}
                style={{
                  backgroundColor: "var(--primary-light)", color: "var(--text-secondary)", border: "none",
                  padding: "12px 16px", borderRadius: "8px", fontWeight: "600",
                  cursor: "pointer", flex: 1, fontSize: "16px"
                }}
              >
                Close
              </button>
              <button
                onClick={handleAutoDetectLocation}
                style={{
                  backgroundColor: "#4f46e5", color: "white", border: "none",
                  padding: "12px 16px", borderRadius: "8px", fontWeight: "600",
                  cursor: "pointer", flex: 1, fontSize: "16px"
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;