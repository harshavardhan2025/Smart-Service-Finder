/**
 * Location-based price multipliers.
 * Keys are lowercase city names. Values are multipliers applied to the
 * service's base price when a worker registers in that city.
 *
 * Metro/high-cost cities  → above 1.0
 * Tier-2 cities           → 1.0  (baseline)
 * Smaller towns           → below 1.0
 */
export const CITY_PRICE_MULTIPLIERS = {
  // Metro
  "new delhi": 1.5,
  "delhi": 1.5,
  "mumbai": 1.5,
  "bangalore": 1.4,
  "bengaluru": 1.4,
  "chennai": 1.35,
  "kolkata": 1.3,
  "hyderabad": 1.3,
  "secunderabad": 1.3,
  "pune": 1.25,
  "ahmedabad": 1.2,
  // Tier-2
  "kakinada": 1.0,
  "rajahmundry": 1.0,
  "vijayawada": 1.05,
  "visakhapatnam": 1.1,
  "vizag": 1.1,
  "guntur": 0.95,
  "tirupati": 0.95,
  "nellore": 0.9,
  // Smaller towns
  "kadapa": 0.85,
  "kurnool": 0.85,
  "anantapur": 0.8,
  "eluru": 0.85,
  "ongole": 0.8,
  "srikakulam": 0.8,
};

/**
 * Returns the price multiplier for a given city string.
 * Falls back to 1.0 for unknown cities.
 */
export function getPriceMultiplier(city = "") {
  const key = city.toLowerCase().trim();
  // Try exact match first, then partial match
  if (CITY_PRICE_MULTIPLIERS[key] !== undefined) return CITY_PRICE_MULTIPLIERS[key];
  const partialKey = Object.keys(CITY_PRICE_MULTIPLIERS).find(k => key.includes(k) || k.includes(key));
  return partialKey ? CITY_PRICE_MULTIPLIERS[partialKey] : 1.0;
}

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

