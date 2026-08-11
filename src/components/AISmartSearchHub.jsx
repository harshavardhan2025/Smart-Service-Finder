import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { FaMicrophone, FaMap } from "react-icons/fa";
import MapPicker from "./MapPicker";
import SkeletonLoader from "./SkeletonLoader";

const SERVICE_SUGGESTIONS = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Doctor",
  "AC Repair",
  "House Cleaning",
  "CCTV Installation",
  "Washing Machine Repair",
  "Geyser Repair",
  "Appliance Repair",
  "Mechanic",
  "Beauty",
  "Salon",
  "Spa",
  "Haircut",
  "Makeup",
  "Mehandi",
  "Decor",
  "Photography",
  "Purohit",
  "Car Wash",
  "Bike Wash",
  "Packers & Movers",
];

const QUICK_CHIPS = [
  // Primary Categories
  { label: "🪚 Carpentry", query: "Carpentry" },
  { label: "🔧 Plumbing", query: "Plumbing" },
  { label: "⚡ Electrical", query: "Electrical" },
  { label: "💅 Beauty, Salon & Spa", query: "Beauty, Salon & Spa" },
  { label: "🩺 Doctors", query: "Doctor" },

  // Cleaning Sub-Categories
  { label: "🧹 Floor Cleaning", query: "Floor cleaning" },
  { label: "🍽️ Utensils Cleaning", query: "Utensils Cleaning" },
  { label: "🏠 House Cleaning", query: "House Cleaning" },

  // Painting Sub-Categories
  { label: "🧱 Wall Putty Coating", query: "Wall Putty Coating" },
  { label: "🏠 Interior Painting", query: "Interior Painting" },
  { label: "🏢 Exterior Painting", query: "Exterior Painting" },
  { label: "✨ Texture & Designer Finishers", query: "Texture & Designer Finishers" },
  { label: "🖼️ Wallpaper Installation", query: "Wallpaper Installation" },
  { label: "🪵 Wood Polishing", query: "Wood Polishing" },

  // Mechanical Sub-Categories
  { label: "🏍️ Two-Wheeler (Bikes)", query: "Two-Wheeler (Bikes)" },
  { label: "🚗 Four-Wheeler (Cars)", query: "Four-Wheeler (Cars)" },
  { label: "🚜 Others (Heavy)", query: "Others (Heavy)" },

  // Automobile Cleaning Sub-Categories
  { label: "🏍️ Bike Wash", query: "Bike Wash" },
  { label: "🧼 Car Wash", query: "Car Wash" },

  // Electrical Appliances Repair Sub-Categories
  { label: "❄️ AC Repair", query: "AC Repair" },
  { label: "🧺 Washing Machine", query: "Washing Machine" },
  { label: "🔥 Geyser", query: "Geyser" },
  { label: "🌀 Grinder", query: "Grinder" },
  { label: "🌪️ Mixer", query: "Mixer" },
  { label: "🧊 Refrigerator", query: "Refrigerator" },
  { label: "💧 Water Purifier", query: "Water Purifier" },

  // Events Sub-Categories
  { label: "📸 Photography", query: "Photography" },
  { label: "🪔 Purohit", query: "Purohit" },
  { label: "🎈 Decor", query: "Decor" },
  { label: "🌿 Mehandi", query: "Mehandi" },
  { label: "💄 Makeup", query: "Makeup" },
];

