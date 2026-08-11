import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import AISmartSearchHub from "../components/AISmartSearchHub";
import TopWorkers from "../components/TopWorkers";
import CheapWorkers from "../components/CheapWorkers";
import NearbyWorkers from "../components/NearbyWorkers";
import { filterWorkersClientSide } from "../utils/workerService";
import SkeletonLoader from "../components/SkeletonLoader";

import {
  FaMapMarkerAlt,
  FaBolt,
  FaCircle,
  FaUser,
  FaStethoscope,
  FaPercent,
  FaStar,
  FaTools,
} from "react-icons/fa";

/* =========================================================
   HELPERS
========================================================= */

const DEFAULT_LOCATION = "Kadapa, Andhra Pradesh, India";

const DEFAULT_COORDS = {
  lat: 14.471306,
  lng: 78.824165,
};

const truncateLocation = (loc) => {
  if (!loc) return "";
  const parts = String(loc)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 2) {
    return parts.slice(0, 2).join(", ");
  }
  return parts.join(", ");
};

const getShortLocation = (location) => {
  if (!location) return "";
  const parts = String(location)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.slice(0, 2).join(", ");
};

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalize = (value = "") => String(value).toLowerCase().trim();

const getStoredCoords = () => {
  const lat = parseFloat(localStorage.getItem("userCoordsLat"));
  const lng = parseFloat(localStorage.getItem("userCoordsLng"));
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  return DEFAULT_COORDS;
};

/* =========================================================
   SERVICE MATCHING
========================================================= */

const SERVICE_ALIASES = {
  plumbing: [
    "plumber",
    "plumbing",
    "plumb",
    "pipe",
    "tap",
    "leak",
    "leakage",
    "drain",
    "toilet",
    "faucet",
    "sink",
  ],
  electrical: [
    "electrician",
    "electric",
    "electrical",
    "electrican",
    "wiring",
    "wire",
    "switch",
    "fuse",
    "fan",
    "light",
    "socket",
    "mcb",
    "breaker",
    "power",
  ],
  carpentry: [
    "carpenter",
    "carpentry",
    "wood",
    "woodwork",
    "furniture",
    "door",
    "chair",
    "table",
    "wardrobe",
    "cabinet",
  ],
  "ac repair": [
    "ac",
    "ac repair",
    "ac service",
    "air conditioner",
    "air conditioning",
    "cooling",
    "coolng",
    "compressor",
    "condenser",
    "hvac",
    "split ac",
    "window ac",
  ],
  "washing machine": [
    "washing machine",
    "washer",
    "dryer",
    "laundry",
    "washing",
  ],
  geyser: [
    "geyser",
    "heater",
    "water heater",
    "hot water",
    "boiler",
  ],
  refrigerator: [
    "fridge",
    "refrigerator",
    "freezer",
    "fridge cooling",
  ],
  "water purifier": [
    "purifier",
    "water purifier",
    "ro",
    "ro service",
    "aquaguard",
    "kent",
  ],
  cleaning: [
    "cleaning",
    "clean",
    "house cleaning",
    "home cleaning",
    "deep cleaning",
    "maid",
    "vacuum",
    "sweep",
    "mop",
  ],
  painting: [
    "painting",
    "paint",
    "painter",
    "wall paint",
    "home painting",
    "interior painting",
    "exterior painting",
  ],
  mechanic: [
    "mechanic",
    "repair",
    "automobile",
    "garage",
    "vehicle repair",
  ],
  "two-wheeler": [
    "bike",
    "bike repair",
    "bike service",
    "motorcycle",
    "scooter",
    "scooty",
    "activa",
    "pulsar",
    "two wheeler",
  ],
  "four-wheeler": [
    "car",
    "car repair",
    "car service",
    "automobile",
    "four wheeler",
    "car mechanic",
  ],
  "bike wash": [
    "bike wash",
    "scooter wash",
    "bike cleaning",
    "bike detailing",
  ],
  "car wash": [
    "car wash",
    "car cleaning",
    "car detailing",
    "car spa",
    "car polish",
  ],
  photography: [
    "photography",
    "photographer",
    "photoshoot",
    "photo shoot",
    "videographer",
    "video shoot",
    "wedding photography",
  ],
  purohit: [
    "purohit",
    "pandit",
    "priest",
    "pooja",
    "puja",
    "havan",
    "homam",
    "griha pravesh",
  ],
  decor: [
    "decor",
    "decoration",
    "balloon",
    "stage decoration",
    "party decorator",
    "wedding decor",
  ],
  mehandi: [
    "mehandi",
    "mehndi",
    "mehendi",
    "henna",
  ],
  makeup: [
    "makeup",
    "make up",
    "bridal makeup",
    "makeup artist",
    "beauty artist",
  ],
  "beauty salon spa": [
    "salon",
    "parlor",
    "parlour",
    "beauty",
    "haircut",
    "facial",
    "spa",
    "nail",
    "grooming",
    "massage",
    "waxing",
    "threading",
    "pedicure",
    "manicure",
  ],
  doctors: [
    "doctor",
    "doctr",
    "medical",
    "consultation",
    "physician",
    "clinic",
    "hospital",
    "medicine",
    "health",
    "checkup",
    "fever",
    "cough",
    "cold",
    "headache",
  ],
};