// Preset coordinates for key cities and seeded locations to allow instant 0ms write-time geocoding
export const PRESET_CITY_COORDS = {
  "kakinada": { lat: 16.98906, lon: 82.24747, city: "Kakinada", label: "Kakinada, Andhra Pradesh, India" },
  "bhanugudi junction": { lat: 16.98012, lon: 82.23567, city: "Kakinada", label: "Bhanugudi Junction, Kakinada, Andhra Pradesh, India" },
  "kakinada central area": { lat: 16.989062, lon: 82.243878, city: "Kakinada", label: "Kakinada Central Area, Andhra Pradesh, India" },
  "kakinada suburbs": { lat: 16.955000, lon: 82.215000, city: "Kakinada", label: "Kakinada Suburbs, Andhra Pradesh, India" },
  
  "rajahmundry": { lat: 17.00053, lon: 81.80403, city: "Rajahmundry", label: "Rajahmundry, Andhra Pradesh, India" },
  "danavaipeta": { lat: 17.00840, lon: 81.79250, city: "Rajahmundry", label: "Danavaipeta, Rajahmundry, Andhra Pradesh, India" },
  "rajahmundry central area": { lat: 17.000538, lon: 81.804034, city: "Rajahmundry", label: "Rajahmundry Central Area, Andhra Pradesh, India" },
  "rajahmundry suburbs": { lat: 17.035000, lon: 81.775000, city: "Rajahmundry", label: "Rajahmundry Suburbs, Andhra Pradesh, India" },
  "danavaipetta": { lat: 17.00840, lon: 81.79250, city: "Rajahmundry", label: "Danavaipeta, Rajahmundry, Andhra Pradesh, India" },
  
  "delhi": { lat: 28.6139, lon: 77.2090, city: "New Delhi", label: "New Delhi, Delhi, India" },
  "new delhi": { lat: 28.6139, lon: 77.2090, city: "New Delhi", label: "New Delhi, Delhi, India" },
  "new delhi central area": { lat: 28.613939, lon: 77.209021, city: "New Delhi", label: "New Delhi Central Area, Delhi, India" },
  "new delhi suburbs": { lat: 28.575000, lon: 77.155000, city: "New Delhi", label: "New Delhi Suburbs, Delhi, India" },
  
  "hyderabad": { lat: 17.3850, lon: 78.4867, city: "Hyderabad", label: "Hyderabad, Telangana, India" },
  "hyderabad central area": { lat: 17.385044, lon: 78.486671, city: "Hyderabad", label: "Hyderabad Central Area, Telangana, India" },
  "hyderabad suburbs": { lat: 17.415000, lon: 78.435000, city: "Hyderabad", label: "Hyderabad Suburbs, Telangana, India" },
  
  "kadapa": { lat: 14.4673, lon: 78.8242, city: "Kadapa", label: "Kadapa, Andhra Pradesh, India" },
  "kadapa central area": { lat: 14.471306, lon: 78.824165, city: "Kadapa", label: "Kadapa Central Area, Andhra Pradesh, India" },
  "kadapa suburbs": { lat: 14.450000, lon: 78.800000, city: "Kadapa", label: "Kadapa Suburbs, Andhra Pradesh, India" },
  
  "mumbai": { lat: 19.0760, lon: 72.8777, city: "Mumbai", label: "Mumbai, Maharashtra, India" },
  "bangalore": { lat: 12.9716, lon: 77.5946, city: "Bengaluru", label: "Bengaluru, Karnataka, India" },
  "bengaluru": { lat: 12.9716, lon: 77.5946, city: "Bengaluru", label: "Bengaluru, Karnataka, India" },
  "chennai": { lat: 13.0827, lon: 80.2707, city: "Chennai", label: "Chennai, Tamil Nadu, India" },
  "kolkata": { lat: 22.5726, lon: 88.3639, city: "Kolkata", label: "Kolkata, West Bengal, India" },
  "pune": { lat: 18.5204, lon: 73.8567, city: "Pune", label: "Pune, Maharashtra, India" },
  "ahmedabad": { lat: 23.0225, lon: 72.5714, city: "Ahmedabad", label: "Ahmedabad, Gujarat, India" },
  "vijayawada": { lat: 16.5062, lon: 80.6480, city: "Vijayawada", label: "Vijayawada, Andhra Pradesh, India" },
  "visakhapatnam": { lat: 17.6868, lon: 83.2185, city: "Visakhapatnam", label: "Visakhapatnam, Andhra Pradesh, India" },
  "vizag": { lat: 17.6868, lon: 83.2185, city: "Visakhapatnam", label: "Visakhapatnam, Andhra Pradesh, India" },
  "guntur": { lat: 16.3067, lon: 80.4365, city: "Guntur", label: "Guntur, Andhra Pradesh, India" },
  "tirupati": { lat: 13.6288, lon: 79.4192, city: "Tirupati", label: "Tirupati, Andhra Pradesh, India" },
  "nellore": { lat: 14.4426, lon: 79.9865, city: "Nellore", label: "Nellore, Andhra Pradesh, India" },
  "kurnool": { lat: 15.8281, lon: 78.0373, city: "Kurnool", label: "Kurnool, Andhra Pradesh, India" },
  "anantapur": { lat: 14.6819, lon: 77.6006, city: "Anantapur", label: "Anantapur, Andhra Pradesh, India" },
  "eluru": { lat: 16.7107, lon: 81.1018, city: "Eluru", label: "Eluru, Andhra Pradesh, India" },
  "ongole": { lat: 15.5057, lon: 80.0499, city: "Ongole", label: "Ongole, Andhra Pradesh, India" },
  "srikakulam": { lat: 18.3019, lon: 83.8967, city: "Srikakulam", label: "Srikakulam, Andhra Pradesh, India" },

  // Seeded location strings
  "kovvur": { lat: 17.0210, lon: 81.7280, city: "Kovvur", label: "Kovvur, Andhra Pradesh, India" },
  "dowleswaram": { lat: 16.9500, lon: 81.7800, city: "Dowleswaram", label: "Dowleswaram, Andhra Pradesh, India" },
  "diwancheruvu": { lat: 17.0700, lon: 81.8500, city: "Diwancheruvu", label: "Diwancheruvu, Andhra Pradesh, India" },
  "hukumpeeta": { lat: 17.0200, lon: 81.8100, city: "Hukumpeeta", label: "Hukumpeeta, Andhra Pradesh, India" },
  "kadiam": { lat: 16.9200, lon: 81.8200, city: "Kadiam", label: "Kadiam, Andhra Pradesh, India" },
  "morampudi": { lat: 17.0100, lon: 81.7900, city: "Morampudi", label: "Morampudi, Andhra Pradesh, India" },
  "bomuru": { lat: 16.9700, lon: 81.8200, city: "Bomuru", label: "Bomuru, Andhra Pradesh, India" },
  "lalacheruvu": { lat: 17.0250, lon: 81.8210, city: "Lalacheruvu", label: "Lalacheruvu, Andhra Pradesh, India" },
  "lala cheruvu": { lat: 17.0250, lon: 81.8210, city: "Lala Cheruvu, Rajahmundry, Andhra Pradesh, India" },
  "pidimgoyyi": { lat: 17.0200, lon: 81.8400, city: "Pidimgoyyi", label: "Pidimgoyyi, Andhra Pradesh, India" },
  "samalkot": { lat: 17.0500, lon: 82.2400, city: "Samalkot", label: "Samalkot, Andhra Pradesh, India" },
  "peddapuram": { lat: 17.0800, lon: 82.1700, city: "Peddapuram", label: "Peddapuram, Andhra Pradesh, India" },
  "pithapuram": { lat: 17.1100, lon: 82.2600, city: "Pithapuram", label: "Pithapuram, Andhra Pradesh, India" },
  "karanampetta": { lat: 16.9900, lon: 82.2200, city: "Karanampetta", label: "Karanampetta, Andhra Pradesh, India" },
  "sarpavaram": { lat: 17.0100, lon: 82.2400, city: "Sarpavaram", label: "Sarpavaram, Andhra Pradesh, India" },
  "chollangi": { lat: 16.9400, lon: 82.2600, city: "Chollangi", label: "Chollangi, Andhra Pradesh, India" },
  "ramanayyapeta": { lat: 16.9900, lon: 82.2500, city: "Ramanayyapeta", label: "Ramanayyapeta, Andhra Pradesh, India" },
  "turangi": { lat: 16.9600, lon: 82.2500, city: "Turangi", label: "Turangi, Andhra Pradesh, India" },
  "yanam": { lat: 16.7300, lon: 82.2100, city: "Yanam", label: "Yanam, Puducherry, India" },
  
  "noida": { lat: 28.5355, lon: 77.3910, city: "Noida", label: "Noida, Uttar Pradesh, India" },
  "gurugram": { lat: 28.4595, lon: 77.0266, city: "Gurugram", label: "Gurugram, Haryana, India" },
  "ghaziabad": { lat: 28.6692, lon: 77.4538, city: "Ghaziabad", label: "Ghaziabad, Uttar Pradesh, India" },
  "faridabad": { lat: 28.4089, lon: 77.3178, city: "Faridabad", label: "Faridabad, Haryana, India" },
  "dwarka": { lat: 28.5823, lon: 77.0500, city: "New Delhi", label: "Dwarka, New Delhi, Delhi, India" },
  "rohini": { lat: 28.7495, lon: 77.1200, city: "New Delhi", label: "Rohini, New Delhi, Delhi, India" },
  "saket": { lat: 28.5244, lon: 77.2066, city: "New Delhi", label: "Saket, New Delhi, Delhi, India" },
  "vasant kunj": { lat: 28.5293, lon: 77.1528, city: "New Delhi", label: "Vasant Kunj, New Delhi, Delhi, India" },
  "connaught place": { lat: 28.6304, lon: 77.2177, city: "New Delhi", label: "Connaught Place, New Delhi, Delhi, India" },
  "karol bagh": { lat: 28.6444, lon: 77.1873, city: "New Delhi", label: "Karol Bagh, New Delhi, Delhi, India" },
  
  "gachibowli": { lat: 17.4401, lon: 78.3489, city: "Hyderabad", label: "Gachibowli, Hyderabad, Telangana, India" },
  "hitech city": { lat: 17.4435, lon: 78.3773, city: "Hyderabad", label: "Hitech City, Hyderabad, Telangana, India" },
  "madhapur": { lat: 17.4483, lon: 78.3915, city: "Hyderabad", label: "Madhapur, Hyderabad, Telangana, India" },
  "kondapur": { lat: 17.4622, lon: 78.3568, city: "Hyderabad", label: "Kondapur, Hyderabad, Telangana, India" },
  "kukatpally": { lat: 17.4875, lon: 78.3953, city: "Hyderabad", label: "Kukatpally, Hyderabad, Telangana, India" },
  "begumpet": { lat: 17.4448, lon: 78.4608, city: "Hyderabad", label: "Begumpet, Hyderabad, Telangana, India" },
  "banjara hills": { lat: 17.4156, lon: 78.4347, city: "Hyderabad", label: "Banjara Hills, Hyderabad, Telangana, India" },
  "jubilee hills": { lat: 17.4325, lon: 78.4071, city: "Hyderabad", label: "Jubilee Hills, Hyderabad, Telangana, India" },

  // Additional seeded local strings
  "bommarillu": { lat: 17.0120, lon: 81.7980, city: "Rajahmundry", label: "Bommarillu, Rajahmundry, Andhra Pradesh, India" },
  "rtc complex": { lat: 16.984030, lon: 82.239840, city: "Kakinada", label: "RTC Complex, Kakinada, Andhra Pradesh, India" },
  "pushkar ghat": { lat: 16.995000, lon: 81.776000, city: "Rajahmundry", label: "Pushkar Ghat, Rajahmundry, Andhra Pradesh, India" },
  "suryaraopeta": { lat: 16.986500, lon: 82.238900, city: "Kakinada", label: "Suryaraopeta, Kakinada, Andhra Pradesh, India" },
  "jagannaickpur": { lat: 16.968000, lon: 82.245000, city: "Kakinada", label: "Jagannaickpur, Kakinada, Andhra Pradesh, India" }
};