const SERVICE_KEYWORDS = {
  Electrician: [
    "electric",
    "electrician",
    "wire",
    "wiring",
    "fuse",
    "light",
    "switch",
    "socket",
  ],
  Plumber: [
    "plumb",
    "plumber",
    "leak",
    "pipe",
    "tap",
    "water",
    "sink",
    "bathroom",
  ],
  Carpenter: [
    "carpenter",
    "wood",
    "furniture",
    "door",
    "table",
    "chair",
    "cupboard",
  ],
  Painter: [
    "paint",
    "painter",
    "painting",
    "putty",
    "wall color",
  ],
  "House Cleaning": [
    "clean",
    "cleaning",
    "mop",
    "broom",
    "maid",
    "house cleaning",
    "home cleaning",
  ],
  "AC Repair": [
    "ac",
    "air conditioner",
    "air conditioning",
    "cooling",
    "cooler",
    "air cond",
  ],
  Doctor: [
    "doctor",
    "medical",
    "medicine",
    "hospital",
    "sick",
    "ill",
    "fever",
    "health",
  ],
  Mechanic: [
    "mechanic",
    "bike",
    "motorcycle",
    "car",
    "vehicle",
    "engine",
    "repair vehicle",
  ],
  "Pest Control": [
    "pest",
    "cockroach",
    "termite",
    "insects",
    "mosquito",
    "rat",
  ],
  Gardener: [
    "gardener",
    "garden",
    "plants",
    "plant",
    "lawn",
    "grass",
  ],
  Tutor: [
    "tutor",
    "teacher",
    "teaching",
    "classes",
    "study",
    "maths",
    "mathematics",
  ],
  Cook: [
    "cook",
    "cooking",
    "chef",
    "food",
  ],
  Driver: [
    "driver",
    "driving",
    "ride",
    "cab",
  ],
  Beauty: [
    "beauty",
    "salon",
    "spa",
    "haircut",
    "beard",
    "grooming",
    "facial",
    "makeup",
    "bridal",
    "manicure",
    "pedicure",
  ],
  "Packers & Movers": [
    "packers",
    "movers",
    "shifting",
    "house shifting",
    "relocation",
    "transport",
  ],
  "Car Wash": [
    "car wash",
    "bike wash",
    "foam wash",
    "auto wash",
    "vehicle wash",
    "detailing",
  ],
  "Appliance Repair": [
    "appliance",
    "washing machine",
    "fridge",
    "refrigerator",
    "microwave",
    "tv repair",
    "television",
  ],
  "CCTV Installation": [
    "cctv",
    "camera",
    "security camera",
    "doorbell",
    "surveillance",
  ],
};

const getShortLocation = (fullAddress) => {
  if (!fullAddress) return "";
  const parts = fullAddress
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.slice(0, 2).join(", ");
};

/* ============================================================================
   MAIN SMART SEARCH HUB COMPONENT
   ============================================================================ */
