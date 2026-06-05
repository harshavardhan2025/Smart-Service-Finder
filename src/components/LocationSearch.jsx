import { useState, useEffect } from "react";
import { FaMicrophone } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const SERVICE_SUGGESTIONS = [
  "Plumber", "Electrician", "Carpenter", "Painter", "Doctor",
  "AC Repair", "House Cleaning", "Pest Control", "Gardener",
  "Security Guard", "CCTV Installation", "Appliance Repair",
  "Tutor", "Cook", "Driver", "Mechanic", "Yoga Trainer",
];

function LocationSearch({ value, onChange, onSearch, detectedLocation, onLocationClick }) {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

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
    <div className="service-search-container" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary, #6b7280)", fontWeight: 600 }}>
          🔍 Search Services or Workers
        </p>
        {detectedLocation && (
          <div 
            onClick={onLocationClick}
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px", 
              backgroundColor: "#dcfce7", 
              color: "#15803d", 
              padding: "4px 12px", 
              borderRadius: "20px", 
              fontSize: "12px", 
              fontWeight: 600,
              border: "1px solid #bbf7d0",
              cursor: onLocationClick ? "pointer" : "default"
            }}
          >
            <span>📍</span>
            {detectedLocation.split(",").slice(0, 2).join(",").trim()}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "350px", width: "100%" }}>
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
              padding: "10px 45px 10px 12px",
              borderRadius: "8px",
              border: isListening ? "1.5px solid #ef4444" : "1.5px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-main)",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
              boxShadow: isListening ? "0 0 8px rgba(239, 68, 68, 0.4)" : "none",
              transition: "all 0.2s ease"
            }}
          />

          {/* Draggable/Pulsing Microphone Trigger */}
          <div
            onClick={handleVoiceClick}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isListening ? "#ef4444" : "var(--text-secondary, #94a3b8)",
              fontSize: "16px",
              zIndex: 10,
              padding: "4px",
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
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                boxShadow: "var(--shadow-3d)",
                listStyle: "none",
                margin: 0,
                padding: "6px 0",
                zIndex: 1000,
                maxHeight: "220px",
                overflowY: "auto",
                backdropFilter: "var(--blur)",
              }}
            >
              {suggestions.map((s) => (
                <li
                  key={s}
                  onMouseDown={() => pickSuggestion(s)}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "var(--text-main)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background 0.15s",
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
          className="btn-primary"
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            flexShrink: 0
          }}
        >
          Search
        </button>
      </div>
    </div>
  );
}

export default LocationSearch;
