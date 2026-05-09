import { useEffect, useState } from "react";

function LocationSearch({ value, onChange, onSearch }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const detected = data?.display_name
            ? data.display_name
            : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          onChange(detected);
          onSearch(detected); // auto-search on load
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          onChange(fallback);
          onSearch(fallback);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLoading(false);
      }
    );
  }, []);

  const handleSearch = () => {
    if (value.trim()) onSearch(value.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <input
          type="text"
          placeholder={loading ? "Fetching current location..." : "Search your location..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: "350px",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc"
          }}
        />

        <button
          onClick={handleSearch}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            backgroundColor: "#2196F3",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Search
        </button>
      </div>
      {loading && (
        <p style={{ fontSize: "12px", color: "gray", margin: "5px 0 0 0" }}>
          📍 Auto-detecting your location...
        </p>
      )}
    </div>
  );
}

export default LocationSearch;
