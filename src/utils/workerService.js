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
  const fuzzyMatch = Object.keys(LOCAL_GEO_DB).find(
    (k) => key.includes(k) || k.includes(key)
  );
  if (fuzzyMatch) return LOCAL_GEO_DB[fuzzyMatch];
  return null;
}

let cachedAllWorkers = null;
let lastFetchTime = 0;
let fetchPromise = null;
const CACHE_TTL = 10000; // 10 seconds cache validity

export const fetchAllWorkersCached = async () => {
  const now = Date.now();
  
  // If cache is fresh, return it instantly!
  if (cachedAllWorkers && (now - lastFetchTime < CACHE_TTL)) {
    return cachedAllWorkers;
  }
  
  // If there is already an ongoing request, return the cached version immediately (SWR) or await the promise
  if (fetchPromise) {
    if (cachedAllWorkers) return cachedAllWorkers; // Serve stale immediately
    return fetchPromise;
  }
  
  fetchPromise = new Promise(async (resolve) => {
    try {
      const resp = await fetch("/api/workers");
      if (resp.ok) {
        const data = await resp.json();
        cachedAllWorkers = data.filter(w => w.status === "Active");
        lastFetchTime = Date.now();
        resolve(cachedAllWorkers);
      } else {
        resolve(cachedAllWorkers || []);
      }
    } catch (e) {
      console.error("Failed to fetch all workers", e);
      resolve(cachedAllWorkers || []);
    } finally {
      fetchPromise = null;
    }
  });
  
  // Stale-While-Revalidate: Return stale cache instantly if available while revalidation runs in the background
  if (cachedAllWorkers) {
    return cachedAllWorkers;
  }
  
  return fetchPromise;
};

export const filterWorkersClientSide = async (userCoords, locationKey) => {
  const allWorkers = await fetchAllWorkersCached();
  
  if (userCoords) {
    // Perform coordinate-based 40km matching client-side instantly!
    const results = allWorkers.map(w => {
      let coords = null;
      if (w.location) {
        coords = geocodeCityLocal(w.location);
      }
      if (!coords && w.city) {
        coords = geocodeCityLocal(w.city);
      }
      if (!coords) return null;

      const distance = haversineKm(userCoords.lat, userCoords.lng, coords.lat, coords.lon);
      return { ...w, distanceKm: Math.round(distance * 10) / 10 };
    })
    .filter(w => w !== null && w.distanceKm <= 40)
    .sort((a, b) => a.distanceKm - b.distanceKm);
    
    return results;
  } else if (locationKey) {
    const key = locationKey.toLowerCase().trim();
    // Perform exact/fuzzy city match client-side instantly!
    return allWorkers.filter(w => {
      const wCity = w.city ? w.city.toLowerCase().trim() : "";
      const wLoc = w.location ? w.location.toLowerCase().trim() : "";
      return wCity.includes(key) || key.includes(wCity) || wLoc.includes(key) || key.includes(wLoc);
    });
  }
  
  return allWorkers;
};