/**
 * Resolves coordinate presets for key application cities and seeded locations.
 * Uses exact segment-based parsing and regex word boundary matching to ensure 
 * 100% precision and avoid false positives across compound location queries.
 * 
 * @param {string} location - The raw search or location string.
 * @returns {Object|null} The preset coordinate object {lat, lon, city, label} or null.
 */
export function geocodePreset(location = "") {
  if (!location) return null;
  
  const normalized = location.toLowerCase().trim();
  
  // 1. Direct, high-precision exact match
  if (PRESET_CITY_COORDS[normalized]) {
    return PRESET_CITY_COORDS[normalized];
  }

  // 2. Segment-based parsing (splitting address segments right-to-left)
  const segments = normalized
    .split(/[,;\-\(\)\s]+/)
    .map(s => s.trim())
    .filter(Boolean);

  // Check segments starting from the most general rightmost component (usually the city name)
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    if (PRESET_CITY_COORDS[segment]) {
      return PRESET_CITY_COORDS[segment];
    }
  }

  // 3. Word-boundary regex matching to prevent sub-string false-positives
  for (const [key, value] of Object.entries(PRESET_CITY_COORDS)) {
    const regex = new RegExp(`\\b${key}\\b`, "i");
    if (regex.test(normalized)) {
      return value;
    }
  }

  return null;
}

