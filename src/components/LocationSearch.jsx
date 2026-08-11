import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaMicrophone, FaSearch, FaMap } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import MapPicker from "./MapPicker";

const SERVICE_SUGGESTIONS = [
  "Plumber", "Electrician", "Carpenter", "Painter", "Doctor",
  "AC Repair", "House Cleaning", "Pest Control", "Gardener",
  "Security Guard", "CCTV Installation", "Appliance Repair",
  "Tutor", "Cook", "Driver", "Mechanic", "Yoga Trainer",
];

function LocationSearch({ value, onChange, onSearch, detectedLocation, onLocationClick, onCoordsChange, onLocationUpdate, style = {} }) {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        processVoiceSearch(transcript);
      };

      setRecognition(rec);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processVoiceSearch = (speech) => {
    let text = speech.toLowerCase().trim();
    // Clean filler phrases
    const fillers = [
      "need an", "need a", "find a", "find an", "look for", "search for", 
      "near me", "in my area", "please find", "helper", "expert", "service"
    ];
    
    fillers.forEach(f => {
      text = text.replace(f, "");
    });
    
    text = text.trim();

    // Map keywords to official categories
    let matchedCategory = "";
    if (text.includes("electric") || text.includes("wire") || text.includes("fuse") || text.includes("light")) {
      matchedCategory = "Electrician";
    } else if (text.includes("plumb") || text.includes("leak") || text.includes("pipe") || text.includes("tap")) {
      matchedCategory = "Plumber";
    } else if (text.includes("carpenter") || text.includes("wood") || text.includes("furniture") || text.includes("door")) {
      matchedCategory = "Carpenter";
    } else if (text.includes("paint") || text.includes("putty")) {
      matchedCategory = "Painter";
    } else if (text.includes("clean") || text.includes("mop") || text.includes("broom") || text.includes("maid")) {
      matchedCategory = "House Cleaning";
    } else if (text.includes("ac") || text.includes("cool") || text.includes("air cond")) {
      matchedCategory = "AC Repair";
    } else if (text.includes("doctor") || text.includes("medical") || text.includes("sick") || text.includes("ill")) {
      matchedCategory = "Doctor";
    } else if (text.includes("mechanic") || text.includes("bike") || text.includes("car")) {
      matchedCategory = "Mechanic";
    }

    const finalQuery = matchedCategory || speech;
    onChange(finalQuery);
    navigate(`/search?q=${encodeURIComponent(finalQuery)}`);
  };

  const handleVoiceClick = () => {
    if (!recognition) {
      alert("Voice Search is not supported by your current browser. Please try Google Chrome.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (val.trim().length > 0) {
      const filtered = SERVICE_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = () => {
    if (value.trim()) {
      setSuggestions([]);
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const pickSuggestion = (s) => {
    onChange(s);
    setSuggestions([]);
    navigate(`/search?q=${encodeURIComponent(s)}`);
  };

  return (
    <div className="service-search-container" ref={containerRef} style={{ padding: "16px 18px", margin: "0", background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: "18px", boxShadow: "var(--card-shadow)", backdropFilter: "blur(16px)", width: "100%", boxSizing: "border-box", ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-main)", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", letterSpacing: "0.2px" }}>
          <FaSearch size={15} style={{ color: "#0284c7" }} /> Search Services or Workers
        </p>
        <button 
          type="button"
          onClick={() => setShowMap(true)}
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "6px", 
            backgroundColor: "rgba(14, 165, 233, 0.12)", 
            color: "#0284c7", 
            padding: "5px 14px", 
            borderRadius: "20px", 
            fontSize: "12.5px", 
            fontWeight: 700,
            border: "1px solid rgba(14, 165, 233, 0.3)",
            cursor: "pointer",
            transition: "transform 0.15s ease",
            outline: "none"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
        >
          <span style={{ fontSize: "13px" }}>📍</span>
          {detectedLocation ? detectedLocation.split(",").slice(0, 2).join(",").trim() : "Set Location on Map"}
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "10px", position: "relative" }}>
        
        {/* Map Modal */}
        {showMap && createPortal(
          <div 
            onClick={() => setShowMap(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999999,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "16px"
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "var(--bg-card, #ffffff)",
                borderRadius: "18px",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.4)",
                border: "1.5px solid var(--border-color, #e2e8f0)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                animation: "fadeIn 0.2s ease-out",
                width: "100%",
                maxWidth: "620px",
                maxHeight: "92vh"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-color, #e2e8f0)",
                backgroundColor: "var(--primary-light, #f8fafc)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaMap size={16} style={{ color: "#0284c7" }} />
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-main, #0f172a)" }}>
                    Select Your Service Location
                  </h3>
                </div>
                <button
                  onClick={() => setShowMap(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "22px",
                    lineHeight: "1",
                    cursor: "pointer",
                    color: "var(--text-secondary, #64748b)",
                    padding: "4px 8px",
                    borderRadius: "6px"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary, #64748b)"}
                >
                  &times;
                </button>
              </div>
              <div style={{ overflowY: "auto", flex: 1 }}>
                <MapPicker
                  onLocationChange={(loc) => { 
                    if(onLocationUpdate) onLocationUpdate(loc); 
                    setShowMap(false); 
                  }}
                  onCoordsChange={(coords) => {
                    if (onCoordsChange) onCoordsChange(coords);
                  }}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
        <div style={{ position: "relative", flex: 1, width: "100%" }}>
          <input
            id="service-search-input"
            type="text"
            placeholder={isListening ? "Listening closely... 🎙️" : "e.g. Plumber, Electrician, Doctor..."}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            style={{
              width: "100%",
              padding: "12px 48px 12px 16px",
              borderRadius: "12px",
              border: isListening ? "2px solid #ef4444" : "1.5px solid var(--border-color)",
              backgroundColor: "var(--bg-card-hover)",
              color: "var(--text-main)",
              fontSize: "14.5px",
              fontWeight: 500,
              outline: "none",
              boxSizing: "border-box",
              boxShadow: isListening ? "0 0 12px rgba(239, 68, 68, 0.4)" : "inset 0 1px 3px rgba(0, 0, 0, 0.03)",
              transition: "all 0.2s ease"
            }}
          />

          {/* Draggable/Pulsing Microphone Trigger */}
          <div
            onClick={handleVoiceClick}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isListening ? "#ef4444" : "var(--text-secondary, #94a3b8)",
              fontSize: "16px",
              zIndex: 10,
              padding: "6px",
              borderRadius: "50%",
              backgroundColor: isListening ? "rgba(239, 68, 68, 0.1)" : "transparent",
              animation: isListening ? "pulse-mic 1.2s infinite ease-in-out" : "none"
            }}
          >
            <FaMicrophone />
          </div>

          {/* Inline animations inside standard stylesheet falls */}
          <style>{`
            @keyframes pulse-mic {
              0% { transform: translateY(-50%) scale(1); }
              50% { transform: translateY(-50%) scale(1.2); box-shadow: 0 0 10px rgba(239, 68, 68, 0.3); }
              100% { transform: translateY(-50%) scale(1); }
            }
          `}</style>

          {/* Suggestions Dropdown */}
          {focused && suggestions.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                backgroundColor: "var(--bg-card)",
                border: "1.5px solid var(--border-color)",
                borderRadius: "14px",
                boxShadow: "var(--hover-shadow)",
                listStyle: "none",
                margin: 0,
                padding: "8px 0",
                zIndex: 1000,
                maxHeight: "220px",
                overflowY: "auto",
                backdropFilter: "blur(16px)",
              }}
            >
              {suggestions.map((s) => (
                <li
                  key={s}
                  onMouseDown={() => pickSuggestion(s)}
                  style={{
                    padding: "10px 18px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-main)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-light)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: "16px" }}>🛠️</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          id="service-search-btn"
          onClick={handleSearch}
          style={{
            padding: "12px 24px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "#ffffff",
            border: "none",
            borderBottom: "3px solid #075985",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "14px",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
        >
          Search
        </button>
      </div>
    </div>
  );
}

export default LocationSearch;