function AISmartSearchHub({
  value,
  onChange,
  onSearch,
  detectedLocation,
  onLocationUpdate,
  onCoordsChange,
  aiBannerText,
  aiBannerExpertsTitle,
  aiBannerBonusText,
  isAiLoading,
  aiSuggestedWorkers,
  availableOffersCount,
  availablePlansCount,
  userName,
  onlineWorkers = [],
}) {
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const recognitionRef = useRef(null);

  const performSearch = (query) => {
    const cleanQuery = query?.trim();
    if (!cleanQuery) return;
    setSuggestions([]);
    onChange(cleanQuery);
    onSearch(cleanQuery);
    navigate(`/search?q=${encodeURIComponent(cleanQuery)}`);
  };

  const processVoiceSearch = (speech) => {
    if (!speech) return;
    let text = speech.toLowerCase().trim();
    text = text
      .replace(/^(i\s+)?(need|find|search for|look for|want|looking for)\s+(a|an|the)?\s*/i, "")
      .replace(/^(please\s+)?(find|search|get)\s+(me\s+)?(a|an|the)?\s*/i, "")
      .replace(/\s+(near me|in my area|around me)$/i, "")
      .trim();

    const matchedCategory =
      Object.entries(SERVICE_KEYWORDS).find(([_, keywords]) =>
        keywords.some((keyword) => text.includes(keyword))
      )?.[0] || "";

    const finalQuery = matchedCategory || speech.trim();
    performSearch(finalQuery);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-IN";

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) processVoiceSearch(transcript);
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch (error) {
        console.error("Speech recognition cleanup error:", error);
      }
      recognitionRef.current = null;
    };
  }, []);

  const handleVoiceClick = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert("Voice Search is not supported by your current browser. Please try Google Chrome.");
      return;
    }
    try {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } catch (error) {
      console.error("Unable to start voice recognition:", error);
      setIsListening(false);
    }
  };

  const handleChange = (event) => {
    const inputValue = event.target.value;
    onChange(inputValue);
    const searchValue = inputValue.trim().toLowerCase();
    if (!searchValue) {
      setSuggestions([]);
      return;
    }
    const filteredServices = SERVICE_SUGGESTIONS.filter((service) =>
      service.toLowerCase().includes(searchValue)
    );
    const filteredWorkers = (onlineWorkers || [])
      .filter((w) => w?.name?.toLowerCase().includes(searchValue))
      .map((w) => w.name);

    setSuggestions([...new Set([...filteredServices, ...filteredWorkers])].slice(0, 8));
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      performSearch(value);
    }
    if (event.key === "Escape") {
      setSuggestions([]);
    }
  };

  return (
    <div
      className="service-search-container fade-in"
      style={{
        padding: "24px 28px",
        margin: "16px 20px 20px 20px",
        background: "var(--bg-card)",
        border: "1.5px solid var(--border-color)",
        borderRadius: "24px",
        boxShadow: "var(--shadow-3d)",
        backdropFilter: "var(--blur)",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        position: "relative",
      }}
    >
      <style>
        {`
          @keyframes pulse-mic {
            0% { transform: translateY(-50%) scale(1); }
            50% { transform: translateY(-50%) scale(1.25); box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
            100% { transform: translateY(-50%) scale(1); }
          }
          @media (max-width: 768px) {
            .service-search-container {
              padding: 10px 10px !important;
              margin: 4px 6px 8px 6px !important;
              border-radius: 14px !important;
              gap: 8px !important;
            }
            .search-header-container {
              margin-bottom: 2px !important;
              gap: 6px !important;
            }
            .search-header-status-pill {
              padding: 2px 6px !important;
              font-size: 10px !important;
            }
            .search-header-status-text {
              font-size: 11px !important;
            }
            .search-header-loc-btn {
              padding: 3px 8px !important;
              font-size: 11px !important;
              border-radius: 12px !important;
            }
            .search-input-wrapper {
              gap: 6px !important;
              flex-wrap: nowrap !important;
            }
            .search-input-wrapper input {
              padding: 8px 40px 8px 10px !important;
              font-size: 12px !important;
              border-radius: 10px !important;
              height: 38px !important;
            }
            .search-voice-mic-btn {
              width: 28px !important;
              height: 28px !important;
              right: 6px !important;
            }
            .search-voice-mic-btn svg {
              width: 13px !important;
              height: 13px !important;
              display: block !important;
            }
            #service-search-btn {
              padding: 8px 14px !important;
              font-size: 12px !important;
              border-radius: 10px !important;
              height: 38px !important;
              border-bottom: 2px solid var(--primary-dark) !important;
            }
            .quick-find-badge {
              padding: 2px 5px !important;
              font-size: 10px !important;
              border-radius: 6px !important;
            }
            .quick-chips-horizontal-track button {
              padding: 3px 8px !important;
              font-size: 10.5px !important;
              border-radius: 12px !important;
            }
            .ai-banner-card {
              padding: 8px 10px !important;
              border-radius: 12px !important;
              gap: 6px !important;
              margin-top: 2px !important;
            }
            .ai-banner-robot-icon {
              width: 24px !important;
              height: 24px !important;
              font-size: 12px !important;
              border-radius: 6px !important;
            }
            .ai-banner-title {
              font-size: 11.5px !important;
            }
            .ai-banner-msg {
              font-size: 11px !important;
              line-height: 1.3 !important;
              margin-top: 1px !important;
            }
            .ai-banner-top-picks-title {
              font-size: 10px !important;
            }
            .zy-hub-grid {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 5px !important;
              margin-top: 3px !important;
            }
            .zy-hub-grid > a {
              min-width: 0 !important;
            }
            .zy-hub-grid-item {
              padding: 5px 7px !important;
              border-radius: 8px !important;
            }
            .zy-hub-grid-name {
              font-size: 11.5px !important;
            }
            .zy-hub-grid-role {
              font-size: 10px !important;
            }
            .zy-hub-grid-rating {
              font-size: 10px !important;
            }
            .ai-banner-bonuses {
              padding-top: 6px !important;
              margin-top: 2px !important;
              gap: 6px !important;
            }
            .ai-banner-bonus-title {
              font-size: 11px !important;
            }
            .ai-banner-bonus-desc {
              font-size: 10px !important;
            }
            .ai-banner-offers-btn {
              padding: 4px 10px !important;
              font-size: 10.5px !important;
              border-radius: 6px !important;
            }
          }
        `}
      </style>

      {/* 1. Header Area with Live status & Location badge */}
      <SearchHeader
        detectedLocation={detectedLocation}
        onShowMap={() => setShowMap(true)}
      />

      {/* 2. Main Search Input bar & Autocomplete suggestions */}
      <SearchInput
        value={value}
        isListening={isListening}
        focused={focused}
        suggestions={suggestions}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onVoiceClick={handleVoiceClick}
        onPickSuggestion={performSearch}
        onSearch={() => performSearch(value)}
      />

      {/* 3. Quick Chips Buttons */}
      <QuickSearchChips
        value={value}
        onChipClick={performSearch}
      />

      {/* 4. Zy AI Matchmaker Recommendation card */}
      <AIRecommendationCard
        detectedLocation={detectedLocation}
        aiBannerText={aiBannerText}
        userName={userName}
        isAiLoading={isAiLoading}
        aiSuggestedWorkers={aiSuggestedWorkers}
        aiBannerExpertsTitle={aiBannerExpertsTitle}
        aiBannerBonusText={aiBannerBonusText}
        availableOffersCount={availableOffersCount}
        availablePlansCount={availablePlansCount}
      />

      {/* 5. Map modal portal */}
      {showMap && (
        <LocationMapModal
          onClose={() => setShowMap(false)}
          onLocationUpdate={onLocationUpdate}
          onCoordsChange={onCoordsChange}
        />
      )}
    </div>
  );
}