const getNormalizedServiceQuery = (query = "") => {
  const q = normalize(query);
  if (!q) return "";
  for (const [service, keywords] of Object.entries(SERVICE_ALIASES)) {
    if (keywords.some((keyword) => q.includes(keyword))) {
      return service;
    }
  }
  return q;
};

const workerMatchesService = (worker, serviceQuery) => {
  if (!serviceQuery) return true;
  const normalizedQuery = getNormalizedServiceQuery(serviceQuery);
  const workerService = normalize(worker?.service);
  if (!workerService) return false;
  if (workerService.includes(normalizedQuery) || normalizedQuery.includes(workerService)) {
    return true;
  }
  const aliases = SERVICE_ALIASES[normalizedQuery] || [];
  return aliases.some((alias) => workerService.includes(normalize(alias)));
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

function Home() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem("userRole") || "user";
  const userName = sessionStorage.getItem("userName") || "";
  // Email of the logged-in user's worker profile (to filter self from listings)
  const myWorkerEmail = sessionStorage.getItem("workerSession_email") || "";

  /* =======================================================
     AUTH
  ======================================================= */
  const [isGoogleAuthProcessing, setIsGoogleAuthProcessing] = useState(() =>
    typeof window !== "undefined" ? window.location.hash.includes("access_token") : false
  );

  /* =======================================================
     SEARCH / LOCATION
  ======================================================= */
  const [locationText, setLocationText] = useState("");
  const [searchedLocation, setSearchedLocation] = useState(
    () => localStorage.getItem("userLocation") || DEFAULT_LOCATION
  );
  const [userCoords, setUserCoords] = useState(getStoredCoords);
  const [userCity, setUserCity] = useState(() => localStorage.getItem("userCity") || "");
  const [serviceQuery, setServiceQuery] = useState("");

  /* =======================================================
     DATA
  ======================================================= */
  const [plans, setPlans] = useState([]);
  const [offers, setOffers] = useState([]);
  const [onlineWorkers, setOnlineWorkers] = useState([]);
  const [aiSuggestedWorkers, setAiSuggestedWorkers] = useState([]);
  const [aiSuggestedAreas, setAiSuggestedAreas] = useState([]);

  /* =======================================================
     LOADING
  ======================================================= */
  const [isOnlineLoading, setIsOnlineLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isBannerLoading, setIsBannerLoading] = useState(false);

  /* =======================================================
     UI
  ======================================================= */
  const [activeTab, setActiveTab] = useState("categories");
  const [aiBannerText, setAiBannerText] = useState("");
  const [aiBannerExpertsTitle, setAiBannerExpertsTitle] = useState("");
  const [aiBannerBonusText, setAiBannerBonusText] = useState("");

  /* =======================================================
     GOOGLE AUTH CALLBACK
  ======================================================= */
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const flow = sessionStorage.getItem("google_auth_flow");
      const targetRoute = flow === "signup" ? `/signup${hash}` : `/login${hash}`;
      navigate(targetRoute, { replace: true });
      return;
    }
    setIsGoogleAuthProcessing(false);
  }, [navigate]);

  /* =======================================================
     AUTH SAFETY TIMEOUT
  ======================================================= */
  useEffect(() => {
    if (!isGoogleAuthProcessing) return;
    const timer = setTimeout(() => {
      setIsGoogleAuthProcessing(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isGoogleAuthProcessing]);

  /* =======================================================
     ROLE REDIRECT
  ======================================================= */
  useEffect(() => {
    if (role === "admin") {
      navigate("/admin-dashboard", { replace: true });
      return;
    }
    // Only redirect pure worker accounts (not dual-role users who kept role="user")
    const isWorker = sessionStorage.getItem("isWorker") === "true";
    if (role === "worker" && !isWorker) {
      navigate("/worker-dashboard", { replace: true });
    }
  }, [role, navigate]);

  /* =======================================================
     REGISTERED LOCATION
  ======================================================= */
  useEffect(() => {
    if (role !== "user") return;
    let cancelled = false;

    const resolveRegisteredLocation = async () => {
      const savedLat = localStorage.getItem("userCoordsLat");
      const savedLng = localStorage.getItem("userCoordsLng");
      const savedLoc = localStorage.getItem("userLocation");
      const registeredCity = sessionStorage.getItem("userCity") || localStorage.getItem("userCity");
      const isManualLocation = localStorage.getItem("manualLocationSet") === "true";

      if (isManualLocation && savedLoc && savedLat && savedLng) {
        if (!cancelled) {
          setSearchedLocation(savedLoc);
          setUserCoords({
            lat: parseFloat(savedLat),
            lng: parseFloat(savedLng),
          });
          if (registeredCity) {
            setUserCity(registeredCity);
          }
        }
        return;
      }

      if (savedLoc && savedLat && savedLng && (!registeredCity || normalize(savedLoc).includes(normalize(registeredCity)))) {
        if (!cancelled) {
          setSearchedLocation(savedLoc);
          setUserCoords({
            lat: parseFloat(savedLat),
            lng: parseFloat(savedLng),
          });
          if (registeredCity) {
            setUserCity(registeredCity);
          }
        }
        return;
      }

      const targetCity = registeredCity || "Kadapa";
      try {
        const response = await fetch(`/api/workers/geocode?q=${encodeURIComponent(targetCity)}`);
        if (!response.ok) throw new Error(`Geocode failed: ${response.status}`);
        const data = await response.json();
        const lat = parseFloat(data?.lat);
        const lng = parseFloat(data?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          throw new Error("Invalid geocoding coordinates");
        }
        const finalLabel = data?.label || targetCity;
        if (cancelled) return;

        localStorage.setItem("userLocation", finalLabel);
        localStorage.setItem("userCity", targetCity);
        localStorage.setItem("userCoordsLat", String(lat));
        localStorage.setItem("userCoordsLng", String(lng));
        setSearchedLocation(finalLabel);
        setUserCoords({ lat, lng });
        setUserCity(targetCity);
      } catch (error) {
        console.error("Profile location geocoding failed:", error);
        if (!cancelled) {
          localStorage.setItem("userLocation", targetCity);
          localStorage.setItem("userCity", targetCity);
          setSearchedLocation(targetCity);
          setUserCity(targetCity);
        }
      }
    };

    resolveRegisteredLocation();
    return () => {
      cancelled = true;
    };
  }, [role]);

  /* =======================================================
     VOICE / AI DEEP LINK
  ======================================================= */
  useEffect(() => {
    const savedQuery = localStorage.getItem("voice_query");
    if (!savedQuery) return;
    setServiceQuery(savedQuery);
    setLocationText(savedQuery);
    localStorage.removeItem("voice_query");
  }, []);

  /* =======================================================
     LOCATION STORAGE
  ======================================================= */
  useEffect(() => {
    if (!searchedLocation) {
      setAiSuggestedWorkers([]);
      setOnlineWorkers([]);
      return;
    }
    localStorage.setItem("userLocation", searchedLocation);
    let city = userCity;
    if (!city) {
      const parts = searchedLocation.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length > 0) city = parts[0];
    }
    if (city) {
      localStorage.setItem("userCity", city);
      setUserCity(city);
    }
  }, [searchedLocation, userCity]);

  /* =======================================================
     AI SUGGESTED AREAS
  ======================================================= */
  useEffect(() => {
    if (!searchedLocation) {
      setAiSuggestedAreas([]);
      return;
    }
    let cancelled = false;
    const fetchSuggestedAreas = async () => {
      setIsAiLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `You are a geolocation assistant. The user is at "${searchedLocation}". List exactly 3 nearby famous local areas or neighborhoods. Reply ONLY with a comma-separated list.`,
              },
            ],
          }),
        });

        if (!response.ok) throw new Error(`AI location request failed: ${response.status}`);
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== "string") throw new Error("Invalid AI location response");

        const areas = content
          .split(",")
          .map((area) => area.replace(/^[\d.\-\s]+/, "").trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 3);

        if (!cancelled) {
          setAiSuggestedAreas(areas);
        }
      } catch (error) {
        console.error("AI area suggestion failed:", error);
        if (!cancelled) {
          setAiSuggestedAreas([]);
        }
      } finally {
        if (!cancelled) {
          setIsAiLoading(false);
        }
      }
    };

    fetchSuggestedAreas();
    return () => {
      cancelled = true;
    };
  }, [searchedLocation]);

  /* =======================================================
     LOAD WORKERS
  ======================================================= */
  useEffect(() => {
    if (!searchedLocation || !userCoords) {
      setOnlineWorkers([]);
      setAiSuggestedWorkers([]);
      setIsOnlineLoading(false);
      return;
    }
    let cancelled = false;
    const loadWorkers = async () => {
      setIsOnlineLoading(true);
      try {
        const city = localStorage.getItem("userCity") || getShortLocation(searchedLocation);
        const workers = await filterWorkersClientSide(userCoords, normalize(city));
        if (cancelled) return;

        const safeWorkers = Array.isArray(workers) ? workers.filter(Boolean) : [];
        // Self-booking prevention: hide the logged-in user's own worker card
        const filtered = myWorkerEmail
          ? safeWorkers.filter(w => (w.email || "").toLowerCase() !== myWorkerEmail.toLowerCase())
          : safeWorkers;
        setOnlineWorkers(filtered);

        if (aiSuggestedAreas.length === 0) {
          setAiSuggestedWorkers(filtered.slice(0, 5));
          return;
        }

        const suggested = filtered.filter((worker) => {
          const workerLocation = normalize(worker?.location);
          const workerCity = normalize(worker?.city);
          return aiSuggestedAreas.some(
            (area) =>
              workerLocation.includes(area) ||
              workerCity.includes(area) ||
              area.includes(workerLocation) ||
              area.includes(workerCity)
          );
        });

        setAiSuggestedWorkers((suggested.length > 0 ? suggested : filtered).slice(0, 5));
      } catch (error) {
        if (!cancelled) {
          console.error("Worker loading failed:", error);
          setOnlineWorkers([]);
          setAiSuggestedWorkers([]);
        }
      } finally {
        if (!cancelled) {
          setIsOnlineLoading(false);
        }
      }
    };

    loadWorkers();
    return () => {
      cancelled = true;
    };
  }, [searchedLocation, userCoords, aiSuggestedAreas]);

  /* =======================================================
     PLANS + OFFERS
  ======================================================= */
  useEffect(() => {
    let cancelled = false;
    const loadPlansAndOffers = async () => {
      try {
        const [plansResponse, offersResponse] = await Promise.all([
          fetch("/api/plans"),
          fetch("/api/offers"),
        ]);
        if (!cancelled && plansResponse.ok) {
          const data = await plansResponse.json();
          setPlans(Array.isArray(data) ? data : []);
        }
        if (!cancelled && offersResponse.ok) {
          const data = await offersResponse.json();
          setOffers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load plans/offers:", error);
      }
    };

    loadPlansAndOffers();
    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     CURRENT DATE
  ======================================================= */
  const today = new Date().toISOString().split("T")[0];

  /* =======================================================
     LOCATION-SPECIFIC PLANS
  ======================================================= */
  const isAvailableInCity = useCallback(
    (item) => {
      if (!item) return false;
      if (item.endDate && item.endDate < today) return false;
      const configuredCity = normalize(item.city);
      if (!configuredCity || configuredCity === "all") return true;
      if (!userCity) return false;
      const targetCities = configuredCity.split(",").map((c) => c.trim()).filter(Boolean);
      const currentCity = normalize(userCity);
      return targetCities.some((c) => currentCity.includes(c) || c.includes(currentCity));
    },
    [today, userCity]
  );

  const availableOffers = useMemo(() => offers.filter(isAvailableInCity), [offers, isAvailableInCity]);
  const availablePlans = useMemo(() => plans.filter(isAvailableInCity), [plans, isAvailableInCity]);
  const availableOffersCount = availableOffers.length;
  const availablePlansCount = availablePlans.length;

  /* =======================================================
     AI BANNER
  ======================================================= */
  useEffect(() => {
    if (isAiLoading || isOnlineLoading || !searchedLocation) return;
    let cancelled = false;
    const name = sessionStorage.getItem("userName") || "there";
    const shortLocation = getShortLocation(searchedLocation);
    const cacheKey = `aiBanner_${shortLocation}_${name}_${aiSuggestedWorkers.length}_${availablePlansCount}_${availableOffersCount}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const parsed = safeJsonParse(cached);
      if (parsed?.ts && Date.now() - parsed.ts < 30 * 60 * 1000) {
        setAiBannerText(parsed.bannerText || "");
        setAiBannerExpertsTitle(parsed.expertsTitle || "");
        setAiBannerBonusText(parsed.bonusText || "");
        return;
      }
    }

    const generateBanner = async () => {
      setIsBannerLoading(true);
      try {
        const workerNames = aiSuggestedWorkers
          .slice(0, 3)
          .map((w) => w?.name)
          .filter(Boolean)
          .join(", ");

        const workerServices = [
          ...new Set(aiSuggestedWorkers.map((w) => w?.service).filter(Boolean)),
        ].join(", ");

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `You are Zy, the Workzy AI assistant.
Generate a short personalized home-page banner.
User name: "${name}"
Location: "${shortLocation}"
Nearby experts: ${aiSuggestedWorkers.length}
Worker names: ${workerNames || "none"}
Worker services: ${workerServices || "various"}
Available plans: ${availablePlansCount}
Available offers: ${availableOffersCount}

Return ONLY valid JSON:
{
  "bannerText": "...",
  "expertsTitle": "...",
  "bonusText": "..."
}

bannerText must be 1-2 short sentences.
expertsTitle must be maximum 6 words.
bonusText must be one short sentence.
Do not use markdown.`,
              },
            ],
          }),
        });

        if (!response.ok) throw new Error(`Banner API failed: ${response.status}`);
        const data = await response.json();
        const raw = data?.choices?.[0]?.message?.content;
        if (typeof raw !== "string") throw new Error("Invalid banner response");

        const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace === -1 || lastBrace === -1) throw new Error("Banner JSON not found");

        const parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        const result = {
          bannerText: parsed.bannerText || `Hey ${name}! 🎯 We found ${aiSuggestedWorkers.length} experts near ${shortLocation}.`,
          expertsTitle: parsed.expertsTitle || "🔥 Top Picks Near You",
          bonusText: parsed.bonusText || `🎁 ${availablePlansCount} plans and ${availableOffersCount} offers are available in your area.`,
        };

        if (cancelled) return;
        setAiBannerText(result.bannerText);
        setAiBannerExpertsTitle(result.expertsTitle);
        setAiBannerBonusText(result.bonusText);

        localStorage.setItem(cacheKey, JSON.stringify({ ...result, ts: Date.now() }));
      } catch (error) {
        console.error("AI banner generation failed:", error);
        if (!cancelled) {
          setAiBannerText(`Hey ${name}! 🎯 We found ${aiSuggestedWorkers.length} experts near ${shortLocation}.`);
          setAiBannerExpertsTitle("🔥 Top Picks Near You");
          setAiBannerBonusText(`🎁 ${availablePlansCount} plans and ${availableOffersCount} offers are available in your area.`);
        }
      } finally {
        if (!cancelled) {
          setIsBannerLoading(false);
        }
      }
    };

    generateBanner();
    return () => {
      cancelled = true;
    };
  }, [isAiLoading, isOnlineLoading, searchedLocation, aiSuggestedWorkers, availablePlansCount, availableOffersCount]);

  /* =======================================================
     FILTERED EMERGENCY WORKERS
  ======================================================= */
  const emergencyWorkers = useMemo(() => {
    if (!serviceQuery) return onlineWorkers;
    return onlineWorkers.filter((w) => workerMatchesService(w, serviceQuery));
  }, [onlineWorkers, serviceQuery]);

  /* =======================================================
     WORKER CARD
  ======================================================= */
  const WorkerCard = ({ worker, compact = false }) => {
    const isDoctor = normalize(worker?.service).includes("doctor");
    const workerId = worker?._id || worker?.id || worker?.name;
    const openWorker = () => {
      localStorage.setItem("selected_worker", JSON.stringify(worker));
      navigate("/worker");
    };

    return (
      <div
        key={workerId}
        className="premium-card worker-card"
        onClick={openWorker}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openWorker();
          }
        }}
        style={{
          minWidth: compact ? "220px" : "250px",
          padding: compact ? "16px" : "20px",
          cursor: "pointer",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: compact ? "12px" : "15px",
            right: compact ? "12px" : "15px",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary-dark)",
            padding: compact ? "3px 6px" : "4px 8px",
            borderRadius: "12px",
            fontSize: compact ? "9.5px" : "10px",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <FaCircle size={compact ? 6 : 8} style={{ color: "var(--success)" }} />
          ONLINE
        </span>

        <div style={{ marginBottom: compact ? "10px" : "12px" }}>
          {isDoctor ? (
            <FaStethoscope size={compact ? 24 : 32} style={{ color: "var(--primary)" }} />
          ) : (
            <FaUser size={compact ? 24 : 32} style={{ color: "var(--primary)" }} />
          )}
        </div>

        <h3 style={{ margin: compact ? "0 0 2px 0" : "0 0 4px 0", fontSize: compact ? "16px" : "18px", fontWeight: "bold", color: "var(--text-primary)" }}>
          {worker?.name || "Service Professional"}
        </h3>
        <p style={{ margin: compact ? "0 0 6px 0" : "0 0 8px 0", fontSize: compact ? "12px" : "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
          {worker?.service || "Professional Service"}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: compact ? "12px" : "16px", borderTop: "1px solid var(--border-color)", paddingTop: compact ? "8px" : "12px", gap: "8px" }}>
          <span style={{ fontSize: compact ? "11px" : "12px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            📍 {truncateLocation(worker?.city || worker?.location)}
          </span>
          <span className="price-badge" style={{ fontSize: compact ? "11px" : undefined, padding: compact ? "2px 6px" : undefined, flexShrink: 0 }}>
            ₹{worker?.price || 399}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* ===================================================
          HERO
      =================================================== */}
      <div
        className="hero-welcome-banner"
        style={{
          background: "var(--hero-bg)",
          borderBottom: "1.5px solid var(--hero-border)",
          color: "var(--hero-text)",
          padding: "6px 14px 7px",
          textAlign: "center",
          boxShadow: "0 4px 14px -4px rgba(223, 180, 83, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          className="hero-cloud-bg"
          viewBox="0 0 24 24"
          style={{
            position: "absolute",
            left: "4%",
            bottom: "8%",
            width: "45px",
            height: "45px",
            opacity: 0.2,
            fill: "white",
            pointerEvents: "none",
            animation: "homeDrift 25s linear infinite",
          }}
        >
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
        <svg
          className="hero-cloud-bg"
          viewBox="0 0 24 24"
          style={{
            position: "absolute",
            right: "5%",
            top: "8%",
            width: "50px",
            height: "50px",
            opacity: 0.18,
            fill: "white",
            pointerEvents: "none",
            animation: "homeDriftReverse 30s linear infinite",
          }}
        >
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>

        <style>
          {`
            @keyframes homeDrift {
              0% { transform: translateX(0) translateY(0); }
              50% { transform: translateX(15px) translateY(-5px); }
              100% { transform: translateX(0) translateY(0); }
            }
            @keyframes homeDriftReverse {
              0% { transform: translateX(0) translateY(0); }
              50% { transform: translateX(-20px) translateY(5px); }
              100% { transform: translateX(0) translateY(0); }
            }
            @media (max-width: 768px) {
              .recommendations-feed-card {
                margin: 6px 8px 16px 8px !important;
                padding: 14px 12px !important;
                border-radius: 18px !important;
                gap: 18px !important;
              }
              .recommendations-feed-card h2 {
                font-size: 16px !important;
              }
              .recommendations-feed-card p {
                font-size: 12px !important;
                margin-bottom: 10px !important;
              }
              .recommendations-feed-card h3 {
                font-size: 14px !important;
              }
              .horizontal-scroll-container {
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
              }
              .horizontal-scroll-container::-webkit-scrollbar {
                display: none;
              }
            }
          `}
        </style>

        <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--hero-text)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", letterSpacing: "-0.2px" }}>
          Find the Best Services Near You
          <svg
            className="hero-location-pin"
            width="18"
            height="23"
            viewBox="0 0 100 130"
            style={{
              display: "inline-block",
              verticalAlign: "middle",
              flexShrink: 0,
              filter: "drop-shadow(0 2px 5px rgba(220, 38, 38, 0.45))",
            }}
          >
            {/* Left bright red side */}
            <path d="M 50 125 C 45 110, 10 70, 10 45 A 40 40 0 0 1 50 5 L 50 125 Z" fill="#EF233C" />
            {/* Right dark red shaded side */}
            <path d="M 50 5 A 40 40 0 0 1 90 45 C 90 70, 55 110, 50 125 L 50 5 Z" fill="#B70921" />
            {/* Left inner circle bevel */}
            <path d="M 50 25 A 20 20 0 0 0 30 45 A 20 20 0 0 0 50 65 L 50 25 Z" fill="#900C19" />
            {/* Right inner circle bevel */}
            <path d="M 50 65 A 20 20 0 0 0 70 45 A 20 20 0 0 0 50 25 L 50 65 Z" fill="#64050A" />
            {/* Center cutout hole */}
            <circle cx="50" cy="45" r="17" fill="#FFFFFF" />
          </svg>
        </h1>
      </div>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}
      <div style={{ flex: 1, width: "100%", margin: "0 auto", padding: 0, boxSizing: "border-box" }}>
        <div style={{ position: "relative", zIndex: 100 }}>
          <AISmartSearchHub
            value={locationText}
            onChange={setLocationText}
            onSearch={(query) => setServiceQuery(query)}
            detectedLocation={searchedLocation}
            onLocationUpdate={(location) => {
              if (!location) return;
              localStorage.setItem("manualLocationSet", "true");
              setSearchedLocation(location);
            }}
            onCoordsChange={(coords) => {
              if (!coords || !Number.isFinite(Number(coords.lat)) || !Number.isFinite(Number(coords.lng))) return;
              const nextCoords = { lat: Number(coords.lat), lng: Number(coords.lng) };
              localStorage.setItem("userCoordsLat", String(nextCoords.lat));
              localStorage.setItem("userCoordsLng", String(nextCoords.lng));
              setUserCoords(nextCoords);
            }}
            aiBannerText={aiBannerText}
            aiBannerExpertsTitle={aiBannerExpertsTitle}
            aiBannerBonusText={aiBannerBonusText}
            isAiLoading={isBannerLoading || isAiLoading}
            aiSuggestedWorkers={aiSuggestedWorkers}
            availableOffersCount={availableOffersCount}
            availablePlansCount={availablePlansCount}
            userName={userName}
            onlineWorkers={onlineWorkers}
          />
        </div>

        {/* Service Categories */}
        <div className="fade-in" style={{ padding: "0" }}>
          <NearbyWorkers searchedLocation={searchedLocation} userCoords={userCoords} excludeEmail={myWorkerEmail} />
        </div>

        {/* Consolidated Recommendations Feed */}
        <div
          className="recommendations-feed-card fade-in"
          style={{
            margin: "0 20px 20px 20px",
            padding: "24px 28px",
            background: "var(--bg-card)",
            border: "1.5px solid var(--border-color)",
            borderRadius: "24px",
            boxShadow: "var(--shadow-3d)",
            backdropFilter: "var(--blur)",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}
        >
          {/* Emergency Dispatch Row */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <FaBolt style={{ color: "var(--warning)" }} /> Quick Emergency Help
              </h2>
              <span style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="pulse-dot" style={{ width: "6px", height: "6px", backgroundColor: "var(--danger)", borderRadius: "50%", display: "inline-block" }} />
                10-20 MINS ARRIVAL
              </span>
            </div>
            <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "var(--text-secondary)" }}>
              Available professionals ready to help you right now.
            </p>

            {isOnlineLoading ? (
              <div className="horizontal-scroll-container custom-scrollbar" style={{ display: "flex", overflowX: "auto", gap: "16px", paddingBottom: "10px" }}>
                <SkeletonLoader type="card" count={4} />
              </div>
            ) : emergencyWorkers.length === 0 ? (
              <div className="premium-card" style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)", backgroundColor: "rgba(0,0,0,0.02)" }}>
                <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "bold" }}>No emergency professionals are online right now.</p>
              </div>
            ) : (
              <div className="horizontal-scroll-container custom-scrollbar" style={{ display: "flex", overflowX: "auto", gap: "16px", paddingBottom: "10px" }}>
                {emergencyWorkers.map((worker) => (
                  <WorkerCard key={worker._id || worker.id} worker={worker} compact={true} />
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", opacity: 0.4 }} />

          {/* Curated Collections Row */}
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <FaStar style={{ color: "var(--warning)" }} /> Top Recommended
            </h2>
            <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "var(--text-secondary)" }}>
              The best local experts with great reviews and affordable prices.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 10px 0" }}>
                  🏆 Top Rated Near You
                </h3>
                <TopWorkers flat={true} searchedLocation={searchedLocation} userCoords={userCoords} excludeEmail={myWorkerEmail} />
              </div>
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "18px", marginTop: "6px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 10px 0" }}>
                  💸 Best Value Picks
                </h3>
                <CheapWorkers flat={true} searchedLocation={searchedLocation} userCoords={userCoords} excludeEmail={myWorkerEmail} />
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", opacity: 0.4 }} />

          {/* Memberships & Deals Row */}
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <FaPercent style={{ color: "#34d399" }} /> Offers & Plans
            </h2>
            <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "var(--text-secondary)" }}>
              Save money with our monthly plans or use a promo code below.
            </p>

            {availablePlans.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                {availablePlans.slice(0, 3).map((plan, idx) => {
                  const features = Array.isArray(plan?.features) ? plan.features : [];
                  const price = String(plan?.price || "").replace("₹", "");
                  return (
                    <div key={idx} className="premium-card" style={{ padding: "20px", border: plan.popular ? "2px solid #eab308" : "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between", transform: plan.popular ? "scale(1.02)" : "none", boxShadow: plan.popular ? "0 10px 25px rgba(234, 179, 8, 0.15)" : "var(--shadow-3d)" }}>
                      <div>
                        {plan.popular && (
                          <span style={{ backgroundColor: "var(--warning)", color: "#000000", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "2px", marginBottom: "10px" }}>
                            POPULAR <FaStar size={8} />
                          </span>
                        )}
                        <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", color: plan.popular ? "#eab308" : "var(--text-main)", fontWeight: 700 }}>{plan.title}</h4>
                        <p style={{ margin: "0 0 10px 0", fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>
                          ₹{price}
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>/{plan.period}</span>
                        </p>
                        <ul style={{ paddingLeft: "16px", margin: "0 0 16px 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                          {features.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                      <Link to="/plans-offers" style={{ textDecoration: "none" }}>
                        <button className="btn-secondary" style={{ width: "100%", padding: "10px", fontSize: "12.5px", borderRadius: "8px", cursor: "pointer" }}>
                          View Plan Details →
                        </button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="premium-card" style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", backgroundColor: "rgba(0,0,0,0.02)" }}>
                <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "bold" }}>No seasonal plans active in your area.</p>
              </div>
            )}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="fade-in" style={{
          margin: "10px 20px 30px 20px",
          padding: "32px",
          background: "var(--bg-card)",
          borderRadius: "24px",
          border: "1.5px solid var(--border-color)",
          boxShadow: "var(--shadow-3d)",
        }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", textAlign: "center", marginBottom: "24px" }}>
            How Workzy Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "12px", background: "var(--primary-light)", width: "56px", height: "56px", lineHeight: "56px", borderRadius: "50%", margin: "0 auto 12px", color: "var(--primary-dark)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <FaMapMarkerAlt />
              </div>
              <h4 style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>1. Search Services</h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Find trusted professionals near your exact location.</p>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "12px", background: "var(--warning)", width: "56px", height: "56px", lineHeight: "56px", borderRadius: "50%", margin: "0 auto 12px", color: "#000", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <FaUser />
              </div>
              <h4 style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>2. Compare & Book</h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Review profiles, ratings, and prices before booking instantly.</p>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "12px", background: "var(--success-light)", width: "56px", height: "56px", lineHeight: "56px", borderRadius: "50%", margin: "0 auto 12px", color: "var(--success)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <FaStar />
              </div>
              <h4 style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>3. Get It Done</h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Professionals arrive on time and get the job done right.</p>
            </div>
          </div>
        </div>

        {/* Call to Action Banner */}
        <div className="fade-in" style={{
          margin: "0 20px 40px 20px",
          padding: "36px",
          background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
          borderRadius: "24px",
          color: "#fff",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
        }}>
          <div style={{ flex: "1 1 300px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 10px 0", color: "#fff" }}>Are you a Service Professional?</h2>
            <p style={{ fontSize: "15px", margin: 0, opacity: 0.9, fontWeight: 500, color: "#fff" }}>Join Workzy today to get more customers, manage your bookings, and grow your business.</p>
          </div>
          <Link to="/signup" style={{ textDecoration: "none" }}>
            <button style={{
              background: "#fff",
              color: "var(--primary-dark)",
              border: "none",
              padding: "14px 28px",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Join as Professional
            </button>
          </Link>
        </div>

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
          textAlign: "center",
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
          padding: "32px 24px",
          color: "var(--text-main)",
          fontSize: "15px",
          backgroundColor: "var(--bg-card)",
          borderTop: "1.5px solid var(--border-color)",
          marginTop: "40px",
          fontWeight: 600,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.03)"
        }}
      >
        © 2026 Workzy Inc. All rights reserved. Made with ❤️ by PS-152 Team.
      </footer>
    </div>
  );
}

export default Home;