const geocodeCache = {};

/**
 * Geocode any location string → { lat, lon, label, city }
 * Priority: 0ms Presets Lookup → Live Photon OSM API → Live Nominatim Backup API
 * Returns null if nothing is found.
 */
export async function geocodeCity(location) {
  if (!location) return null;
  const key = location.toLowerCase().trim();
  if (geocodeCache[key]) return geocodeCache[key];

  // 1. Try dynamic preset lookup first for instant 0ms resolution
  const preset = geocodePreset(location);
  if (preset) {
    geocodeCache[key] = preset;
    return preset;
  }

  // 2. Try Primary Provider: Photon (OSM-based Komoot API)
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(location)}&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) }); // Fast 3s timeout to prevent backend choke when offline

    if (res.ok) {
      const data = await res.json();
      const features = data?.features;
      if (features && features.length > 0) {
        const f = features[0];
        const [lon, lat] = f.geometry.coordinates;
        const p = f.properties;
        const city = p.city || p.town || p.village || p.county || p.name || location;
        const label = [p.name, p.city || p.town || p.village, p.state, p.country]
          .filter(Boolean).join(", ");

        const result = { lat, lon, label, city };
        geocodeCache[key] = result;
        return result;
      }
    }
  } catch (err) {
    console.error("[geocodeCity] Photon geocode failed, trying Nominatim fallback:", err.message);
  }

  // 3. Try Backup Provider: Nominatim (Official OpenStreetMap search API) for real location mapping
  try {
    const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(fallbackUrl, {
      headers: {
        "User-Agent": "SmartServiceFinder/1.0 (harshavardhan2025/Smart-Service-Finder)"
      },
      signal: AbortSignal.timeout(3000) // Fast 3s timeout
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const label = item.display_name;
        const city = item.address?.city || item.address?.town || item.address?.village || item.address?.county || location;

        const result = { lat, lon, label, city };
        geocodeCache[key] = result;
        return result;
      }
    }
  } catch (err) {
    console.error("[geocodeCity] Nominatim fallback geocode also failed:", err.message);
  }

  return null;
}