/* ============================================================================
   ARCHITECTURAL SUB-COMPONENTS
   ============================================================================ */

function SearchHeader({ detectedLocation, onShowMap }) {
  return (
    <div
      className="search-header-container"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      <div
        className="search-header-status"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <div
          className="search-header-status-pill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            padding: "4px 10px",
            borderRadius: "20px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              display: "inline-block",
              boxShadow: "0 0 8px #10b981",
              animation: "pulse-badge 1.8s infinite ease-in-out",
            }}
          />
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 800,
              color: "#10b981",
              letterSpacing: "0.5px",
            }}
          >
            Zy AI Online
          </span>
        </div>
        <span
          className="search-header-status-text"
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            fontWeight: 600,
          }}
        >
          Live AI Matchmaker Active
        </span>
      </div>

      <button
        type="button"
        className="search-header-loc-btn"
        onClick={onShowMap}
        aria-label="Select service location"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "var(--primary-light)",
          color: "var(--primary)",
          padding: "6px 14px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: 700,
          border: "1px solid var(--border-color)",
          cursor: "pointer",
          transition: "transform 0.15s ease",
          outline: "none",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = "scale(1.03)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = "none";
        }}
      >
        <span>📍</span>
        {detectedLocation ? getShortLocation(detectedLocation) : "Set Location on Map"}
      </button>
    </div>
  );
}

