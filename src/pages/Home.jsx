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
    if (role === "worker") {
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
        setOnlineWorkers(safeWorkers);

        if (aiSuggestedAreas.length === 0) {
          setAiSuggestedWorkers(safeWorkers.slice(0, 5));
          return;
        }

        const suggested = safeWorkers.filter((worker) => {
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

        setAiSuggestedWorkers((suggested.length > 0 ? suggested : safeWorkers).slice(0, 5));
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
          borderBottom: "2px solid var(--hero-border)",
          color: "var(--hero-text)",
          padding: "12px 16px 14px",
          textAlign: "center",
          boxShadow: "0 8px 24px -6px rgba(223, 180, 83, 0.4)",
          position: "relative",
          overflow: "hidden",
        }}
      >
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
            animation: "homeDrift 25s linear infinite",
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
          `}
        </style>

        <h1 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: 900, color: "var(--hero-text)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", letterSpacing: "-0.3px" }}>
          Find Reliable Service Experts Near You <FaMapMarkerAlt size={20} style={{ color: "#dc2626" }} />
        </h1>
        <p style={{ margin: 0, fontSize: "13.5px", color: "var(--hero-subtext)", fontWeight: 700, maxWidth: "650px", marginLeft: "auto", marginRight: "auto" }}>
          Auto-matching, verified professional workers, and instant secure bookings.
        </p>
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
          />
        </div>

        {/* Unified Services Workspace Card */}
        <div
          className="services-workspace-card fade-in"
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
            gap: "20px",
          }}
        >
          {/* Custom Modern Tab Bar */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--border-color)",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style>
              {`
                .workspace-tab-btn {
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  padding: 10px 20px;
                  border: 1px solid var(--border-color);
                  border-radius: 14px;
                  font-size: 13.5px;
                  font-weight: 700;
                  cursor: pointer;
                  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                  background-color: var(--bg-card-hover);
                  color: var(--text-secondary);
                  box-shadow: none;
                }
                .workspace-tab-btn:hover {
                  transform: translateY(-1px);
                  background-color: var(--primary-light);
                  color: var(--primary-dark);
                  border-color: var(--primary);
                }
                .workspace-tab-btn.active {
                  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
                  color: #ffffff;
                  border-color: var(--primary);
                  box-shadow: 0 4px 12px var(--primary-glow);
                  border-bottom: 4px solid var(--primary-dark);
                }
                .workspace-tab-btn.active:hover {
                  transform: none;
                  color: #ffffff;
                }
              `}
            </style>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === "categories" ? "active" : ""}`}
              onClick={() => setActiveTab("categories")}
            >
              <FaTools size={14} /> Service Categories
            </button>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === "emergency" ? "active" : ""}`}
              onClick={() => setActiveTab("emergency")}
            >
              <FaBolt size={14} /> Emergency Dispatch
            </button>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === "collections" ? "active" : ""}`}
              onClick={() => setActiveTab("collections")}
            >
              <FaStar size={14} /> Curated Collections
            </button>

            <button
              type="button"
              className={`workspace-tab-btn ${activeTab === "benefits" ? "active" : ""}`}
              onClick={() => setActiveTab("benefits")}
            >
              <FaPercent size={14} /> Memberships & Deals
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className="workspace-tab-panel" style={{ minHeight: "300px" }}>
            {activeTab === "categories" && (
              <div className="fade-in" style={{ border: "none", padding: 0 }}>
                <NearbyWorkers searchedLocation={searchedLocation} userCoords={userCoords} />
              </div>
            )}

            {activeTab === "emergency" && (
              <div className="fade-in" style={{ padding: "8px 0px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaBolt style={{ color: "var(--warning)" }} /> Instant Booking Services
                  </h2>
                  <span style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    <span className="pulse-dot" style={{ width: "6px", height: "6px", backgroundColor: "var(--danger)", borderRadius: "50%", display: "inline-block" }} />
                    10-20 MINS ARRIVAL
                  </span>
                </div>
                <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
                  The following certified professionals are online, active, and dispatched instantly for emergency assistance.
                </p>

                {isOnlineLoading ? (
                  <div className="horizontal-scroll-container custom-scrollbar" style={{ display: "flex", overflowX: "auto", gap: "16px", paddingBottom: "10px" }}>
                    <SkeletonLoader type="card" count={4} />
                  </div>
                ) : emergencyWorkers.length === 0 ? (
                  <div className="premium-card" style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <span style={{ fontSize: "28px", display: "block", marginBottom: "8px", filter: "grayscale(1)" }}>💤</span>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>No emergency professionals are online right now.</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>You can still reserve any provider using standard time slots in Service Categories!</p>
                  </div>
                ) : (
                  <div className="horizontal-scroll-container custom-scrollbar" style={{ display: "flex", overflowX: "auto", gap: "16px", paddingBottom: "10px" }}>
                    {emergencyWorkers.map((worker) => (
                      <WorkerCard key={worker._id || worker.id} worker={worker} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "collections" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                    🏆 Top Rated Professionals
                  </h3>
                  <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                    Highly recommended, certified experts boasting the highest feedback scores in your location.
                  </p>
                  <TopWorkers searchedLocation={searchedLocation} userCoords={userCoords} />
                </div>
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px", marginTop: "10px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                    💸 Budget-Friendly Workers
                  </h3>
                  <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                    Value-oriented professional helpers operating at competitive flat rates.
                  </p>
                  <CheapWorkers searchedLocation={searchedLocation} userCoords={userCoords} />
                </div>
              </div>
            )}

            {activeTab === "benefits" && (
              <div className="fade-in">
                {availablePlans.length > 0 ? (
                  <div>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaPercent style={{ color: "#34d399" }} /> Service Plans & Seasonal Offers
                    </h2>
                    <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
                      Save big on recurring home maintenance with our service plans, or copy a promo code below.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                      {availablePlans.map((plan, idx) => {
                        const features = Array.isArray(plan?.features) ? plan.features : [];
                        const price = String(plan?.price || "").replace("₹", "");
                        return (
                          <div key={idx} className="premium-card" style={{ padding: "20px", border: plan.popular ? "2px solid #eab308" : "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyComponnet: "space-between", transform: plan.popular ? "scale(1.02)" : "none", boxShadow: plan.popular ? "0 10px 25px rgba(234, 179, 8, 0.15)" : "var(--shadow-3d)" }}>
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
                  </div>
                ) : (
                  <div className="premium-card" style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <span style={{ fontSize: "28px", display: "block", marginBottom: "8px", filter: "grayscale(1)" }}>🎁</span>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>No seasonal plans active in your area.</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>Check back soon for upcoming holiday promotions and subscriptions!</p>
                  </div>
                )}
              </div>
            )}
          </div>
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
                <FaBolt style={{ color: "var(--warning)" }} /> Emergency Dispatch
              </h2>
              <span style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="pulse-dot" style={{ width: "6px", height: "6px", backgroundColor: "var(--danger)", borderRadius: "50%", display: "inline-block" }} />
                10-20 MINS ARRIVAL
              </span>
            </div>
            <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "var(--text-secondary)" }}>
              Certified professionals active right now for emergency callouts.
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
              <FaStar style={{ color: "var(--warning)" }} /> Curated Collections
            </h2>
            <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "var(--text-secondary)" }}>
              Hand-picked local experts selected for high performance and best rates.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 10px 0" }}>
                  🏆 Top Rated Near You
                </h3>
                <TopWorkers flat={true} searchedLocation={searchedLocation} userCoords={userCoords} />
              </div>
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "18px", marginTop: "6px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 10px 0" }}>
                  💸 Best Value Picks
                </h3>
                <CheapWorkers flat={true} searchedLocation={searchedLocation} userCoords={userCoords} />
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", opacity: 0.4 }} />

          {/* Memberships & Deals Row */}
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <FaPercent style={{ color: "#34d399" }} /> Memberships & Deals
            </h2>
            <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "var(--text-secondary)" }}>
              Save big on recurring home maintenance with our service plans, or copy a promo code below.
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
          padding: "24px",
          color: "var(--text-secondary)",
          fontSize: "14px",
          backgroundColor: "var(--bg-card)",
          borderTop: "1px solid var(--border-color)",
          marginTop: "40px",
          fontWeight: 500,
        }}
      >
        © 2026 Workzy Inc. All rights reserved. Made with ❤️ by PS-152 Team.
      </footer>
    </div>
  );
}

export default Home;