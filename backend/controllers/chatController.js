import crypto from "crypto";
import mongoose from "mongoose";
import Worker from "../models/Worker.js";
import Message from "../models/Message.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Offer from "../models/Offer.js";
import Plan from "../models/Plan.js";

// Levenshtein distance algorithm for robust character-level spelling correction
const levenshtein = (a, b) => {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
};

// Mathematically optimized search matching engine using scaled Levenshtein distances and stop-words filters
export const findBestServiceMatch = (queryText) => {
  const qLower = queryText.toLowerCase();

  const servicesList = [
    { name: "Plumbing", keywords: ["plumber", "pluber", "leak", "pipe", "tap", "sink", "toilet", "drain", "clog", "water line", "faucet", "shower", "basin", "clogged", "leakage", "washbasin", "overflow", "flush", "burst", "pressure", "blockage", "grouting", "plumbing", "spigot", "valve", "trap", "sump pump", "hose", "sprinkler", "fixture"] },
    { name: "Electrical", keywords: ["electrician", "electrican", "wire", "switch", "fuse", "fan", "light", "current", "power", "short circuit", "spark", "bulb", "socket", "meter", "shock", "tripping", "mcb", "wiring", "blackout", "installation", "breaker", "grounding", "outlet", "voltage", "conduit", "phase", "choke", "holder", "regulator", "mainboard"] },
    { name: "Carpentry", keywords: ["carpenter", "wood", "door", "chair", "sofa", "furniture", "table", "wooden", "wardrobe", "cabinet", "latch", "lock", "handle", "hinge", "drawer", "bed", "woodwork", "almirah", "repair", "plywood", "laminate", "veneer", "framing", "cushion", "re-upholstery", "creak", "squeak", "slide", "fitting", "bolt"] },
    { name: "AC Repair", keywords: ["ac", "air conditioner", "cooling", "coolng", "cool", "condenser", "compressor", "heating", "servicing", "gas fill", "remote", "leak", "noise", "filter", "hvac", "ventilation", "split ac", "window ac", "duct", "blower", "coil", "thermostat", "freon", "inverter ac", "odour", "chilling", "fan speed", "ac install", "ac gas", "ac service"] },
    { name: "Washing Machine", keywords: ["washing machine", "washer", "dryer", "laundry", "wash", "spin cycle", "not draining", "drum", "fully automatic", "semi automatic", "front load", "top load", "vibration", "noise", "error code", "water inlet", "drain hose", "motor", "belt", "lid", "agitator", "tub", "rinse", "detergent dispenser", "leakage", "door lock", "washing", "appliance", "circuit board", "dry"] },
    { name: "Geyser", keywords: ["geyser", "heater", "hot water", "boiler", "thermostat", "heating element", "electric geyser", "gas geyser", "water heater", "geyser shock", "no hot water", "overheating", "pressure valve", "leakage", "geyser repair", "geyser install", "tank leak", "rust water", "slow heating", "tripping", "pilot light", "ignition", "burner", "coil", "thermo", "geyser noise", "water pipe", "power cord", "indicator", "reset button"] },
    { name: "Grinder", keywords: ["grinder", "grind", "wet grinder", "jar", "blade", "grinding", "motor", "coupler", "stone", "carbon brush", "switch", "noise", "jammed", "spindle", "belt", "drum", "ventilation", "overload", "reset", "lid", "shaft", "winding", "cord", "washer", "gasket", "bush", "speed", "vibration", "body", "leakage"] },
    { name: "Mixer", keywords: ["mixer", "juicer", "blender", "mixie", "mixer grinder", "jar", "blade", "coupler", "motor", "speed control", "overload protector", "noise", "smoke", "jammed", "gasket", "lid", "jar leak", "carbon brush", "whipping", "puree", "grinding", "liquidizing", "chutney jar", "dry grinding", "wet grinding", "switch", "knob", "coupling", "base", "vibration"] },
    { name: "Refrigerator", keywords: ["fridge", "refrigerator", "freezer", "cool", "double door", "single door", "compressor", "gas leak", "not cooling", "food spoiling", "defrost", "ice maker", "gasket", "door seal", "thermostat", "fan", "noise", "water leaking", "bulb", "tray", "shelf", "condenser coil", "evaporator", "refrigerant", "coolant", "gas charging", "overheating", "stabilizer", "frost", "inverter fridge"] },
    { name: "Water Purifier", keywords: ["purifier", "filter", "ro", "water taste", "alkaline", "ro service", "kent", "aquaguard", "uv", "uf", "tds", "membrane", "pre-filter", "carbon filter", "sediment", "pump", "adapter", "water dripping", "tank cleaning", "smell", "purification", "alkaline filter", "mineral", "flow restrictor", "auto cut", "solenoid valve", "service", "installation", "water pressure", "cartridge"] },
    { name: "House Cleaning", keywords: ["cleaning", "clean", "maid", "sweep", "house clean", "deep clean", "vacuum", "kitchen", "bathroom", "sofa cleaning", "dusting", "carpet", "disinfection", "pest", "cobweb", "window pane", "balcony", "wardrobe clean", "closet organizing", "scrubbing", "sanitization", "curtain cleaning", "mattress cleaning", "stain removal", "odor control", "chimney cleaning", "tiles cleaning", "garbage disposal", "dust", "broom"] },
    { name: "Floor cleaning", keywords: ["floor clean", "mop", "scrub", "floor", "marble polishing", "tiles cleaning", "scrubbing", "floor polish", "grout clean", "granite polish", "floor washing", "sweeping", "floor waxing", "stain removal", "acid wash", "wooden floor care", "terrazzo", "mop bucket", "floor machine", "disinfectant", "dirt", "mud", "spill", "floor shine", "buffing", "sealant", "epoxy floor", "laminate", "vinyl floor", "restoration"] },
    { name: "Utensils Cleaning", keywords: ["utensil", "dish", "plate", "pot", "dishwashing", "vessels", "sink cleaning", "scrubbing", "dishwasher", "grease removal", "burnt pot", "glassware", "cutlery", "washing dishes", "pan", "cookware", "silver cleaning", "copper polish", "utensil cleaner", "soap", "sponge", "rinse", "stain", "oil", "food residue", "daily helper", "maid", "sink", "tap", "rack"] },
    { name: "Wall Putty Coating", keywords: ["putty", "coating", "wall putty", "wall", "birla putty", "jk putty", "smooth walls", "dampness", "patch work", "crack filling", "sanding", "primer preparation", "interior putty", "exterior putty", "acrylic putty", "wall repair", "peeling paint", "moisture barrier", "putty blade", "base coat", "wall leveling", "plaster", "drywall", "gypsum", "finishing", "cement putty", "texture base", "scraping", "wall prep", "surface"] },
    { name: "Interior Painting", keywords: ["paint", "interior", "indoor paint", "room paint", "wall", "color", "brush", "roller", "distemper", "primer", "asian paints", "wall painting", "home painting", "bedroom paint", "emulsion", "royale", "tractor emulsion", "ceiling paint", "stencil", "accent wall", "living room", "kitchen paint", "washable paint", "texture", "sheen", "matte finish", "glossy", "painter", "painting service", "color consultation"] },
    { name: "Exterior Painting", keywords: ["exterior paint", "outdoor paint", "building paint", "weatherproof", "asian paints", "outside walls", "apex", "ultima", "waterproof paint", "fungus resistant", "crack bridging", "elevation painting", "gate painting", "grill paint", "texture exterior", "primer exterior", "rain protection", "sun protection", "scaffolding", "pressure washing", "facade", "wall coat", "damp proof", "exterior walls", "terrace paint", "boundary wall", "acrylic emulsion", "weathercoat", "painting", "exterior"] },
    { name: "Texture & Designer Finishers", keywords: ["texture", "designer finish", "wall art", "finish", "design", "textured paint", "royal play", "stencil", "accent wall", "metallic texture", "non-metallic texture", "spatula finish", "rustic finish", "crackle effect", "canvas painting", "wood grain finish", "marble effect", "plaster texture", "designer wallpaper", "custom mural", "glitter finish", "velvet finish", "sand texture", "swirl pattern", "comb texture", "slapbrush", "knockdown", "pop design", "ceiling border", "paneling"] },
    { name: "Wallpaper Installation", keywords: ["wallpaper", "wall paper", "wall sticker", "decal", "vinyl wallpaper", "pasting", "wallpaper roll", "custom wallpaper", "3d wallpaper", "wallpaper removal", "peel and stick", "wallpaper adhesive", "glue", "bubble removal", "seamless installation", "pattern matching", "non-woven wallpaper", "fabric wallpaper", "kids room wallpaper", "living room wall", "borders", "trimming", "wall prep", "accent wall", "textured wallpaper", "damp check", "installer", "paperhanging", "decals", "stickers"] },
    { name: "Wood Polishing", keywords: ["wood polish", "polish", "varnish", "wood", "pu polish", "french polish", "furniture polish", "melamine", "spirit polish", "sanding", "wood staining", "teak wood", "rosewood", "dining table polish", "sofa polishing", "door polishing", "wardrobe polish", "matte polish", "glossy polish", "wood sealer", "wax polish", "restoration", "furniture painting", "scratch removal", "wood filler", "grain filler", "polyurethane", "lacquer", "laminate polish", "antique finish"] },
    { name: "Two-Wheeler (Bikes)", keywords: ["bike", "motorcycle", "scooter", "two-wheeler", "puncture", "repair", "mechanic", "engine", "brake", "oil change", "chain lock", "starting trouble", "activa", "pulsar", "scooty", "clutch", "accelerator", "spark plug", "battery check", "wiring", "indicator", "headlight", "tyre replacement", "shock absorber", "air filter", "carburetor", "tuning", "mileage check", "general service", "breakdown"] },
    { name: "Four-Wheeler (Cars)", keywords: ["car", "automobile", "mechanic", "four-wheeler", "puncture", "repair", "engine", "brake", "denting", "painting", "wheel alignment", "clutch", "breakdown", "car ac", "radiator", "suspension", "battery replacement", "self starter", "alternator", "bumper repair", "windshield", "gearbox", "engine oil", "coolant", "silencer", "wiper", "headlight alignment", "car service", "diagnostics", "roadside assistance"] },
    { name: "Others (Heavy)", keywords: ["tractor", "crane", "heavy mech", "truck", "heavy", "jcb", "lorry", "commercial vehicle", "loader", "dumper", "excavator", "heavy engine", "hydraulic leak", "heavy vehicle brake", "road roller", "forklift", "generator repair", "diesel engine", "transmission", "leaf spring", "axle", "chassis", "pneumatic system", "heavy duty clutch", "towing", "heavy machinery", "harvester", "truck mechanic", "crane operator", "greasing"] },
    { name: "Bike Wash", keywords: ["bike wash", "scooter wash", "wash", "bike cleaning", "water wash", "foam wash", "chain cleaning", "chain lubrication", "polish bike", "detailing bike", "mud removal", "wheel cleaning", "engine wash", "high pressure wash", "dry wash", "matte bike polish", "body wax", "bike spa", "scooty cleaning", "quick wash", "rust removal", "spoke cleaning", "seat cleaning", "washing", "shampoo", "scrubbing", "air dry", "microfiber", "bike care", "gloss wash"] },
    { name: "Car Wash", keywords: ["car wash", "car vacuum", "wash", "interior cleaning", "foam wash", "car cleaning", "detailing", "exterior wash", "underbody wash", "dashboard polish", "seat dry cleaning", "carpet vacuuming", "tyre polish", "glass cleaning", "wax coating", "ceramic wash", "steam cleaning", "rubbing rubbing", "car polish", "odor removal", "car spa", "washing", "water wash", "pressure washer", "microfiber wipe", "mud flap cleaning", "roof cleaning", "trunk cleaning", "engine bay wash", "detailing studio"] },
    { name: "Photography", keywords: ["photo", "video", "shoot", "camera", "wedding shoot", "wedding", "marriage", "party", "event", "photographer", "videographer", "pre-wedding", "birthday photography", "candid", "maternity shoot", "baby photoshoot", "drone shoot", "cinematography", "album design", "photo editing", "videography", "event coverage", "studio", "outdoor shoot", "portrait", "product shoot", "fashion photography", "model portfolio", "framing", "high-resolution"] },
    { name: "Purohit", keywords: ["priest", "pandit", "pooja", "purohit", "havan", "homam", "satyanarayana", "marriage priest", "griha pravesh", "house warming", "naming ceremony", "engagement pooja", "shraddham", "ganapathi pooja", "rudrabhishek", "vastu pooja", "panditji", "sloka", "mantra", "astrology", "horoscope", "kundali", "hindu ritual", "festival pooja", "diwali pooja", "office opening", "pooja samagri", "sankalpam", "puja", "purohitudu"] },
    { name: "Decor", keywords: ["decor", "balloon", "flower decoration", "stage", "flower", "decoration", "birthday decor", "party decorator", "wedding decor", "reception stage", "haldi decor", "mehandi decor", "naming ceremony decor", "balloon arch", "backdrop", "led lighting", "flower garland", "theme decor", "cradle decoration", "entrance decor", "table centerpiece", "canopy setup", "drapes", "props", "corporate event decor", "anniversary decor", "party planner", "artificial flowers", "fresh flowers", "decoration items"] },
    { name: "Mehandi", keywords: ["mehandi", "henna", "bride", "wedding", "bridal mehandi", "arabic", "mehndi artist", "henna design", "marwari mehandi", "designer mehandi", "baby shower mehandi", "karwa chauth", "eid mehandi", "party mehandi", "engagement mehandi", "henna cone", "organic henna", "guest mehandi", "arabic fusion", "indian mehandi", "zardosi mehandi", "floral mehandi", "portraits mehandi", "mehandi functions", "bridal henna", "leg mehandi", "hand design", "henna paste", "mehndi", "mehendi"] },
    { name: "Makeup", keywords: ["makeup", "bridal makeup", "bride", "wedding", "makeup artist", "party makeup", "mac makeup", "hd makeup", "airbrush makeup", "engagement makeup", "reception look", "saree draping", "hair styling", "eyelashes", "makeup kit", "cosmetics", "groom makeup", "fashion makeup", "photoshoot makeup", "natural makeup", "dewy finish", "waterproof makeup", "kryolan", "draping", "eyebrows", "foundation", "lipstick", "eye shadow", "makeover", "beauty artist"] },
    { name: "Beauty, Salon & Spa", keywords: ["salon", "parlor", "beauty", "haircut", "facial", "spa", "nail", "grooming", "shave", "beard", "massage", "waxing", "threading", "pedicure", "manicure", "hair coloring", "bleach", "detan", "hair spa", "body massage", "head massage", "oil massage", "scrub", "eyebrow threading", "body waxing", "cleanup", "bridal glow", "hair straightening", "hair smoothening", "keratin"] },
    { name: "Doctors", keywords: ["doctor", "doctr", "medical", "consultation", "physician", "clinic", "sick", "health", "ill", "fever", "pain", "injury", "medicine", "cough", "cold", "flu", "hospital", "patient", "pediatrician", "cardiologist", "dermatologist", "orthopedic", "gynecologist", "fever consultation", "prescription", "general practitioner", "medical specialist", "stomach pain", "headache", "checkup"] }
  ];

  // Fast-path: Check direct substring occurrence of any keyword
  for (const service of servicesList) {
    for (const keyword of service.keywords) {
      if (qLower.includes(keyword)) {
        return service.name;
      }
    }
  }

  const stopWords = new Set([
    "need", "want", "have", "with", "this", "that", "your", "from", "near", "best", "some", "good", "find", "show", "here", "there", 
    "what", "where", "when", "about", "book", "free", "how", "to", "do", "you", "a", "an", "the", "is", "are", "was", "were", 
    "payment", "methods", "support", "service", "booking", "cancel", "reschedule", "refund", "price", "discount", "offers", 
    "safety", "verified", "time", "hours", "location", "cities", "help", "complaint"
  ]);

  const words = qLower.split(/[\s,./?#@!$%^&*()_+={}[\]|\\:;"'-]+/);
  let bestService = null;
  let minDistance = Infinity;

  for (const w of words) {
    if (w.length < 3 || stopWords.has(w)) continue;

    for (const service of servicesList) {
      for (const keyword of service.keywords) {
        if (w === keyword) {
          bestService = service.name;
          minDistance = 0;
          break;
        }
        if (w.includes(keyword) || keyword.includes(w)) {
          const distance = Math.abs(w.length - keyword.length);
          if (distance < minDistance) {
            minDistance = distance;
            bestService = service.name;
          }
        }
        
        const minLen = Math.min(w.length, keyword.length);
        const allowedDistance = minLen <= 3 ? 0 : minLen === 4 ? 1 : 2;
        const dist = levenshtein(w, keyword);
        
        if (dist <= allowedDistance && dist < minDistance) {
          minDistance = dist;
          bestService = service.name;
        }
      }
    }
  }

  return bestService;
};


// Legacy stub fallback wrapper
const hasFuzzyWordMatch = (queryText, targetWord) => {
  return findBestServiceMatch(queryText) === targetWord;
};

// Normalize spelling errors, synonyms, symptoms, and specific words to database services
export const normalizeServiceCategory = (category) => {
  if (!category) return null;
  const clean = category.toLowerCase().trim();
  
  if (clean.includes("plumb") || clean.includes("pluber") || clean.includes("leak") || clean.includes("pipe") || clean.includes("tap") || clean.includes("sink") || clean.includes("toilet") || clean.includes("drain") || clean.includes("clog") || clean.includes("faucet") || clean.includes("shower") || clean.includes("basin") || clean.includes("blockage") || clean.includes("pressure") || clean.includes("grouting")) return "Plumbing";
  if (clean.includes("electr") || clean.includes("wire") || clean.includes("switch") || clean.includes("fan") || clean.includes("light") || clean.includes("power") || clean.includes("current") || clean.includes("fuse") || clean.includes("spark") || clean.includes("bulb") || clean.includes("socket") || clean.includes("meter") || clean.includes("shock") || clean.includes("tripping") || clean.includes("mcb")) return "Electrical";
  if (clean.includes("carpen") || clean.includes("wood") || clean.includes("furniture") || clean.includes("door") || clean.includes("chair") || clean.includes("table") || clean.includes("wardrobe") || clean.includes("cabinet") || clean.includes("latch") || clean.includes("lock") || clean.includes("handle") || clean.includes("hinge") || clean.includes("drawer") || clean.includes("bed")) return "Carpentry";
  if (clean.includes("ac") || clean.includes("air cond") || clean.includes("cooling") || clean.includes("coolng") || clean.includes("cooler") || clean.includes("condenser") || clean.includes("compressor") || clean.includes("heating") || clean.includes("hvac") || clean.includes("split ac") || clean.includes("window ac")) return "AC Repair";
  if (clean.includes("wash") && (clean.includes("machine") || clean.includes("laundry") || clean.includes("dryer") || clean.includes("washer") || clean.includes("drum") || clean.includes("spin"))) return "Washing Machine";
  if (clean.includes("geyser") || clean.includes("heater") || clean.includes("hot water") || clean.includes("boiler") || clean.includes("thermostat")) return "Geyser";
  if (clean.includes("grinder") || clean.includes("wet grinder") || clean.includes("stone") || clean.includes("carbon brush")) return "Grinder";
  if (clean.includes("mixer") || clean.includes("blender") || clean.includes("juicer") || clean.includes("mixie")) return "Mixer";
  if (clean.includes("fridge") || clean.includes("refrigerator") || clean.includes("freezer") || clean.includes("double door") || clean.includes("single door")) return "Refrigerator";
  if (clean.includes("purifier") || clean.includes("ro filter") || clean.includes("water filter") || clean.includes("ro service") || clean.includes("alkaline") || clean.includes("kent") || clean.includes("aquaguard")) return "Water Purifier";
  if (clean.includes("deep") || (clean.includes("house") && clean.includes("clean")) || clean.includes("maid") || clean.includes("home clean") || clean.includes("vacuum") || clean.includes("dusting") || clean.includes("sofa clean") || clean.includes("carpet clean")) return "House Cleaning";
  if (clean.includes("floor") && (clean.includes("clean") || clean.includes("mop") || clean.includes("scrub") || clean.includes("polish") || clean.includes("marble"))) return "Floor cleaning";
  if (clean.includes("utensil") || clean.includes("dish") || clean.includes("plate") || clean.includes("pot") || clean.includes("dishwash") || clean.includes("vessel")) return "Utensils Cleaning";
  if (clean.includes("putty") || clean.includes("coating") || clean.includes("wall putty") || clean.includes("birla putty") || clean.includes("jk putty")) return "Wall Putty Coating";
  if (clean.includes("interior") || (clean.includes("paint") && !clean.includes("exterior") && !clean.includes("wood") && !clean.includes("wallpaper") && !clean.includes("building"))) return "Interior Painting";
  if (clean.includes("exterior") || clean.includes("outdoor paint") || clean.includes("building paint") || clean.includes("weatherproof") || clean.includes("apex") || clean.includes("ultima")) return "Exterior Painting";
  if (clean.includes("texture") || clean.includes("designer finish") || clean.includes("wall art") || clean.includes("royal play") || clean.includes("stencil") || clean.includes("metallic")) return "Texture & Designer Finishers";
  if (clean.includes("wallpaper") || clean.includes("wall paper") || clean.includes("wall sticker") || clean.includes("decal") || clean.includes("vinyl")) return "Wallpaper Installation";
  if (clean.includes("wood polish") || clean.includes("varnish") || clean.includes("polishing") || clean.includes("melamine") || clean.includes("spirit polish")) return "Wood Polishing";
  if (clean.includes("bike") && (clean.includes("repair") || clean.includes("mechanic") || clean.includes("two-wheeler") || clean.includes("motorcycle") || clean.includes("puncture") || clean.includes("engine") || clean.includes("brake") || clean.includes("scooter") || clean.includes("activa") || clean.includes("pulsar"))) return "Two-Wheeler (Bikes)";
  if (clean.includes("car") && (clean.includes("repair") || clean.includes("mechanic") || clean.includes("four-wheeler") || clean.includes("sedan") || clean.includes("suv") || clean.includes("puncture") || clean.includes("engine") || clean.includes("brake") || clean.includes("denting") || clean.includes("wheel alignment"))) return "Four-Wheeler (Cars)";
  if (clean.includes("tractor") || clean.includes("crane") || clean.includes("heavy") || clean.includes("truck") || clean.includes("jcb") || clean.includes("lorry")) return "Others (Heavy)";
  if ((clean.includes("bike") && clean.includes("wash")) || clean.includes("scooter wash") || clean.includes("bike clean")) return "Bike Wash";
  if ((clean.includes("car") && clean.includes("wash")) || clean.includes("car clean") || clean.includes("car vacuum")) return "Car Wash";
  if (clean.includes("photo") || clean.includes("video") || clean.includes("camera") || clean.includes("shoot") || clean.includes("photographer") || clean.includes("wedding shoot")) return "Photography";
  if (clean.includes("priest") || clean.includes("pandit") || clean.includes("pooja") || clean.includes("purohit") || clean.includes("havan") || clean.includes("homam") || clean.includes("satyanarayana")) return "Purohit";
  if (clean.includes("decor") || clean.includes("balloon") || clean.includes("flower") || clean.includes("stage") || clean.includes("decoration")) return "Decor";
  if (clean.includes("mehandi") || clean.includes("henna") || clean.includes("bridal mehandi") || clean.includes("mehndi")) return "Mehandi";
  if (clean.includes("makeup") || clean.includes("cosmetic") || clean.includes("bridal makeup") || clean.includes("makeover")) return "Makeup";
  if (clean.includes("salon") || clean.includes("haircut") || clean.includes("facial") || clean.includes("parlor") || clean.includes("beauty") || clean.includes("spa") || clean.includes("nail") || clean.includes("grooming") || clean.includes("shave") || clean.includes("beard") || clean.includes("massage") || clean.includes("waxing") || clean.includes("threading")) return "Beauty, Salon & Spa";
  if (clean.includes("doctor") || clean.includes("medical") || clean.includes("physician") || clean.includes("sick") || clean.includes("health") || clean.includes("hospital") || clean.includes("clinic") || clean.includes("doctr") || clean.includes("fever") || clean.includes("pain") || clean.includes("cough") || clean.includes("cold") || clean.includes("flu") || clean.includes("consultation") || clean.includes("pediatrician")) return "Doctors";

  // Exact matching fallback checks
  const services = ["Plumbing", "Electrical", "Carpentry", "AC Repair", "Washing Machine", "Geyser", "Grinder", "Mixer", "Refrigerator", "Water Purifier", "House Cleaning", "Floor cleaning", "Utensils Cleaning", "Wall Putty Coating", "Interior Painting", "Exterior Painting", "Texture & Designer Finishers", "Wallpaper Installation", "Wood Polishing", "Two-Wheeler (Bikes)", "Four-Wheeler (Cars)", "Others (Heavy)", "Bike Wash", "Car Wash", "Photography", "Purohit", "Decor", "Mehandi", "Makeup", "Beauty, Salon & Spa", "Doctors"];
  for (const s of services) {
    if (s.toLowerCase().includes(clean) || clean.includes(s.toLowerCase())) {
      return s;
    }
  }

  return category;
};

// Zhipu JWT signature builder for standard completions
const generateZhipuToken = (apiKey) => {
  if (!apiKey || !apiKey.includes(".")) return "";
  const [id, secret] = apiKey.split(".");
  const timestamp = Date.now();
  const exp = timestamp + 180000; // 3 minutes validity in ms
  
  const header = {
    alg: "HS256",
    sign_type: "SIGN"
  };
  const payload = {
    api_key: id,
    exp: exp,
    timestamp: timestamp
  };
  
  const base64UrlEncode = (obj) => {
    return Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };
  
  const headerPart = base64UrlEncode(header);
  const payloadPart = base64UrlEncode(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
    
  return `${headerPart}.${payloadPart}.${signature}`;
};

// Fuzzy matching for general support/FAQ topics to handle typos and synonyms gracefully
const findBestSupportMatch = (queryText) => {
  const qLower = queryText.toLowerCase();
  
  const supportTopics = [
    { name: "booking", keywords: ["book", "booking", "boking", "reservation", "appoint", "appointment", "schedule"] },
    { name: "payment", keywords: ["payment", "paymnt", "pay", "money", "cash", "upi", "card", "wallet", "transaction", "bill", "invoice"] },
    { name: "refund", keywords: ["refund", "refnd", "cashback", "return money", "reimburse"] },
    { name: "complaint", keywords: ["complaint", "complain", "support", "issue", "problem", "help", "ticket", "grievance", "contact", "agent"] },
    { name: "price", keywords: ["price", "cost", "charge", "rate", "fee", "tariff", "expensive", "how much", "payment rate"] },
    { name: "discount", keywords: ["discount", "discont", "offer", "coupon", "promo", "code", "deal", "voucher"] },
    { name: "cancel", keywords: ["cancel", "cancle", "reschedule", "change time", "postpone", "cancelation"] },
    { name: "safety", keywords: ["safety", "safe", "verify", "verified", "background check", "trust", "secure", "guarantee", "warranty"] },
    { name: "location", keywords: ["location", "city", "cities", "where", "area", "neighborhood", "operate"] }
  ];

  for (const topic of supportTopics) {
    for (const keyword of topic.keywords) {
      if (qLower.includes(keyword)) {
        return topic.name;
      }
    }
  }

  const words = qLower.split(/[\s,./?#@!$%^&*()_+={}[\]|\\:;"'-]+/);
  let bestTopic = null;
  let minDistance = Infinity;

  for (const w of words) {
    if (w.length < 3) continue;

    for (const topic of supportTopics) {
      for (const keyword of topic.keywords) {
        if (w === keyword) {
          return topic.name;
        }
        if (w.includes(keyword) || keyword.includes(w)) {
          const distance = Math.abs(w.length - keyword.length);
          if (distance < minDistance) {
            minDistance = distance;
            bestTopic = topic.name;
          }
        }
        
        const minLen = Math.min(w.length, keyword.length);
        const allowedDistance = minLen <= 3 ? 0 : minLen === 4 ? 1 : 2;
        const dist = levenshtein(w, keyword);
        
        if (dist <= allowedDistance && dist < minDistance) {
          minDistance = dist;
          bestTopic = topic.name;
        }
      }
    }
  }

  return bestTopic;
};

// 🎁 Dynamic Database-Driven Promo & Plans Generator for AI Assistant
export const getDynamicOffersAndPlansResponse = async (userCity = "") => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const rawOffers = await Offer.find({}).lean();
    const rawPlans = await Plan.find({}).lean();

    const uCity = (userCity || "").toLowerCase().trim();

    const activeOffers = rawOffers.filter(o => {
      if (o.endDate && o.endDate < todayStr) return false;
      if (!o.city || o.city.trim() === "" || o.city.toLowerCase() === "all") return true;
      if (!uCity) return true;
      const cities = o.city.toLowerCase().split(",").map(c => c.trim());
      return cities.some(c => uCity.includes(c) || c.includes(uCity));
    });

    const activePlans = rawPlans.filter(p => {
      if (p.endDate && p.endDate < todayStr) return false;
      if (!p.city || p.city.trim() === "" || p.city.toLowerCase() === "all") return true;
      if (!uCity) return true;
      const cities = p.city.toLowerCase().split(",").map(c => c.trim());
      return cities.some(c => uCity.includes(c) || c.includes(uCity));
    });

    let text = "Yes! 🎁 Here are the active promo coupons & subscription plans currently live on Workzy:\n\n";

    if (activeOffers.length > 0) {
      text += "🏷️ **Active Promo Coupons:**\n";
      activeOffers.forEach(o => {
        text += `• **${o.code}**: ${o.discount} — ${o.desc || "Valid at checkout"}`;
        if (o.minPrice) text += ` *(Min subtotal: ₹${o.minPrice})*`;
        text += "\n";
      });
      text += "\n";
    }

    if (activePlans.length > 0) {
      text += "⭐ **Available Service Plans:**\n";
      activePlans.forEach(p => {
        const cleanPrice = String(p.price || "").replace("₹", "");
        text += `• **${p.title}**: ₹${cleanPrice}/${p.period || "month"}`;
        if (p.features && p.features.length > 0) {
          text += ` (${p.features.slice(0, 2).join(", ")})`;
        }
        text += "\n";
      });
      text += "\n";
    }

    if (activeOffers.length === 0 && activePlans.length === 0) {
      text = "🎁 We currently have special promotional codes available at checkout! Enter **WORKZY20** for 20% OFF or **WELCOME100** for ₹100 OFF on your booking! 🏷️✨\n\nVisit [Plans & Offers](/plans-offers) to explore all available deals.";
    } else {
      text += "Apply coupon codes directly at checkout or head over to our **[Plans & Offers](/plans-offers)** page to subscribe! 🚀✨";
    }

    return text;
  } catch (err) {
    console.error("Error generating dynamic offers response:", err);
    return "🎁 Use promo code **WORKZY20** for 20% OFF or **WELCOME100** for ₹100 OFF at checkout! Visit [Plans & Offers](/plans-offers) to see all active deals.";
  }
};

// Fallback in-memory NLP engine utilizing fuzzy matching and a rich guide database
const localAIEngine = (userQuery, userLocation) => {
  const query = userQuery.toLowerCase().trim();
  
  // 1. Precise platform service category matching using Levenshtein fuzzy word checks
  let matchedService = findBestServiceMatch(query);

  // 2. City extraction
  let matchedCity = null;
  const cities = ["kakinada", "rajahmundry", "new delhi", "delhi", "hyderabad", "mumbai"];
  for (const c of cities) {
    if (hasFuzzyWordMatch(query, c)) {
      matchedCity = c === "delhi" ? "New Delhi" : c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // 3. Complete guide, support & chitchat database to answer ANYTHING dynamically
  let aiResponse = "";
  let workerSearch = false;

  const matchedTopic = findBestSupportMatch(query);

  if (matchedService) {
    workerSearch = true;
    const targetCity = matchedCity || userLocation.split(",")[0].trim();
    aiResponse = `I would be glad to help you find the best expert for **${matchedService}** in ${targetCity}! 🛠️✨ Here are the top-rated professionals matched from our database.`;
  } else if (matchedTopic === "booking") {
    aiResponse = "To book a service:\n1. Open the homepage.\n2. Tap on any main category (like Painting, Events, Beauty) to view its sub-services.\n3. Click on your desired sub-service (e.g. AC Repair, Makeup).\n4. Select a nearby professional, click 'View Profile & Book', select your date and time slot, and confirm! 📅✨";
  } else if (matchedTopic === "payment") {
    aiResponse = "We support multiple secure payment gateways including Google Pay / UPI, Secure Wallet, Credit/Debit Cards, and Cash on Delivery. To see your transaction statements, please head to your 'Profile' section! 💵🛡️";
  } else if (matchedTopic === "refund") {
    aiResponse = "Refunds are processed automatically to your source payment method within 3-5 business days upon cancellation of a booked service. You can track refund statuses in your transaction history! 💵🛡️";
  } else if (matchedTopic === "complaint") {
    aiResponse = "I can record any feedback or complaints here. You can also head over to our support portal to generate an official complaint ticket, and our team will get in touch with you within 24 hours. ⚖️🤝";
  } else if (matchedTopic === "price") {
    aiResponse = "Pricing is dynamic and depends on the specific professional you choose! 💰 Basic visits start at ₹150, and rates are listed transparently on each worker's profile.";
  } else if (matchedTopic === "discount") {
    aiResponse = "__DYNAMIC_OFFERS_RESPONSE__";
  }
  } else if (matchedTopic === "cancel") {
    aiResponse = "You can easily cancel or reschedule bookings free of charge up to 2 hours before the appointment via the 'My Bookings' tab! 🕐✨";
  } else if (matchedTopic === "safety") {
    aiResponse = "Your safety is our top priority! 🛡️ Every service provider on Workzy undergoes rigorous background checks and government ID verifications.";
  } else if (matchedTopic === "location") {
    aiResponse = "We currently operate in major cities including Mumbai, Bangalore, Delhi, Chennai, and Hyderabad. The platform automatically detects your searched location to show you the nearest available experts! 🗺️📍";
  } else if (query.includes("how are you")) {
    aiResponse = "I'm doing absolutely fantastic, thank you for asking! 😊 I'm ready and excited to help you find the best home services today. How can I assist you today?";
  } else if (query.includes("who are you") || query.includes("your name") || query.includes("what are you")) {
    aiResponse = "I am Zy, your personal Workzy AI Assistant! 🤖✨ I specialize in helping you discover, select, and book the perfect local professionals for any task, from home repairs to event management.";
  } else if (query.includes("thank") || query.includes("thanks")) {
    aiResponse = "You are so very welcome! ❤️ I'm always here to assist. Let me know if you need to find any other local professionals!";
  } else if (query.includes("great") || query.includes("awesome") || query.includes("nice") || query.includes("cool")) {
    aiResponse = "Awesome! Glad to hear that. 👍 Let me know if you need to book any services today!";
  } else if (query.includes("good morning")) {
    aiResponse = "Good morning! ☀️ Wishing you a wonderful and productive day ahead. How can I assist you with your home services today?";
  } else if (query.includes("good evening")) {
    aiResponse = "Good evening! 🌆 Hope you had a great day. How can I help you relax or sort out your home chore needs tonight?";
  } else if (query.includes("good afternoon")) {
    aiResponse = "Good afternoon! 🌤️ Hope your day is going well. Need any quick service assistance?";
  } else if (query.includes("namaste") || query.includes("hello") || query.includes("hi") || query.includes("hey") || query.includes("welcome")) {
    aiResponse = "Hello there! 👋 Welcome to Workzy. It's wonderful to chat with you today.\n\nHow can I help make your life easier? (e.g., 'fix my leaking tap', 'need mehandi design', or 'house cleaning')";
  } else if (query.includes("bye") || query.includes("goodbye") || query.includes("night")) {
    aiResponse = "Goodbye! 👋 Have a peaceful time, and don't hesitate to chat with me again if you need any service assistance! 🤖";
  } else {
    aiResponse = "I'm analyzing your request! 🤖 Please mention a service you need (like AC repair, plumbing, carpentry, or bridal makeup) and I will instantly search the database for you!";
  }

  return { workerSearch, service: matchedService, city: matchedCity, aiResponse };
};

export const proxyChat = async (req, res) => {
  try {
    const { messages } = req.body;
    const apiKey = process.env.AI_API_KEY || "";

    // Extract user query and detected location from system context
    const userQuery = messages[messages.length - 1]?.content || "";
    const systemMsg = messages.find(m => m.role === "system")?.content || "";
    
    // Simple regex extraction of user location from system prompt
    let userLocation = "Kakinada";
    const locMatch = systemMsg.match(/located near:\s*([^.]+)/i);
    if (locMatch) {
      userLocation = locMatch[1].trim();
    }

    // 📍 DYNAMIC DATABASE-DRIVEN GEOLOCATION INTERCEPTOR
    if (
      userQuery.toLowerCase().includes("geolocation") ||
      userQuery.toLowerCase().includes("neighborhoods") ||
      userQuery.toLowerCase().includes("famous local areas") ||
      userQuery.toLowerCase().includes("nearby famous")
    ) {
      let searchCity = userLocation.split(",")[0].trim();
      const cityMatch = userQuery.match(/user is at\s*["']([^"']+)["']/i);
      if (cityMatch) {
        searchCity = cityMatch[1].split(",")[0].trim();
      }

      console.log(`🤖 [AI GEOLOCATION INTERCEPTOR] Extracting active worker neighborhoods from database for: "${searchCity}"...`);
      const activeWorkersInCity = await Worker.find({
        city: new RegExp(searchCity, "i"),
        status: "Active"
      }).select("location").lean();

      // Extract unique location neighborhoods (case-insensitive deduplication, ignoring the base city name)
      const seenLocs = new Set();
      const uniqueLocs = [];
      for (const w of activeWorkersInCity) {
        if (w.location) {
          const cleanLoc = w.location.trim();
          const lowerLoc = cleanLoc.toLowerCase();
          if (
            lowerLoc !== searchCity.toLowerCase() &&
            !seenLocs.has(lowerLoc)
          ) {
            seenLocs.add(lowerLoc);
            uniqueLocs.push(cleanLoc);
          }
        }
      }

      // Fallback pre-populated lists in case the database is empty for the target city
      let fallbackAreas = "Danavaipeta, Pushkar Ghat, Bommarillu";
      if (searchCity.toLowerCase().includes("kakinada")) {
        fallbackAreas = "Bhanugudi Junction, Jagannaickpur, Suryaraopeta";
      } else if (searchCity.toLowerCase().includes("delhi")) {
        fallbackAreas = "Connaught Place, Karol Bagh, Vasant Kunj";
      } else if (searchCity.toLowerCase().includes("hyderabad")) {
        fallbackAreas = "Gachibowli, Jubilee Hills, Madhapur";
      } else if (searchCity.toLowerCase().includes("mumbai")) {
        fallbackAreas = "Andheri, Bandra, Colaba";
      }

      const finalAreas = uniqueLocs.length >= 2 ? uniqueLocs.slice(0, 3).join(", ") : fallbackAreas;
      console.log(`🤖 [AI GEOLOCATION INTERCEPTOR] Resolved areas from database: "${finalAreas}"`);

      return res.status(200).json({
        choices: [
          {
            message: {
              content: finalAreas
            }
          }
        ],
        workers: [],
        category: null
      });
    }

    let parsedResult = null;
    let rawResponseText = "";

    // 🛡️ DUAL-ENGINE STRATEGY: Attempt remote LLM first, gracefully fall back to local AI on error/auth failure
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const systemPrompt = `You are Zy, a structured classification and conversational AI assistant for the Workzy home service platform.
You suggest workers, specify locations, and explain available plans based on live data.
Analyze the user's message. The user's current detected location is: "${userLocation}".

We have the following services on our platform:
- "Plumbing", "Electrical", "Carpentry", "AC Repair", "Washing Machine", "Geyser", "Grinder", "Mixer", "Refrigerator", "Water Purifier", "House Cleaning", "Floor cleaning", "Utensils Cleaning", "Wall Putty Coating", "Interior Painting", "Exterior Painting", "Texture & Designer Finishers", "Wallpaper Installation", "Wood Polishing", "Two-Wheeler (Bikes)", "Four-Wheeler (Cars)", "Others (Heavy)", "Bike Wash", "Car Wash", "Photography", "Purohit", "Decor", "Mehandi", "Makeup", "Beauty, Salon & Spa", "Doctors"

You must reply with ONLY a valid JSON object matching the following keys:
1. "workerSearch": boolean (true if looking to book/find a worker, false for general talk).
2. "service": string (one of the platform services listed above if workerSearch is true, otherwise null).
3. "city": string (city name if mentioned, e.g. "Kakinada", "New Delhi", or null).
4. "aiResponse": string (friendly response from Zy, use emojis, suggest workers, mention locations and plans/offers if relevant. Max 2 sentences).

Do not include any markdown formatting, no \`\`\`json wrappers. Respond with ONLY the raw JSON.`;

        const apiUrl = process.env.AI_API_URL || "https://open.bigmodel.cn/api/paas/v4/chat/completions";
        const modelName = process.env.AI_MODEL_NAME || "glm-4-flash"; // glm-4-flash is highly stable

        console.log(`🛰️ [AI LIVE QUERY] Querying LLM API at ${apiUrl} using model ${modelName}...`);
        let token = apiKey;
        if (!apiKey.startsWith("nvapi-") && !apiKey.startsWith("sk-")) {
          token = generateZhipuToken(apiKey);
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userQuery }
            ],
            temperature: 0.1
          }),
          signal: AbortSignal.timeout(8000) // ⚡ 8 second limit: never freeze the UI!
        });

        const data = await response.json();
        console.log("🛰️ [ZHIPU AI API RESPONSE]:", JSON.stringify(data, null, 2));

        if (response.ok) {
          if (data.choices && data.choices.length > 0) {
            rawResponseText = data.choices[0].message.content;
            try {
              const jsonMatch = rawResponseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                parsedResult = JSON.parse(jsonMatch[0].trim());
              } else {
                const cleaned = rawResponseText.replace(/```json/gi, "").replace(/```/g, "").trim();
                parsedResult = JSON.parse(cleaned);
              }
            } catch (err) {
              console.warn("JSON parse fail from Zhipu:", err.message);
            }
          } else if (data.error) {
            console.warn("Zhipu AI returned API Error:", data.error.message);
          }
        } else {
          console.warn(`Zhipu AI endpoint returned HTTP ${response.status}`);
        }
      } catch (netError) {
        console.warn("Zhipu AI Connection Timeout or Network Failure:", netError.message);
      }
    }

    // 🧠 ACTIVATE DUAL-ENGINE FALLBACK
    // If remote LLM failed, was unauthorized, timed out, or returned empty - serve from local NLP
    if (!parsedResult) {
      console.log("🚀 [DUAL-ENGINE] Serving high-performance in-memory local AI response for:", userQuery);
      parsedResult = localAIEngine(userQuery, userLocation);
    }

    // 🎁 DYNAMIC DATABASE INTERCEPTOR FOR OFFERS & PLANS QUERIES
    const qLower = userQuery.toLowerCase();
    if (
      parsedResult.aiResponse === "__DYNAMIC_OFFERS_RESPONSE__" ||
      (!parsedResult.workerSearch && (
        qLower.includes("offer") ||
        qLower.includes("coupon") ||
        qLower.includes("promo") ||
        qLower.includes("discount") ||
        qLower.includes("plan")
      ))
    ) {
      parsedResult.aiResponse = await getDynamicOffersAndPlansResponse(userLocation);
    }

    let workers = [];
    let matchedCategory = normalizeServiceCategory(parsedResult.service);

    // If AI identified a service lookup request, query database dynamically
    if (parsedResult.workerSearch && matchedCategory) {
      let searchCity = parsedResult.city;
      if (!searchCity) {
        const qLower = userQuery.toLowerCase();
        const citiesList = ["kakinada", "rajahmundry", "bangalore", "hyderabad", "mumbai", "delhi", "new delhi", "chennai", "pune", "kolkata"];
        for (const c of citiesList) {
          if (qLower.includes(c)) {
            searchCity = c === "delhi" ? "New Delhi" : c.charAt(0).toUpperCase() + c.slice(1);
            break;
          }
        }
      }
      if (!searchCity) {
        searchCity = userLocation.split(",")[0].trim();
      }
      
      const filter = {
        service: new RegExp(matchedCategory, "i"),
        status: "Active"
      };

      if (searchCity && !searchCity.toLowerCase().includes("unknown")) {
        filter.city = new RegExp(searchCity, "i");
      }

      workers = await Worker.find(filter).sort({ rating: -1 }).limit(3).lean();

      // 🌍 Cross-location Fallback: If 0 workers found in specified city, search across all locations!
      if (workers.length === 0) {
        workers = await Worker.find({
          service: new RegExp(matchedCategory, "i"),
          status: "Active"
        }).sort({ rating: -1 }).limit(3).lean();

        if (workers.length > 0 && parsedResult.aiResponse) {
          const citiesFound = [...new Set(workers.map(w => w.city).filter(Boolean))].join(", ");
          parsedResult.aiResponse = `I couldn't find experts directly in ${searchCity}, but here are top-rated professionals for **${matchedCategory}** in nearby locations (${citiesFound}):`;
        }
      }
    }

    // Return exact payload expected by frontend, including the conversational reply and found workers
    res.status(200).json({
      choices: [
        {
          message: {
            content: parsedResult.aiResponse || rawResponseText
          }
        }
      ],
      workers: workers,
      category: matchedCategory
    });

  } catch (error) {
    console.error("Backend AI proxy breakdown:", error.message);
    res.status(500).json({ error: "Internal AI Relay Failure" });
  }
};