function SearchInput({
  value,
  isListening,
  focused,
  suggestions,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  onVoiceClick,
  onPickSuggestion,
  onSearch,
}) {
  const hasSearchValue = Boolean(value?.trim());
  return (
    <div
      className="search-input-wrapper"
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        gap: "12px",
        flexWrap: "wrap",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", flex: 1, minWidth: "160px" }}>
        <input
          id="service-search-input"
          type="text"
          placeholder={isListening ? "Listening closely... 🎙️" : "Ask Zy AI or type service (e.g. Plumber, Electrician...)"}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-label="Search for a service"
          autoComplete="off"
          style={{
            width: "100%",
            padding: "14px 52px 14px 18px",
            borderRadius: "16px",
            border: isListening ? "2.5px solid #ef4444" : "1.5px solid var(--border-color)",
            backgroundColor: "var(--bg-card-hover)",
            color: "var(--text-main)",
            fontSize: "15px",
            fontWeight: 500,
            outline: "none",
            boxSizing: "border-box",
            boxShadow: isListening ? "0 0 15px rgba(239, 68, 68, 0.35)" : "inset 0 1px 3px rgba(0, 0, 0, 0.03)",
            transition: "all 0.25s ease",
          }}
        />

        <button
          type="button"
          className="search-voice-mic-btn"
          onClick={onVoiceClick}
          aria-label={isListening ? "Stop voice search" : "Start voice search with Zy AI"}
          title={isListening ? "Listening... Click to stop" : "Voice Search with Zy AI 🎙️"}
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            width: "34px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isListening ? "#ffffff" : "#10b981",
            fontSize: "15px",
            zIndex: 10,
            padding: 0,
            borderRadius: "50%",
            border: isListening ? "2px solid #ef4444" : "1.5px solid rgba(16, 185, 129, 0.4)",
            backgroundColor: isListening ? "#ef4444" : "rgba(16, 185, 129, 0.12)",
            boxShadow: isListening
              ? "0 0 14px rgba(239, 68, 68, 0.6)"
              : "0 2px 6px rgba(16, 185, 129, 0.15)",
            animation: isListening ? "pulse-mic 1.2s infinite ease-in-out" : "none",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <FaMicrophone style={{ width: "15px", height: "15px", display: "block" }} />
        </button>

        {focused && suggestions.length > 0 && (
          <ul
            role="listbox"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              backgroundColor: "var(--bg-card)",
              border: "1.5px solid var(--border-color)",
              borderRadius: "14px",
              boxShadow: "var(--shadow-hover)",
              listStyle: "none",
              margin: 0,
              padding: "8px 0",
              zIndex: 1000,
              maxHeight: "220px",
              overflowY: "auto",
              backdropFilter: "var(--blur)",
            }}
          >
            {suggestions.map((service) => (
              <li
                key={service}
                role="option"
                onMouseDown={() => onPickSuggestion(service)}
                style={{
                  padding: "10px 18px",
                  cursor: "pointer",
                  fontSize: "14.5px",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "var(--primary-light)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: "16px" }}>🛠️</span>
                {service}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        id="service-search-btn"
        type="button"
        onClick={onSearch}
        disabled={!hasSearchValue}
        aria-label="Search services"
        style={{
          padding: "14px 28px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
          color: "#ffffff",
          border: "none",
          borderBottom: "4px solid var(--primary-dark)",
          cursor: hasSearchValue ? "pointer" : "not-allowed",
          fontWeight: 800,
          fontSize: "14.5px",
          flexShrink: 0,
          opacity: hasSearchValue ? 1 : 0.55,
          boxShadow: "0 4px 12px var(--primary-glow)",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(event) => {
          if (hasSearchValue) {
            event.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = "none";
        }}
      >
        Search
      </button>
    </div>
  );
}

function QuickSearchChips({ value, onChipClick }) {
  const scrollRef = useRef(null);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const currentIndexRef = useRef(0);
  const [attractedIndex, setAttractedIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      if (isPausedRef.current || !el) return;

      const buttons = el.querySelectorAll("button");
      if (!buttons || buttons.length <= 1) return;

      // Advance sequentially one by one
      currentIndexRef.current = (currentIndexRef.current + 1) % buttons.length;
      setAttractedIndex(currentIndexRef.current);

      const targetBtn = buttons[currentIndexRef.current];
      if (targetBtn) {
        if (currentIndexRef.current === 0) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          // Attractively center the active chip into view
          const targetLeft = targetBtn.offsetLeft - (el.clientWidth - targetBtn.offsetWidth) / 2;
          el.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
        }
      }
    }, 1600); // 1.6s attractive step per chip

    return () => clearInterval(interval);
  }, []);

  const handlePause = () => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handleResume = (delay = 2000) => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (el) {
        const buttons = el.querySelectorAll("button");
        let closestIdx = 0;
        let minDiff = Infinity;
        buttons.forEach((btn, idx) => {
          const diff = Math.abs(btn.offsetLeft - el.scrollLeft);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });
        currentIndexRef.current = closestIdx;
        setAttractedIndex(closestIdx);
      }
      isPausedRef.current = false;
    }, delay);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <span
        className="quick-find-badge"
        style={{
          fontSize: "12px",
          color: "var(--text-secondary)",
          fontWeight: 800,
          flexShrink: 0,
          whiteSpace: "nowrap",
          padding: "4px 8px",
          borderRadius: "8px",
          background: "rgba(49, 82, 91, 0.08)",
        }}
      >
        ⚡ Quick Find:
      </span>

      <div
        ref={scrollRef}
        className="quick-chips-horizontal-track"
        onMouseEnter={handlePause}
        onMouseLeave={() => handleResume(600)}
        onTouchStart={handlePause}
        onTouchEnd={() => handleResume(2000)}
        onMouseDown={handlePause}
        onMouseUp={() => handleResume(1500)}
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          flex: 1,
          padding: "4px 0",
          scrollBehavior: "smooth",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          cursor: "grab",
          userSelect: "none",
        }}
      >
        {QUICK_CHIPS.map((chip, idx) => {
          const isSelected = value === chip.query;
          const isAttracted = attractedIndex === idx && !value;
          return (
            <button
              key={chip.query}
              type="button"
              onClick={() => onChipClick(chip.query)}
              aria-label={`Search for ${chip.query}`}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: isSelected
                  ? "1.5px solid var(--primary)"
                  : isAttracted
                  ? "1.5px solid var(--primary)"
                  : "1px solid var(--border-color)",
                background: isSelected
                  ? "var(--primary)"
                  : isAttracted
                  ? "linear-gradient(135deg, rgba(49, 82, 91, 0.12) 0%, rgba(179, 222, 229, 0.25) 100%)"
                  : "linear-gradient(135deg, rgba(49, 82, 91, 0.05) 0%, rgba(179, 222, 229, 0.1) 100%)",
                color: isSelected ? "#ffffff" : isAttracted ? "var(--primary-dark)" : "var(--text-main)",
                fontSize: "12px",
                fontWeight: isSelected || isAttracted ? 800 : 600,
                transform: isAttracted ? "scale(1.04)" : "none",
                boxShadow: isSelected || isAttracted
                  ? "0 3px 10px rgba(49, 82, 91, 0.15)"
                  : "0 2px 5px rgba(0, 0, 0, 0.03)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AIRecommendationCard({
  detectedLocation,
  aiBannerText,
  userName,
  isAiLoading,
  aiSuggestedWorkers,
  aiBannerExpertsTitle,
  aiBannerBonusText,
  availableOffersCount,
  availablePlansCount,
}) {
  return (
    <div
      className="ai-banner-card"
      style={{
        marginTop: "6px",
        padding: "20px 24px",
        background: "var(--ai-banner-bg)",
        border: "1.5px solid var(--ai-banner-border)",
        borderRadius: "18px",
        fontSize: "14px",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        minHeight: "auto",
        boxShadow: "0 12px 30px -10px rgba(0, 0, 0, 0.35), 0 0 15px rgba(16, 185, 129, 0.15)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.boxShadow = "0 16px 36px -10px rgba(0, 0, 0, 0.45), 0 0 20px rgba(16, 185, 129, 0.25)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "none";
        event.currentTarget.style.boxShadow = "0 12px 30px -10px rgba(0, 0, 0, 0.35), 0 0 15px rgba(16, 185, 129, 0.15)";
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div
          className="ai-banner-robot-icon"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            flexShrink: 0,
          }}
        >
          🤖
        </div>
        <div style={{ flex: 1 }}>
          <span
            className="ai-banner-title"
            style={{
              fontSize: "13.5px",
              fontWeight: 800,
              color: "#34d399",
              letterSpacing: "0.5px",
              display: "block",
            }}
          >
            Zy AI Assistant
          </span>
          <div
            className="ai-banner-msg"
            style={{
              fontSize: "14px",
              color: "rgba(241, 245, 249, 0.95)",
              lineHeight: "1.5",
              fontWeight: 400,
              marginTop: "4px",
            }}
          >
            {aiBannerText || (
              <>
                Hey {userName ? userName.split(" ")[0] : "there"}! Based on your location{" "}
                <strong>{getShortLocation(detectedLocation)}</strong>, Zy found top verified experts, budget-friendly workers, and instant bookings in your area!
              </>
            )}
          </div>
        </div>
      </div>

      <SuggestedWorkers
        isAiLoading={isAiLoading}
        aiSuggestedWorkers={aiSuggestedWorkers}
        aiBannerExpertsTitle={aiBannerExpertsTitle}
      />

      <LocationBonuses
        isAiLoading={isAiLoading}
        aiBannerBonusText={aiBannerBonusText}
        availableOffersCount={availableOffersCount}
        availablePlansCount={availablePlansCount}
      />
    </div>
  );
}

function SuggestedWorkers({ isAiLoading, aiSuggestedWorkers, aiBannerExpertsTitle }) {
  if (isAiLoading) {
    return (
      <div style={{ marginTop: "6px" }}>
        <SkeletonLoader type="list" count={1} />
      </div>
    );
  }
  if (!aiSuggestedWorkers || aiSuggestedWorkers.length === 0) {
    return (
      <div style={{ marginTop: "6px", fontSize: "12.5px", color: "rgba(226, 232, 240, 0.7)" }}>
        No specific experts matched locally. Explore all options below!
      </div>
    );
  }
  return (
    <div style={{ marginTop: "6px" }}>
      <strong
        className="ai-banner-top-picks-title"
        style={{
          fontSize: "12.5px",
          color: "#94a3b8",
          letterSpacing: "0.3px",
          textTransform: "uppercase",
          display: "block",
        }}
      >
        {aiBannerExpertsTitle || "🔍 Top Picks Near You:"}
      </strong>
      <div
        className="zy-hub-grid"
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "8px",
        }}
      >
        {aiSuggestedWorkers.map((worker, index) => (
          <Link
            key={worker.id || worker._id || `${worker.name}-${index}`}
            to="/worker"
            onClick={() => {
              localStorage.setItem("selected_worker", JSON.stringify(worker));
            }}
            style={{ textDecoration: "none" }}
          >
            <div
              className="zy-hub-grid-item"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.07)",
                backdropFilter: "blur(12px)",
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                minWidth: "150px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.14)";
                event.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.07)";
                event.currentTarget.style.transform = "none";
              }}
            >
              <span className="zy-hub-grid-name" style={{ fontWeight: 800, fontSize: "13.5px", color: "#ffffff" }}>{worker.name}</span>
              <span className="zy-hub-grid-role" style={{ fontSize: "11.5px", color: "#94a3b8", fontWeight: 500 }}>{worker.service}</span>
              <span className="zy-hub-grid-rating" style={{ fontSize: "11.5px", color: "#fbbf24", fontWeight: 800, display: "flex", alignItems: "center", gap: "3px", marginTop: "1px" }}>⭐ {worker.rating}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LocationBonuses({
  isAiLoading,
  aiBannerBonusText,
  availableOffersCount,
  availablePlansCount,
}) {
  if (isAiLoading || (availableOffersCount <= 0 && availablePlansCount <= 0)) {
    return null;
  }
  return (
    <div
      className="ai-banner-bonuses"
      style={{
        marginTop: "4px",
        paddingTop: "12px",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <strong
          className="ai-banner-bonus-title"
          style={{
            fontSize: "12.5px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          🎁 Location Bonuses Unlocked!
        </strong>
        <span
          className="ai-banner-bonus-desc"
          style={{
            fontSize: "11.5px",
            color: "rgba(203, 213, 225, 0.85)",
            marginTop: "1px",
          }}
        >
          {aiBannerBonusText || (
            <>
              Zy found{" "}
              {availablePlansCount > 0 && (
                <strong>
                  {availablePlansCount} Service Plan{availablePlansCount !== 1 ? "s" : ""}
                </strong>
              )}
              {availablePlansCount > 0 && availableOffersCount > 0 && " and "}
              {availableOffersCount > 0 && (
                <strong>
                  {availableOffersCount} Active Promo Offer{availableOffersCount !== 1 ? "s" : ""}
                </strong>
              )}{" "}
              for your area!
            </>
          )}
        </span>
      </div>

      <Link
        to="/plans-offers"
        className="ai-banner-offers-btn"
        onClick={(event) => event.stopPropagation()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "8px 14px",
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "#ffffff",
          borderRadius: "10px",
          fontSize: "12.5px",
          fontWeight: 800,
          textDecoration: "none",
          boxShadow: "0 4px 10px rgba(16, 185, 129, 0.25)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = "scale(1.03)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = "none";
        }}
      >
        View Plans & Offers &rarr;
      </Link>
    </div>
  );
}

function LocationMapModal({ onClose, onLocationUpdate, onCoordsChange }) {
  return createPortal(
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select service location"
        onClick={(event) => event.stopPropagation()}
        style={{
          backgroundColor: "var(--bg-card, #ffffff)",
          borderRadius: "18px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.4)",
          border: "1.5px solid var(--border-color, #e2e8f0)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "620px",
          maxHeight: "92vh",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color, #e2e8f0)",
            backgroundColor: "var(--primary-light, #f8fafc)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaMap size={16} style={{ color: "var(--primary)" }} />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>
              Select Your Service Location
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close location map"
            style={{
              background: "none",
              border: "none",
              fontSize: "22px",
              lineHeight: "1",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          <MapPicker
            onLocationChange={(location) => {
              if (onLocationUpdate) {
                onLocationUpdate(location);
              }
              onClose();
            }}
            onCoordsChange={(coords) => {
              if (onCoordsChange) {
                onCoordsChange(coords);
              }
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AISmartSearchHub;
