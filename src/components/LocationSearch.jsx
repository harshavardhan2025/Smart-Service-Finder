import { useState } from "react";

const SERVICE_SUGGESTIONS = [
  "Plumber", "Electrician", "Carpenter", "Painter", "Doctor",
  "AC Repair", "House Cleaning", "Pest Control", "Gardener",
  "Security Guard", "CCTV Installation", "Appliance Repair",
  "Tutor", "Cook", "Driver", "Mechanic", "Yoga Trainer",
];

function LocationSearch({ value, onChange, onSearch }) {
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);

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
      onSearch(value.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const pickSuggestion = (s) => {
    onChange(s);
    setSuggestions([]);
    onSearch(s);
  };

  return (
    <div style={{ padding: "20px" }}>
      <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "var(--text-secondary, #6b7280)", fontWeight: 600 }}>
        🔍 Search Services or Workers
      </p>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <input
            id="service-search-input"
            type="text"
            placeholder="e.g. Plumber, Electrician, Doctor..."
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            style={{
              width: "350px",
              padding: "10px",
              borderRadius: "8px",
              border: "1.5px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-main)",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

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
            marginLeft: "10px",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Search
        </button>
      </div>
    </div>
  );
}

export default LocationSearch;