// ── ROBUST PARTICIPANT IDENTITY RESOLVER ──
// Resolves whether req.user is the customer or worker for a booking,
// handling the Worker vs User collection ID mismatch gracefully.
const resolveBookingParticipant = async (reqUser, booking) => {
  if (!reqUser) return { isWorker: false, isCustomer: false };

  const userId = reqUser._id.toString();
  const userEmail = (reqUser.email || "").toLowerCase();

  // 1. Check if this user is the WORKER for this booking
  let isWorker = false;
  let worker = null;
  try {
    worker = await Worker.findById(booking.worker_id);
    if (worker) {
      const workerEmail = (worker.email || "").toLowerCase();
      // Match by email (most reliable since Worker._id ≠ User._id)
      if (userEmail && workerEmail && userEmail === workerEmail) {
        isWorker = true;
      }
      // Also match by direct ID (fallback for edge cases)
      if (worker._id.toString() === userId) {
        isWorker = true;
      }
    }
  } catch (e) {
    console.warn("Worker lookup failed:", e.message);
  }

  // 2. Check if this user is the CUSTOMER for this booking
  let isCustomer = false;
  // Direct ID match (customer_id is stored as a string in Booking schema)
  if (userId === booking.customer_id?.toString()) {
    isCustomer = true;
  }
  // Email-based fallback: look up the customer's User record and compare emails
  if (!isCustomer && userEmail) {
    try {
      const customerUser = await User.findById(booking.customer_id);
      if (customerUser && (customerUser.email || "").toLowerCase() === userEmail) {
        isCustomer = true;
      }
    } catch (e) {
      // customer_id may not be a valid ObjectId, that's OK
    }
  }

  return { isWorker, isCustomer, worker };
};

