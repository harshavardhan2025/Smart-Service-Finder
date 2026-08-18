// Local geocoding fallback — used only when backend geo endpoint is unavailable
const LOCAL_GEO_DB = {
  "kakinada central area": { lat: 16.989062, lon: 82.243878 },
  "kakinada suburbs":      { lat: 16.955000, lon: 82.215000 },
  "kakinada":              { lat: 16.989062, lon: 82.243878 },
  "rajahmundry central area": { lat: 17.000538, lon: 81.804034 },
  "rajahmundry suburbs":      { lat: 17.035000, lon: 81.775000 },
  "rajahmundry":              { lat: 17.000538, lon: 81.804034 },
  "new delhi central area": { lat: 28.613939, lon: 77.209021 },
  "new delhi suburbs":      { lat: 28.575000, lon: 77.155000 },
  "new delhi":              { lat: 28.613939, lon: 77.209021 },
  "hyderabad central area": { lat: 17.385044, lon: 78.486671 },
  "hyderabad suburbs":      { lat: 17.415000, lon: 78.435000 },
  "hyderabad":              { lat: 17.385044, lon: 78.486671 },
  "kadapa central area": { lat: 14.471306, lon: 78.824165 },
  "kadapa suburbs":      { lat: 14.450000, lon: 78.800000 },
  "kadapa":              { lat: 14.471306, lon: 78.824165 },
  "danavaipeta":      { lat: 17.008400, lon: 81.792500 },
  "main road":        { lat: 16.979800, lon: 82.242500 },
  "bommarillu":       { lat: 17.012000, lon: 81.798000 },
  "rtc complex":      { lat: 16.984030, lon: 82.239840 },
  "pushkar ghat":     { lat: 16.995000, lon: 81.776000 },
  "suryaraopeta":     { lat: 16.986500, lon: 82.238900 },
  "lala cheruvu":     { lat: 17.025000, lon: 81.821000 },
  "bhanugudi junction": { lat: 16.980120, lon: 82.235670 },
  "jagannaickpur":    { lat: 16.968000, lon: 82.245000 },
  "kovvur sub":       { lat: 17.021000, lon: 81.728000 },
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function geocodeCityLocal(cityName) {
  if (!cityName) return null;
  const key = cityName.toLowerCase().trim();
  if (LOCAL_GEO_DB[key]) return LOCAL_GEO_DB[key];
  const match = Object.keys(LOCAL_GEO_DB).find(k => key.includes(k) || k.includes(key));
  return match ? LOCAL_GEO_DB[match] : null;
}

let cachedAllWorkers = null;
let lastFetchTime = 0;
let fetchPromise = null;
const CACHE_TTL = 10000;

export const fetchAllWorkersCached = async () => {
  const now = Date.now();
  if (cachedAllWorkers && now - lastFetchTime < CACHE_TTL) return cachedAllWorkers;
  if (fetchPromise) return cachedAllWorkers || fetchPromise;

  fetchPromise = (async () => {
    try {
      const resp = await fetch("/api/workers");
      if (resp.ok) {
        const data = await resp.json();
        cachedAllWorkers = data.filter(w => w.status === "Active");
        lastFetchTime = Date.now();
      }
    } catch (e) {
      console.error("Failed to fetch all workers", e);
    } finally {
      fetchPromise = null;
    }
    return cachedAllWorkers || [];
  })();

  return cachedAllWorkers || fetchPromise;
};

const filterCache = new Map();
const pendingRequests = new Map();

export const filterWorkersClientSide = async (userCoords, locationKey) => {
  const cacheKey = userCoords?.lat && userCoords?.lng
    ? `nearby:${userCoords.lat}:${userCoords.lng}`
    : `city:${locationKey || ''}`;

  if (pendingRequests.has(cacheKey)) return pendingRequests.get(cacheKey);

  const cached = filterCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 15000) return cached.data;

  const promise = (async () => {
    try {
      if (userCoords?.lat && userCoords?.lng) {
        const resp = await fetch(`/api/workers/nearby?lat=${userCoords.lat}&lng=${userCoords.lng}&radius=40&city=${encodeURIComponent(locationKey || '')}`);
        if (resp.ok) {
          const data = await resp.json();
          filterCache.set(cacheKey, { data, timestamp: Date.now() });
          return data;
        }
      } else if (locationKey) {
        const resp = await fetch(`/api/workers?city=${encodeURIComponent(locationKey)}`);
        if (resp.ok) {
          const data = await resp.json();
          filterCache.set(cacheKey, { data, timestamp: Date.now() });
          return data;
        }
      }
    } catch (e) {
      console.error("Failed to query nearby workers:", e);
    }

    // Client-side fallback when backend is unreachable
    const allWorkers = await fetchAllWorkersCached();
    let result = allWorkers;

    if (userCoords) {
      result = allWorkers
        .map(w => {
          const coords = geocodeCityLocal(w.location) || geocodeCityLocal(w.city);
          if (!coords) return null;
          return { ...w, distanceKm: Math.round(haversineKm(userCoords.lat, userCoords.lng, coords.lat, coords.lon) * 10) / 10 };
        })
        .filter(w => w && w.distanceKm <= 40)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (locationKey) {
      const key = locationKey.toLowerCase().trim();
      result = allWorkers.filter(w => {
        const wCity = (w.city || "").toLowerCase().trim();
        const wLoc  = (w.location || "").toLowerCase().trim();
        return wCity.includes(key) || key.includes(wCity) || wLoc.includes(key) || key.includes(wLoc);
      });
    }

    filterCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  })();

  pendingRequests.set(cacheKey, promise);
  promise.finally(() => pendingRequests.delete(cacheKey));
  return promise;
};
