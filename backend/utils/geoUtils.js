/**
 * Haversine formula — returns distance in km between two lat/lng points.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// In-memory geocode cache so we don't hammer Nominatim
const geocodeCache = {};

// 🚀 HIGH-PERFORMANCE LOCAL GEOSPATIAL DICTIONARY
// Pre-computed exact coordinates for all seeded cities, suburbs, and neighborhoods
const LOCAL_GEO_DB = {
  "kakinada central area": { lat: 16.989062, lon: 82.243878 },
  "kakinada suburbs": { lat: 16.955000, lon: 82.215000 },
  "kakinada": { lat: 16.989062, lon: 82.243878 },
  
  "rajahmundry central area": { lat: 17.000538, lon: 81.804034 },
  "rajahmundry suburbs": { lat: 17.035000, lon: 81.775000 },
  "rajahmundry": { lat: 17.000538, lon: 81.804034 },
  
  "new delhi central area": { lat: 28.613939, lon: 77.209021 },
  "new delhi suburbs": { lat: 28.575000, lon: 77.155000 },
  "new delhi": { lat: 28.613939, lon: 77.209021 },
  
  "hyderabad central area": { lat: 17.385044, lon: 78.486671 },
  "hyderabad suburbs": { lat: 17.415000, lon: 78.435000 },
  "hyderabad": { lat: 17.385044, lon: 78.486671 },

  // Pre-computed exact coordinates for seeded worker neighborhoods to prevent Nominatim hits
  "danavaipeta": { lat: 17.008400, lon: 81.792500 },
  "main road": { lat: 16.979800, lon: 82.242500 },
  "bommarillu": { lat: 17.012000, lon: 81.798000 },
  "rtc complex": { lat: 16.984030, lon: 82.239840 },
  "pushkar ghat": { lat: 16.995000, lon: 81.776000 },
  "suryaraopeta": { lat: 16.986500, lon: 82.238900 },
  "lala cheruvu": { lat: 17.025000, lon: 81.821000 },
  "bhanugudi junction": { lat: 16.980120, lon: 82.235670 },
  "jagannaickpur": { lat: 16.968000, lon: 82.245000 },
  "kovvur sub": { lat: 17.021000, lon: 81.728000 }
};

/**
 * Geocode a city/address string to { lat, lon } using Nominatim.
 * Returns null on failure.
 */
export async function geocodeCity(cityName) {
  const key = cityName.toLowerCase().trim();
  
  // 1. Direct memory cache match
  if (geocodeCache[key]) return geocodeCache[key];

  // 2. High-performance pre-computed dictionary lookup (Exact)
  if (LOCAL_GEO_DB[key]) {
    return LOCAL_GEO_DB[key];
  }

  // 3. Dynamic Fuzzy matcher against local database
  const fuzzyMatch = Object.keys(LOCAL_GEO_DB).find(
    (k) => key.includes(k) || k.includes(key)
  );
  if (fuzzyMatch) {
    geocodeCache[key] = LOCAL_GEO_DB[fuzzyMatch];
    return LOCAL_GEO_DB[fuzzyMatch];
  }

  // 4. Remote HTTP fallback (For arbitrary user address inputs)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SmartServiceFinder/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data && data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      geocodeCache[key] = coords;
      return coords;
    }
  } catch (e) {
    console.error(`[geocodeCity] Failed for "${cityName}":`, e.message);
  }
  return null;
}
