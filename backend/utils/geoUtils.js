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

/**
 * Geocode a city/address string to { lat, lon } using Nominatim.
 * Returns null on failure.
 */
export async function geocodeCity(cityName) {
  const key = cityName.toLowerCase().trim();
  if (geocodeCache[key]) return geocodeCache[key];

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
