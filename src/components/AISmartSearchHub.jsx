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
  "Pest Control",
  "Gardener",
  "Security Guard",
  "CCTV Installation",
  "Appliance Repair",
  "Tutor",
  "Cook",
  "Driver",
  "Mechanic",
  "Yoga Trainer",
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
  { label: "💧 Plumber", query: "Plumber" },
  { label: "⚡ Electrician", query: "Electrician" },
  { label: "❄️ AC Repair", query: "AC Repair" },
  { label: "🧹 House Cleaning", query: "House Cleaning" },
  { label: "🩺 Doctor", query: "Doctor" },
  { label: "🪚 Carpenter", query: "Carpenter" },
  { label: "🎨 Painter", query: "Painter" },
  { label: "🏍️ Mechanic", query: "Mechanic" },
  { label: "🐜 Pest Control", query: "Pest Control" },
  { label: "📦 Packers & Movers", query: "Packers & Movers" },
  { label: "💅 Beauty & Salon", query: "Beauty" },
  { label: "🚗 Car Wash", query: "Car Wash" },
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
          @keyframes quickChipsScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .quick-chips-track:hover,
          .quick-chips-track.is-paused {
            animation-play-state: paused !important;
          }
          @media (max-width: 768px) {
            .zy-hub-grid {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 10px !important;
            }
            .zy-hub-grid > a {
              min-width: 0 !important;
            }
          }
          @media (max-width: 600px) {
            .service-search-container {
              padding: 14px 12px !important;
              margin: 8px 8px 14px 8px !important;
              border-radius: 18px !important;
              gap: 12px !important;
            }
            .search-input-wrapper input {
              padding: 12px 42px 12px 14px !important;
              font-size: 14px !important;
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
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <div
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
      <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
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
          onClick={onVoiceClick}
          aria-label={isListening ? "Stop voice search" : "Start voice search"}
          title={isListening ? "Stop voice search" : "Start voice search"}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            width: "34px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isListening ? "#ef4444" : "var(--text-secondary)",
            fontSize: "16px",
            zIndex: 10,
            padding: "6px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: isListening ? "rgba(239, 68, 68, 0.1)" : "transparent",
            animation: isListening ? "pulse-mic 1.2s infinite ease-in-out" : "none",
          }}
        >
          <FaMicrophone />
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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animId;
    const speed = 1.35; // Fast, continuous, readable auto-scrolling

    const step = () => {
      if (!isPausedRef.current && el) {
        el.scrollLeft += speed;
        // Loop back seamlessly once half the repeated track is scrolled
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft -= el.scrollWidth / 2;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePause = () => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handleResume = (delay = 600) => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
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
        ⚡ Quick Tasks:
      </span>

      <div
        ref={scrollRef}
        className="quick-chips-horizontal-track"
        onMouseEnter={handlePause}
        onMouseLeave={() => handleResume(300)}
        onTouchStart={handlePause}
        onTouchEnd={() => handleResume(800)}
        onMouseDown={handlePause}
        onMouseUp={() => handleResume(600)}
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          flex: 1,
          padding: "3px 0",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          cursor: "grab",
          userSelect: "none",
        }}
      >
        {[...QUICK_CHIPS, ...QUICK_CHIPS, ...QUICK_CHIPS, ...QUICK_CHIPS].map((chip, idx) => {
          const isSelected = value === chip.query;
          return (
            <button
              key={`${chip.query}-${idx}`}
              type="button"
              onClick={() => onChipClick(chip.query)}
              aria-label={`Search for ${chip.query}`}
              style={{
                padding: "5px 13px",
                borderRadius: "20px",
                border: isSelected ? "1.5px solid var(--primary)" : "1px solid var(--border-color)",
                background: isSelected
                  ? "var(--primary)"
                  : "linear-gradient(135deg, rgba(49, 82, 91, 0.05) 0%, rgba(179, 222, 229, 0.1) 100%)",
                color: isSelected ? "#ffffff" : "var(--text-main)",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.04)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
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
      <div style={{ display: "flex", gap: "12px" }}>
        <div
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
            style={{
              fontSize: "13.5px",
              fontWeight: 800,
              color: "#34d399",
              letterSpacing: "0.5px",
            }}
          >
            Zy AI Assistant
          </span>
          <div
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
        style={{
          fontSize: "12.5px",
          color: "#94a3b8",
          letterSpacing: "0.3px",
          textTransform: "uppercase",
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
              <span style={{ fontWeight: 800, fontSize: "13.5px", color: "#ffffff" }}>{worker.name}</span>
              <span style={{ fontSize: "11.5px", color: "#94a3b8", fontWeight: 500 }}>{worker.service}</span>
              <span style={{ fontSize: "11.5px", color: "#fbbf24", fontWeight: 800, display: "flex", alignItems: "center", gap: "3px", marginTop: "1px" }}>⭐ {worker.rating}</span>
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
        View Plans & Offers →
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
