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

/**
 * Geocode any location string → { lat, lon, label, city }
 * Uses Photon (photon.komoot.io) — worldwide OSM-based, no API key, no rate blocks.
 * Returns null if nothing is found.
 */
const geocodeCache = {};

export async function geocodeCity(location) {
  const key = location.toLowerCase().trim();
  if (geocodeCache[key]) return geocodeCache[key];

  // Try Primary Provider: Photon (OSM-based Komoot API)
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

  // Try Backup Provider: Nominatim (Official OpenStreetMap search API) for real location mapping
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

  // 🏛️ SMART OFFLINE FALLBACK: Preset coordinate mapper for key application cities!
  // This executes ONLY as an offline safety-net if both real-world APIs fail or time out (e.g. inside network-restricted sandboxes).
  const lowerQuery = key;
  let localMatch = null;
  if (lowerQuery.includes("kakinada")) {
    localMatch = { lat: 16.98906, lon: 82.24747, city: "Kakinada", label: "Kakinada, Andhra Pradesh, India" };
  } else if (lowerQuery.includes("rajahmundry")) {
    localMatch = { lat: 17.00053, lon: 81.80403, city: "Rajahmundry", label: "Rajahmundry, Andhra Pradesh, India" };
  } else if (lowerQuery.includes("delhi")) {
    localMatch = { lat: 28.6139, lon: 77.2090, city: "New Delhi", label: "New Delhi, Delhi, India" };
  } else if (lowerQuery.includes("hyderabad")) {
    localMatch = { lat: 17.3850, lon: 78.4867, city: "Hyderabad", label: "Hyderabad, Telangana, India" };
  } else if (lowerQuery.includes("kadapa")) {
    localMatch = { lat: 14.4673, lon: 78.8242, city: "Kadapa", label: "Kadapa, Andhra Pradesh, India" };
  }

  if (localMatch) {
    geocodeCache[key] = localMatch;
    return localMatch;
  }

  return null;
}