// Peer-to-Peer Booking Chat Handlers
export const getBookingMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID format" });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const { isWorker, isCustomer } = await resolveBookingParticipant(req.user, booking);

    console.log("💬 [Chat GET Auth]", {
      bookingId,
      userId: req.user?._id?.toString(),
      userEmail: req.user?.email,
      booking_customer_id: booking.customer_id,
      booking_worker_id: booking.worker_id,
      isWorker,
      isCustomer
    });

    if (!isWorker && !isCustomer) {
      return res.status(403).json({ error: "Access denied. You are not a participant in this booking." });
    }

    const messages = await Message.find({ booking_id: bookingId }).sort({ createdAt: 1 }).lean();
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching booking messages:", err);
    res.status(500).json({ error: err.message });
  }
};

export const sendBookingMessage = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Message text cannot be empty" });
    }

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID format" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Chat is restricted to executing bookings (Accepted, On the Way, Started)
    const activeStatuses = ["Accepted", "On the Way", "Started"];
    if (!activeStatuses.includes(booking.status)) {
      return res.status(400).json({ error: `Chat is only available during active job execution. Current status: ${booking.status}` });
    }

    const { isWorker, isCustomer, worker } = await resolveBookingParticipant(req.user, booking);

    console.log("💬 [Chat POST Auth]", {
      bookingId,
      userId: req.user?._id?.toString(),
      userEmail: req.user?.email,
      isWorker,
      isCustomer
    });

    if (!isWorker && !isCustomer) {
      return res.status(403).json({ error: "Access denied. You are not a participant in this booking." });
    }

    // Resolve sender and receiver IDs consistently
    // sender_id and receiver_id always use User collection IDs for consistency
    let sender_id, receiver_id;
    if (isCustomer) {
      // Customer sends → sender is customer's User._id, receiver is worker's User._id
      sender_id = req.user._id.toString();
      if (worker) {
        const workerUser = await User.findOne({ email: worker.email });
        receiver_id = workerUser ? workerUser._id.toString() : booking.worker_id.toString();
      } else {
        receiver_id = booking.worker_id.toString();
      }
    } else {
      // Worker sends → sender is worker's User._id, receiver is customer's User._id
      sender_id = req.user._id.toString();
      receiver_id = booking.customer_id.toString();
    }

    const message = await Message.create({
      booking_id: bookingId,
      sender_id,
      receiver_id,
      text: text.trim()
    });

    console.log("💬 [Chat Message Created]", {
      messageId: message._id,
      sender_id,
      receiver_id,
      text: text.trim().substring(0, 50)
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("Error sending booking message:", err);
    res.status(500).json({ error: err.message });
  }
};
