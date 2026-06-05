import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

function AiChatBot() {
  const location = useLocation();
  const role = sessionStorage.getItem("userRole");
  const path = location.pathname;

  // ── PREMIUM CUSTOM DRAG-AND-RESIZE STATE AND LOGIC ──
  const [dimensions, setDimensions] = useState(() => {
    const saved = localStorage.getItem("chat_dimensions");
    return saved ? JSON.parse(saved) : { width: 360, height: 500, x: window.innerWidth - 380, y: window.innerHeight - 600 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, startX: 0 });

  const handleHeaderMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - dimensions.x,
      y: e.clientY - dimensions.y
    };
    e.preventDefault();
  };

  const handleResizeMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: dimensions.width,
      h: dimensions.height,
      startX: dimensions.x
    };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        let newX = e.clientX - dragStart.current.x;
        let newY = e.clientY - dragStart.current.y;
        
        newX = Math.max(0, Math.min(newX, window.innerWidth - dimensions.width));
        newY = Math.max(0, Math.min(newY, window.innerHeight - dimensions.height));
        
        const newCoords = { ...dimensions, x: newX, y: newY };
        setDimensions(newCoords);
        localStorage.setItem("chat_dimensions", JSON.stringify(newCoords));
      } else if (isResizing) {
        const deltaX = resizeStart.current.x - e.clientX;
        const deltaY = e.clientY - resizeStart.current.y;
        
        let newWidth = resizeStart.current.w + deltaX;
        let newHeight = resizeStart.current.h + deltaY;
        let newX = resizeStart.current.startX - deltaX;

        if (newWidth < 280) {
          newWidth = 280;
          newX = resizeStart.current.startX + resizeStart.current.w - 280;
        }
        if (newWidth > 600) {
          newWidth = 600;
          newX = resizeStart.current.startX + resizeStart.current.w - 600;
        }
        if (newHeight < 350) newHeight = 350;
        if (newHeight > 750) newHeight = 750;

        if (newX < 0) {
          newX = 0;
          newWidth = resizeStart.current.startX + resizeStart.current.w;
        }

        const newCoords = {
          width: newWidth,
          height: newHeight,
          x: newX,
          y: dimensions.y
        };
        setDimensions(newCoords);
        localStorage.setItem("chat_dimensions", JSON.stringify(newCoords));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dimensions]);

  useEffect(() => {
    const handleWindowResize = () => {
      setDimensions(prev => {
        const x = Math.max(0, Math.min(prev.x, window.innerWidth - prev.width));
        const y = Math.max(0, Math.min(prev.y, window.innerHeight - prev.height));
        return { ...prev, x, y };
      });
    };
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your Service App AI Assistant. 🤖\n\nHow can I help you today? Try describing any service or issue (e.g., 'AC is not cooling', 'need wallpaper installed', or 'bike wash') and I will find the right specialized experts for you!"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const sendingRef = useRef(false);

  // Context containers for AI intelligence
  const [activeOffers, setActiveOffers] = useState([]);
  const [activePlans, setActivePlans] = useState([]);

  // Auto-scroll to the latest message smoothly
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
     const primeAIPercepts = async () => {
        try {
           const [oResp, pResp] = await Promise.all([
              fetch("/api/offers"),
              fetch("/api/plans")
           ]);
           if (oResp.ok) setActiveOffers(await oResp.json());
           if (pResp.ok) setActivePlans(await pResp.json());
        } catch(e) { console.error("AI catalog loading error"); }
     };
     primeAIPercepts();
  }, []);

  const SUGGESTED_PROMPTS = [
    { text: "AC not cooling ❄️", query: "AC is not cooling" },
    { text: "Check Offers 🎁", query: "What are the latest offers?" },
    { text: "House Cleaning 🧹", query: "Need deep house cleaning" },
    { text: "Pricing & Cost 💰", query: "How much does it cost?" },
    { text: "Bridal Makeup 💄", query: "Bridal Makeup" },
    { text: "Safety & Trust 🛡️", query: "Are workers verified?" }
  ];

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

  const findBestServiceMatch = (queryText) => {
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

  const parseProblem = (text) => {
    return findBestServiceMatch(text);
  };

  const getSupportReply = (text) => {
    const lowercaseText = text.toLowerCase().trim();
    const matchedTopic = findBestSupportMatch(lowercaseText);

    // 1. Core Support/Booking guides
    if (matchedTopic === "booking") {
      return "To book a service:\n1. Open the homepage.\n2. Tap on any main category (like Painting, Events, Beauty) to view its sub-services.\n3. Click on your desired sub-service (e.g. AC Repair, Makeup).\n4. Select a nearby professional, click 'View Profile & Book', select your date and time slot, and confirm!";
    }

    if (matchedTopic === "payment") {
      return "We support multiple secure payment options including UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery. To see your past transaction receipts, please head over to your 'Profile' section!";
    }

    if (matchedTopic === "refund") {
      return "Refunds are processed automatically to your source payment method within 3-5 business days upon cancellation of a booked service. You can track refund statuses in your transaction history!";
    }

    if (matchedTopic === "complaint") {
      return "I can record any feedback or complaints here. You can also head over to our support portal to generate an official complaint ticket, and our team will get in touch with you within 24 hours.";
    }

    // 2. Informational & Data Queries (Pricing, Offers, Policies, etc.)
    if (matchedTopic === "price") {
      return "Prices vary based on the specific service and professional you choose.\n\nTypically:\n- Consultation/Visit: ₹150 - ₹300\n- Basic Repairs: ₹300 - ₹800\n- Specialized Services (AC, Makeup): ₹1000+\n\nYou can see exact pricing on each professional's profile before booking!";
    }

    if (matchedTopic === "discount") {
      const active = activeOffers.map(o => `• Code **${o.code}**: ${o.discount} (${o.desc})`).join("\n");
      return active.length > 0 
        ? `🎉 Yes, we have dynamic offers running right now!\n\n${active}\n\nApply code during checkout to claim benefits!` 
        : "🎉 We currently don't have any active sitewide promo codes, but our workers frequently list highly discounted budget rates on the home map page!";
    }

    if (lowercaseText.includes("plan") || lowercaseText.includes("subscribe")) {
      const activeP = activePlans.map(p => `• **${p.title}** for ${p.price}`).join("\n");
      return activeP.length > 0 
        ? `💎 Check out our exclusive Annual & Premium Plans:\n\n${activeP}\n\nHead to the 'Plans & Offers' page to unlock full premium features!`
        : "💎 Premium membership programs periodically rotate. Keep checking the Plans tab for seasonal launches!";
    }

    if (matchedTopic === "cancel") {
      return "You can easily cancel or reschedule your booking.\n\nJust go to 'My Bookings', select the upcoming service, and tap 'Cancel' or 'Reschedule'. Cancellations made at least 2 hours before the scheduled time are completely free of charge!";
    }

    if (matchedTopic === "safety") {
      return "🛡️ Your safety is our top priority!\n\nEvery professional on our platform undergoes a strict background check and skill verification. We also provide a 30-day service guarantee on most repair works to ensure complete peace of mind.";
    }

    if (lowercaseText.includes("time") || lowercaseText.includes("hours") || lowercaseText.includes("when") || lowercaseText.includes("open") || lowercaseText.includes("available")) {
      return "Our professionals are typically available from 8:00 AM to 9:00 PM, 7 days a week. During checkout, you can select any available time slot that perfectly fits your schedule!";
    }

    if (matchedTopic === "location") {
      return "We currently operate in major cities including Mumbai, Bangalore, Delhi, Chennai, and Hyderabad. The platform automatically detects your searched location to show you the nearest available experts!";
    }

    // 3. Personal Welcomes & Conversations
    if (lowercaseText.includes("how are you")) {
      return "I'm doing absolutely fantastic, thank you for asking! 😊\nI'm ready and excited to help you find the best home services today. How are you doing?";
    }
    
    if (lowercaseText.includes("who are you") || lowercaseText.includes("your name") || lowercaseText.includes("what are you")) {
      return "I am your personal Workzy AI Assistant! 🤖✨\nI specialize in helping you discover, select, and book the perfect local professionals for any task, from home repairs to event management.";
    }

    if (lowercaseText.includes("thank you") || lowercaseText.includes("thanks")) {
      return "You're very welcome! I'm always happy to help. ❤️\nLet me know if there's anything else you need!";
    }

    if (lowercaseText.includes("great") || lowercaseText.includes("awesome") || lowercaseText.includes("nice") || lowercaseText.includes("cool")) {
      return "Awesome! Glad to hear that. 👍 Let me know if you need to book any services today!";
    }

    if (lowercaseText.includes("good morning")) {
      return "Good morning! ☀️ Wishing you a wonderful and productive day ahead. How can I assist you with your home services today?";
    }

    if (lowercaseText.includes("good evening")) {
      return "Good evening! 🌆 Hope you had a great day. How can I help you relax or sort out your home chore needs tonight?";
    }

    if (lowercaseText.includes("good afternoon")) {
      return "Good afternoon! 🌤️ Hope your day is going well. Need any quick service assistance?";
    }

    if (lowercaseText.includes("namaste") || lowercaseText.includes("hello") || lowercaseText.includes("hi") || lowercaseText.includes("hey")) {
      return "Hello there! 👋 Welcome to Workzy. It's wonderful to chat with you today.\n\nHow can I help make your life easier? (e.g., 'fix my leaking tap', 'need mehandi design', or 'house cleaning')";
    }

    if (lowercaseText.includes("bye") || lowercaseText.includes("good night") || lowercaseText.includes("see ya")) {
      return "Goodbye! Have a peaceful and wonderful time. Don't hesitate to open this chat if you ever need service assistance again! 🤖👋";
    }

    return "I am analyzing your description. Please mention specific keywords or describe the problem you are facing (e.g., 'geyser is not working', 'need mehandi designer', or 'car cleaning') so I can instantly match you with our expert professionals!";
  };

  const handleSendMessage = async (overrideText) => {
    if (isTyping || sendingRef.current) return;
    const textToSend = typeof overrideText === "string" ? overrideText : inputText;
    if (!textToSend.trim()) return;

    sendingRef.current = true;
    const userMsg = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    const matchedCategory = parseProblem(textToSend);
    const userLocation = localStorage.getItem("userLocation") || "Unknown Location";

    // Function to get real workers dynamically from shared store based on category and location
    // 🚀 INTEGRATED INTELLIGENT CLOUD DISCOVERY! Fetches authenticated database entities seamlessly.
    const fetchDynamicWorkers = async (category) => {
      try {
        let url = `/api/workers?service=${encodeURIComponent(category)}`;
        const storedCity = localStorage.getItem("userCity") || (userLocation !== "Unknown Location" ? userLocation.split(",")[0].trim() : "");
        if (storedCity) {
           url += `&city=${encodeURIComponent(storedCity)}`;
        }

        const resp = await fetch(url);
        if (!resp.ok) return [];
        const matches = await resp.json();
        return matches.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } catch (e) {
        console.error("Chatbot cloud discovery failed");
        return [];
      }
    };

    const plansText = activePlans.map(p => `${p.title} for ${p.price}`).join("; ");
    const offersText = activeOffers.map(o => `${o.code} (${o.discount})`).join("; ");

    try {
      // 🛡️ SECURITY LOCKDOWN: Diverted insecure client-side requests to protected server-side relay!
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are the Workzy AI Assistant. The user is currently located near: ${userLocation}. 
              Your job is to help them with home services (plumbing, carpentry, beauty, cleaning, mechanics, doctors, etc). 
              Available Special Subscription Plans: ${plansText}.
              Available Promo Codes/Offers: ${offersText}.
              Be extremely friendly, concise (1-2 sentences max), and use emojis. 
              If users ask about pricing or discounts, MENTION the available offers and plans.
              If they ask about safety, say all workers are verified.`
            },
            {
              role: "user",
              content: textToSend
            }
          ]
        })
      });

      const data = await response.json();
      let aiReply = "";

      if (data.choices && data.choices.length > 0) {
        aiReply = data.choices[0].message.content;
      } else {
        throw new Error("No choices returned");
      }

      setIsTyping(false);

      const backendWorkers = data.workers;
      const backendCategory = data.category;

      if (backendWorkers && backendWorkers.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: aiReply + `\n\nBased on your location, I found these local experts near you for **${backendCategory}**:`,
            workersList: backendWorkers,
            category: backendCategory
          }
        ]);
      } else if (matchedCategory) {
        const workers = await fetchDynamicWorkers(matchedCategory);
        if (workers && workers.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: aiReply + `\n\nBased on your location, I found these local experts near you for **${matchedCategory}**:`,
              workersList: workers,
              category: matchedCategory
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: aiReply + `\n\nI couldn't find any active local experts in our database specializing in **${matchedCategory}** in your immediate area at the moment. 🔍 Please try another service or check back later!`
            }
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: aiReply }
        ]);
      }

      sendingRef.current = false;
    } catch (err) {
      console.error("ChatBot API Fetch Failed, using local fallback", err);
      setIsTyping(false);
      
      // Fallback local logic
      if (matchedCategory) {
        const workers = await fetchDynamicWorkers(matchedCategory);
        if (workers && workers.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: `Based on your request and location, I've matched the best available experts specializing in ${matchedCategory}! 🛠️`,
              workersList: workers,
              category: matchedCategory
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: `I've analyzed your description and matched it to **${matchedCategory}**, but I couldn't find any active professionals in your immediate area at the moment. 🔍 Please try another service or check back later!`
            }
          ]);
        }
      } else {
        const replyText = getSupportReply(textToSend);
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: replyText }
        ]);
      }
      sendingRef.current = false;
    }
  };

  if (
    role === "admin" ||
    role === "worker" ||
    path.includes("admin") ||
    path.includes("worker")
  ) {
    return null;
  }

  return (
    <div>
      {/* Floating Chat Bubble */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #00dbde 0%, #fc00ff 100%)",
          boxShadow: "0 8px 24px rgba(0, 219, 222, 0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          zIndex: 1000,
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          color: "white",
          fontSize: "26px"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.15) rotate(5deg)";
          e.currentTarget.style.boxShadow = "0 12px 30px rgba(252, 0, 255, 0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) rotate(0deg)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 219, 222, 0.4)";
        }}
      >
        💬
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="premium-card"
          style={{
            position: "fixed",
            left: `${dimensions.x}px`,
            top: `${dimensions.y}px`,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1000,
            padding: 0,
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            border: "1.5px solid var(--border)",
            userSelect: isDragging || isResizing ? "none" : "auto"
          }}
        >
          {/* Header */}
          <div
            onMouseDown={handleHeaderMouseDown}
            style={{
              background: "linear-gradient(135deg, #00dbde 0%, #fc00ff 100%)",
              color: "white",
              padding: "15px",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "move",
              userSelect: "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🤖</span>
              <div>
                <div style={{ fontSize: "15px" }}>AI Service Assistant</div>
                <div style={{ fontSize: "11px", fontWeight: "normal", color: "#e0f2f1" }}>Online | Instantly Matching</div>
              </div>
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              style={{ cursor: "pointer", fontSize: "20px", padding: "0 5px" }}
            >
              ×
            </span>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              padding: "15px",
              overflowY: "auto",
              backgroundColor: "rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div
                  style={{
                    backgroundColor: msg.sender === "user" ? "var(--primary)" : "var(--border)",
                    color: msg.sender === "user" ? "white" : "var(--text-main)",
                    padding: "10px 14px",
                    borderRadius: msg.sender === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    fontSize: "14px",
                    whiteSpace: "pre-line",
                    border: msg.sender === "user" ? "none" : "1px solid var(--border)"
                  }}
                >
                  {msg.text}
                </div>

                {/* Worker Match Cards */}
                {msg.workersList && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      marginTop: "8px"
                    }}
                  >
                    {msg.workersList.map((worker, wIdx) => (
                      <div
                        key={wIdx}
                        style={{
                          backgroundColor: "var(--bg-card)",
                          border: "1.5px solid var(--border)",
                          borderRadius: "12px",
                          padding: "12px",
                          boxShadow: "var(--shadow-3d)",
                          backdropFilter: "var(--blur)",
                        }}
                      >
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", color: "var(--text-main)" }}>
                          {worker.name}
                        </h4>
                        <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "var(--text-muted)", margin: "4px 0" }}>
                          <span>⭐ {worker.rating}</span>
                          <span>🛠️ {worker.experience}</span>
                          <span style={{ color: "var(--success)", fontWeight: "bold" }}>💰 ₹{worker.price || 350}</span>
                        </div>
                        <Link 
                          to="/worker"
                          onClick={() => {
                             localStorage.setItem("selected_worker", JSON.stringify(worker));
                             setIsOpen(false);
                          }}
                        >
                          <button
                            className="btn-primary"
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              marginTop: "6px"
                            }}
                          >
                            View Profile & Book
                          </button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "var(--border)",
                  padding: "10px 14px",
                  borderRadius: "12px 12px 12px 0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)"
                }}
              >
                AI is typing... 🤖
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

           {/* Suggested Prompts Chips */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "8px 12px",
              backgroundColor: "rgba(0, 0, 0, 0.01)",
              borderTop: "1.5px solid var(--border)",
              overflowX: "auto",
              whiteSpace: "nowrap"
            }}
          >
            {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
              <button
                key={pIdx}
                disabled={isTyping}
                onClick={() => handleSendMessage(prompt.query)}
                style={{
                  backgroundColor: isTyping ? "var(--border)" : "var(--bg-card)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "20px",
                  padding: "5px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: isTyping ? "var(--text-muted)" : "var(--text-main)",
                  cursor: isTyping ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  transition: "all 0.15s ease",
                  outline: "none"
                }}
              >
                {prompt.text}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div
            style={{
              padding: "10px",
              borderTop: "1.5px solid var(--border)",
              display: "flex",
              gap: "8px",
              backgroundColor: "transparent"
            }}
          >
            <input
              type="text"
              placeholder={isTyping ? "AI is typing, please wait..." : "Describe your issue..."}
              disabled={isTyping}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isTyping && handleSendMessage()}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "1.5px solid var(--border)",
                outline: "none",
                fontSize: "14px",
                backgroundColor: isTyping ? "var(--border)" : "var(--bg-card)",
                color: isTyping ? "var(--text-muted)" : "var(--text-main)",
                cursor: isTyping ? "not-allowed" : "text"
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isTyping}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                background: "linear-gradient(135deg, #00dbde 0%, #fc00ff 100%)",
                border: "none",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 219, 222, 0.25)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Send
            </button>
          </div>
          {/* Resize grip at bottom-left corner */}
          <div
            onMouseDown={handleResizeMouseDown}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "20px",
              height: "20px",
              cursor: "nesw-resize",
              zIndex: 1001,
              background: "linear-gradient(135deg, transparent 50%, rgba(252, 0, 255, 0.5) 50%)",
              transform: "rotate(90deg)",
              borderRadius: "0 0 0 20px"
            }}
          />
        </div>
      )}
    </div>
  );
}

export default AiChatBot;
