import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

// ── Zy AI Chatbot Styles ──
const zyStyles = `
  @keyframes zySlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes zyPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }
  @keyframes zyDotBounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
  }
  @keyframes zyFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes zyGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(49, 82, 91, 0.3); }
    50% { box-shadow: 0 0 35px rgba(49, 82, 91, 0.5); }
  }
  @keyframes zyShimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes zyRipple {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2.4); opacity: 0; }
  }

  .zy-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: linear-gradient(145deg, #31525B 0%, #1F353B 100%);
    box-shadow: 0 8px 32px rgba(49, 82, 91, 0.45), inset 0 1px 0 rgba(255,255,255,0.1);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 10000;
    transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 2px solid rgba(179, 222, 229, 0.3);
    overflow: visible;
  }
  .zy-fab:hover {
    transform: scale(1.12) rotate(-3deg);
    box-shadow: 0 12px 40px rgba(49, 82, 91, 0.6), inset 0 1px 0 rgba(255,255,255,0.15);
    border-color: rgba(179, 222, 229, 0.6);
  }
  .zy-fab::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid rgba(179, 222, 229, 0.3);
    animation: zyRipple 2.5s ease-out infinite;
  }
  .zy-fab-icon {
    font-size: 26px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    transition: transform 0.3s ease;
  }
  .zy-fab:hover .zy-fab-icon {
    transform: scale(1.1);
  }

  .zy-window {
    animation: zySlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .zy-header {
    background: linear-gradient(145deg, #1F353B 0%, #31525B 50%, #3d6670 100%);
    position: relative;
    overflow: hidden;
  }
  .zy-header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(179, 222, 229, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .zy-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(179, 222, 229, 0.4), transparent);
  }

  .zy-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
    animation: zyPulse 2s ease-in-out infinite;
  }

  .zy-msg {
    animation: zyFadeIn 0.3s ease-out;
  }

  .zy-msg-ai {
    background: linear-gradient(135deg, rgba(49, 82, 91, 0.06) 0%, rgba(179, 222, 229, 0.1) 100%);
    border: 1px solid rgba(49, 82, 91, 0.1);
    color: var(--text-main, #0f172a);
    border-radius: 4px 16px 16px 16px;
    position: relative;
  }
  .zy-msg-ai::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #31525B, #B3DEE5, transparent);
    border-radius: 4px 16px 0 0;
    opacity: 0.5;
  }

  .zy-msg-user {
    background: linear-gradient(145deg, #31525B 0%, #1F353B 100%);
    color: white;
    border-radius: 16px 16px 4px 16px;
    box-shadow: 0 4px 12px rgba(49, 82, 91, 0.25);
  }

  .zy-typing-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #31525B;
    display: inline-block;
    animation: zyDotBounce 1.2s ease-in-out infinite;
  }

  .zy-chip {
    background: linear-gradient(135deg, rgba(49, 82, 91, 0.05) 0%, rgba(179, 222, 229, 0.12) 100%);
    border: 1.5px solid rgba(49, 82, 91, 0.15);
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 11.5px;
    font-weight: 600;
    color: #31525B;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-family: 'Outfit', sans-serif;
    letter-spacing: 0.2px;
  }
  .zy-chip:hover {
    background: linear-gradient(135deg, #31525B 0%, #3d6670 100%);
    color: white;
    border-color: #31525B;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(49, 82, 91, 0.2);
  }
  .zy-chip:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none !important;
  }

  .zy-input {
    flex: 1;
    padding: 12px 16px;
    border-radius: 14px;
    border: 1.5px solid rgba(49, 82, 91, 0.15);
    outline: none;
    font-size: 14px;
    font-family: 'Outfit', sans-serif;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(8px);
    color: var(--text-main, #0f172a);
    transition: all 0.25s ease;
  }
  .zy-input:focus {
    border-color: #31525B;
    box-shadow: 0 0 0 3px rgba(49, 82, 91, 0.1);
    background: white;
  }
  .zy-input:disabled {
    background: rgba(0,0,0,0.03);
    color: #94a3b8;
    cursor: not-allowed;
  }
  .zy-input::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }

  .zy-send-btn {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: linear-gradient(145deg, #31525B 0%, #1F353B 100%);
    border: none;
    border-bottom: 3px solid #0E1719;
    color: white;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(49, 82, 91, 0.3);
    padding: 0;
  }
  .zy-send-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(49, 82, 91, 0.4);
  }
  .zy-send-btn:active {
    transform: translateY(1px);
    border-bottom-width: 1px;
  }
  .zy-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none !important;
  }

  .zy-worker-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
    border: 1.5px solid rgba(49, 82, 91, 0.12);
    border-radius: 16px;
    padding: 14px;
    transition: all 0.25s ease;
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;
  }
  .zy-worker-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #31525B, #B3DEE5);
  }
  .zy-worker-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(49, 82, 91, 0.15);
    border-color: rgba(49, 82, 91, 0.25);
  }

  .zy-book-btn {
    width: 100%;
    padding: 9px 16px;
    border-radius: 10px;
    font-size: 12.5px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    background: linear-gradient(145deg, #31525B 0%, #1F353B 100%);
    border: none;
    border-bottom: 3px solid #0E1719;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: 0.3px;
    box-shadow: 0 4px 8px rgba(49, 82, 91, 0.2);
  }
  .zy-book-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(49, 82, 91, 0.3);
  }
  .zy-book-btn:active {
    transform: translateY(1px);
    border-bottom-width: 1px;
  }

  .zy-resize-grip {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 18px;
    height: 18px;
    cursor: nesw-resize;
    z-index: 10001;
    opacity: 0.4;
    transition: opacity 0.2s ease;
  }
  .zy-resize-grip:hover {
    opacity: 0.8;
  }

  .zy-messages::-webkit-scrollbar {
    width: 5px;
  }
  .zy-messages::-webkit-scrollbar-track {
    background: transparent;
  }
  .zy-messages::-webkit-scrollbar-thumb {
    background: rgba(49, 82, 91, 0.15);
    border-radius: 10px;
  }
  .zy-messages::-webkit-scrollbar-thumb:hover {
    background: rgba(49, 82, 91, 0.3);
  }
`;

function AiChatBot() {
  const location = useLocation();
  const role = sessionStorage.getItem("userRole");
  const path = location.pathname;

  // ── Inject styles once ──
  useEffect(() => {
    if (!document.getElementById("zy-styles")) {
      const style = document.createElement("style");
      style.id = "zy-styles";
      style.textContent = zyStyles;
      document.head.appendChild(style);
    }
  }, []);

  // ── PREMIUM CUSTOM DRAG-AND-RESIZE STATE AND LOGIC ──
  const [dimensions, setDimensions] = useState(() => {
    const saved = localStorage.getItem("chat_dimensions");
    return saved ? JSON.parse(saved) : { width: 380, height: 540, x: window.innerWidth - 405, y: window.innerHeight - 620 };
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

        if (newWidth < 300) {
          newWidth = 300;
          newX = resizeStart.current.startX + resizeStart.current.w - 300;
        }
        if (newWidth > 600) {
          newWidth = 600;
          newX = resizeStart.current.startX + resizeStart.current.w - 600;
        }
        if (newHeight < 380) newHeight = 380;
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
      text: "Hey there! I'm Zy, your smart service assistant. 🤖✨\n\nDescribe any issue or service you need — like 'AC not cooling', 'bridal makeup', or 'house cleaning' — and I'll instantly match you with the best local experts!"
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
      } catch (e) { console.error("AI catalog loading error"); }
    };
    primeAIPercepts();
  }, []);

  const SUGGESTED_PROMPTS = [
    { text: "❄️ AC not cooling", query: "AC is not cooling" },
    { text: "🎁 Check Offers", query: "What are the latest offers?" },
    { text: "🧹 House Cleaning", query: "Need deep house cleaning" },
    { text: "💰 Pricing & Cost", query: "How much does it cost?" },
    { text: "💄 Bridal Makeup", query: "Bridal Makeup" },
    { text: "🛡️ Safety & Trust", query: "Are workers verified? really" },
    { text: "!✋ support or help", query: "customer support" }
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
      { name: "Doctors", keywords: ["doctor", "doctr", "medical", "consultation", "physician", "clinic", "sick", "health", "ill", "fever", "pain", "injury", "medicine", "cough", "cold", "flu", "hospital", "patient", "pediatrician", "cardiologist", "dermatologist", "orthopedic", "gynecologist", "fever consultation", "prescription", "general practitioner", "medical specialist", "stomach pain", "headache", "checkup", "fever", "blood clot", "emergency", "poision", "sick", "body pains"] }
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
      { name: "complaint", keywords: ["complaint", "complain", "support", "issue", "problem", "help", "ticket", "grievance", "contact", "agent", "customer care", "support team", "customer service", "helpdesk"] },
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
      return "📅 Can I reschedule my service booking?\n\nYes! You can reschedule any booking up to 2 hours before the scheduled time directly from your 'My Bookings' panel without any penalty.\n\n(Note: Rescheduling is available for scheduled services, not instant dispatch services.)";
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
      return "I am Zy, your personal Workzy AI Assistant! 🤖✨\nI specialize in helping you discover, select, and book the perfect local professionals for any task, from home repairs to event management.";
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

    // Determine dynamic action link based on user query intent
    const qLower = textToSend.toLowerCase();
    let actionLink = null;
    let actionLinkText = null;

    if (qLower.includes("plan") || qLower.includes("subscribe") || qLower.includes("discount") || qLower.includes("offer") || qLower.includes("promo") || qLower.includes("coupon")) {
      actionLink = "/plans-offers";
      actionLinkText = "View Plans & Offers →";
    } else if (qLower.includes("reschedule") || qLower.includes("reshuled") || qLower.includes("change time") || qLower.includes("postpone")) {
      actionLink = "/my-bookings";
      actionLinkText = "Go to My Bookings →";
    } else if (qLower.includes("support") || qLower.includes("help") || qLower.includes("complaint") || qLower.includes("issue") || qLower.includes("contact")) {
      actionLink = "/support";
      actionLinkText = "Visit Support Portal →";
    }

    // Function to get real workers dynamically from shared store based on category and location
    const fetchDynamicWorkers = async (category, textQuery = "") => {
      try {
        const queryLower = (textQuery || "").toLowerCase();
        const citiesList = ["kakinada", "rajahmundry", "bangalore", "hyderabad", "mumbai", "delhi", "new delhi", "chennai", "pune", "kolkata"];
        let targetCity = "";
        for (const c of citiesList) {
          if (queryLower.includes(c)) {
            targetCity = c === "delhi" ? "New Delhi" : c.charAt(0).toUpperCase() + c.slice(1);
            break;
          }
        }
        if (!targetCity) {
          targetCity = localStorage.getItem("userCity") || (userLocation !== "Unknown Location" ? userLocation.split(",")[0].trim() : "");
        }

        let url = `/api/workers?service=${encodeURIComponent(category)}`;
        if (targetCity && !targetCity.toLowerCase().includes("unknown")) {
          url += `&city=${encodeURIComponent(targetCity)}`;
        }

        let resp = await fetch(url);
        let matches = resp.ok ? await resp.json() : [];

        // 🌍 Cross-location Fallback: If 0 workers found in target city, query across all locations!
        if (!matches || matches.length === 0) {
          const fallbackResp = await fetch(`/api/workers?service=${encodeURIComponent(category)}`);
          if (fallbackResp.ok) {
            matches = await fallbackResp.json();
          }
        }

        return (matches || []).sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } catch (e) {
        console.error("Chatbot cloud discovery failed");
        return [];
      }
    };

    const plansText = activePlans.map(p => `${p.title} for ${p.price}`).join("; ");
    const offersText = activeOffers.map(o => `${o.code} (${o.discount})`).join("; ");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are Zy, the Workzy AI Assistant. The user is currently located near: ${userLocation}. 
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

      const aiMsgObj = {
        sender: "ai",
        text: aiReply,
        link: actionLink,
        linkText: actionLinkText
      };

      let finalWorkers = null;
      let finalCategory = null;

      if (backendWorkers && backendWorkers.length > 0) {
        finalWorkers = backendWorkers;
        finalCategory = backendCategory;
      } else if (matchedCategory) {
        const workers = await fetchDynamicWorkers(matchedCategory, textToSend);
        if (workers && workers.length > 0) {
          finalWorkers = workers;
          finalCategory = matchedCategory;
        }
      }

      if (finalWorkers && finalWorkers.length > 0) {
        const userName = sessionStorage.getItem("userName") || "there";
        const count = finalWorkers.length;
        const categoryName = (finalCategory || "experts").toLowerCase();
        const bonusText = activePlans.length > 0 || activeOffers.length > 0
          ? `🎁 **Location Bonuses Unlocked!**\nZy analyzed ${activePlans.length} Service Plans and ${activeOffers.length} Active Promo Offer for your area!`
          : `🎁 **Location Bonuses Unlocked!**\nNo exclusive plans or promo codes available in your area right now.`;

        const formattedText = `🤖 **Zy AI — Nearby Search Active**\nHey ${userName}! 🎯 I found ${count} top-rated ${categoryName} near ${userLocation} ready to help you today.\n\n🔥 **Top Picks Near You**`;

        aiMsgObj.text = formattedText;
        aiMsgObj.workersList = finalWorkers;
        aiMsgObj.category = finalCategory;
        if (!aiMsgObj.link) {
          aiMsgObj.link = "/plans-offers";
          aiMsgObj.linkText = "View Plans & Offers →";
        }
        aiMsgObj.bonusText = bonusText;
      }

      setMessages((prev) => [...prev, aiMsgObj]);
      sendingRef.current = false;
    } catch (err) {
      console.error("ChatBot API Fetch Failed, using local fallback", err);
      setIsTyping(false);

      let fallbackWorkers = null;
      if (matchedCategory) {
        fallbackWorkers = await fetchDynamicWorkers(matchedCategory, textToSend);
      }

      if (fallbackWorkers && fallbackWorkers.length > 0) {
        const userName = sessionStorage.getItem("userName") || "there";
        const count = fallbackWorkers.length;
        const categoryName = (matchedCategory || "experts").toLowerCase();
        const bonusText = activePlans.length > 0 || activeOffers.length > 0
          ? `🎁 **Location Bonuses Unlocked!**\nZy analyzed ${activePlans.length} Service Plans and ${activeOffers.length} Active Promo Offer for your area!`
          : `🎁 **Location Bonuses Unlocked!**\nNo exclusive plans or promo codes available in your area right now.`;

        const formattedText = `🤖 **Zy AI — Nearby Search Active**\nHey ${userName}! 🎯 I found ${count} top-rated ${categoryName} near ${userLocation} ready to help you today.\n\n🔥 **Top Picks Near You**`;

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: formattedText,
            workersList: fallbackWorkers,
            category: matchedCategory,
            bonusText: bonusText,
            link: actionLink || "/plans-offers",
            linkText: actionLinkText || "View Plans & Offers →"
          }
        ]);
      } else {
        const replyText = getSupportReply(textToSend);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: replyText,
            link: actionLink,
            linkText: actionLinkText
          }
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
      {/* ── Zy Floating Action Button ── */}
      <div className="zy-fab" onClick={() => setIsOpen(!isOpen)}>
        <span className="zy-fab-icon">{isOpen ? "✕" : "🤖"}</span>
      </div>

      {/* ── Zy Chat Window ── */}
      {isOpen && (
        <div
          className="zy-window"
          style={{
            position: "fixed",
            left: `${dimensions.x}px`,
            top: `${dimensions.y}px`,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 10000,
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: "0 20px 60px rgba(31, 53, 59, 0.2), 0 0 0 1px rgba(49, 82, 91, 0.08)",
            border: "1px solid rgba(179, 222, 229, 0.3)",
            userSelect: isDragging || isResizing ? "none" : "auto"
          }}
        >
          {/* ── Header ── */}
          <div
            className="zy-header"
            onMouseDown={handleHeaderMouseDown}
            style={{
              padding: "16px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "move",
              userSelect: "none",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(179, 222, 229, 0.3) 0%, rgba(255,255,255,0.1) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                border: "1px solid rgba(179, 222, 229, 0.2)"
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "white", letterSpacing: "0.3px" }}>
                  Zy
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div className="zy-status-dot" />
                  <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(179, 222, 229, 0.9)", letterSpacing: "0.2px" }}>
                    AI Service Assistant
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", position: "relative", zIndex: 1 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMessages([{
                    sender: "ai",
                    text: "Hey there! I'm Zy, your smart service assistant. 🤖✨\n\nDescribe any issue or service you need — like 'AC not cooling', 'bridal makeup', or 'house cleaning' — and I'll instantly match you with the best local experts!"
                  }]);
                }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  color: "white",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: 0,
                  boxShadow: "none",
                  borderBottom: "none",
                  transition: "background 0.2s"
                }}
                title="Clear chat"
              >
                🗑️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  color: "white",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "16px",
                  padding: 0,
                  boxShadow: "none",
                  borderBottom: "none",
                  transition: "background 0.2s"
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div
            className="zy-messages"
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "linear-gradient(180deg, rgba(248,250,252,0.5) 0%, rgba(255,255,255,0.3) 100%)"
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className="zy-msg"
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Sender label */}
                <div style={{
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: msg.sender === "user" ? "var(--text-secondary)" : "var(--primary)",
                  marginBottom: "4px",
                  paddingLeft: msg.sender === "user" ? "0" : "2px",
                  paddingRight: msg.sender === "user" ? "2px" : "0",
                  textAlign: msg.sender === "user" ? "right" : "left",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase"
                }}>
                  {msg.sender === "user" ? "You" : "Zy"}
                </div>

                <div
                  className={msg.sender === "user" ? "zy-msg-user" : "zy-msg-ai"}
                  style={{
                    padding: "12px 16px",
                    fontSize: "13.5px",
                    lineHeight: "1.55",
                    whiteSpace: "pre-line",
                    letterSpacing: "0.1px"
                  }}
                >
                  {msg.text}

                  {!msg.bonusText && msg.link && (
                    <div style={{ marginTop: "12px" }}>
                      <Link
                        to={msg.link}
                        onClick={() => setIsOpen(false)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          background: "#E5F6F8",
                          color: "#1F353B",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontWeight: 700,
                          fontSize: "13px",
                          border: "1px solid #B3DEE5",
                          transition: "all 0.2s"
                        }}
                      >
                        {msg.linkText} →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Worker Match Cards */}
                {msg.workersList && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                    {msg.workersList.map((worker, wIdx) => (
                      <div key={wIdx} className="zy-worker-card">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <div style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #31525B 0%, #B3DEE5 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "15px",
                            flexShrink: 0
                          }}>
                            {worker.name ? worker.name.charAt(0).toUpperCase() : "W"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1F353B" }}>
                              {worker.name}
                            </h4>
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span>{worker.service || msg.category}</span>
                              {worker.city && <span style={{ color: "#31525B", fontWeight: 700, background: "rgba(49,82,91,0.08)", padding: "1px 6px", borderRadius: "4px", fontSize: "10.5px" }}>📍 {worker.city}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          display: "flex",
                          gap: "12px",
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          padding: "8px 10px",
                          background: "rgba(49, 82, 91, 0.04)",
                          borderRadius: "8px",
                          marginBottom: "10px"
                        }}>
                          <span>⭐ {worker.rating || "N/A"}</span>
                          <span>🛠️ {worker.experience || "Exp."}</span>
                          <span style={{ color: "#31525B", fontWeight: 700 }}>💰 ₹{worker.price || 350}</span>
                        </div>
                        <Link
                          to="/worker"
                          onClick={() => {
                            localStorage.setItem("selected_worker", JSON.stringify(worker));
                            setIsOpen(false);
                          }}
                          style={{ textDecoration: "none" }}
                        >
                          <button className="zy-book-btn">
                            View Profile & Book →
                          </button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bonus Text Block */}
                {msg.bonusText && (
                  <div
                    className="zy-msg-ai"
                    style={{
                      padding: "12px 16px",
                      fontSize: "13.5px",
                      lineHeight: "1.55",
                      whiteSpace: "pre-line",
                      letterSpacing: "0.1px",
                      marginTop: "10px"
                    }}
                  >
                    {msg.bonusText}
                    {msg.link && (
                      <div style={{ marginTop: "12px" }}>
                        <Link
                          to={msg.link}
                          onClick={() => setIsOpen(false)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            background: "#E5F6F8",
                            color: "#1F353B",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: 700,
                            fontSize: "13px",
                            border: "1px solid #B3DEE5",
                            transition: "all 0.2s"
                          }}
                        >
                          {msg.linkText} →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="zy-msg" style={{ alignSelf: "flex-start", maxWidth: "88%" }}>
                <div style={{
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: "#31525B",
                  marginBottom: "4px",
                  paddingLeft: "2px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase"
                }}>
                  Zy
                </div>
                <div className="zy-msg-ai" style={{
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}>
                  <span className="zy-typing-dot" style={{ animationDelay: "0s" }} />
                  <span className="zy-typing-dot" style={{ animationDelay: "0.15s" }} />
                  <span className="zy-typing-dot" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ── Suggested Prompts ── */}
          <div style={{
            display: "flex",
            gap: "6px",
            padding: "8px 14px",
            borderTop: "1px solid rgba(49, 82, 91, 0.08)",
            overflowX: "auto",
            whiteSpace: "nowrap",
            background: "rgba(248, 250, 252, 0.5)"
          }}>
            {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
              <button
                key={pIdx}
                className="zy-chip"
                disabled={isTyping}
                onClick={() => handleSendMessage(prompt.query)}
              >
                {prompt.text}
              </button>
            ))}
          </div>

          {/* ── Input Area ── */}
          <div style={{
            padding: "12px 14px",
            borderTop: "1px solid rgba(49, 82, 91, 0.08)",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            background: "rgba(255,255,255,0.6)"
          }}>
            <input
              className="zy-input"
              type="text"
              placeholder={isTyping ? "Zy is thinking..." : "Ask Zy anything..."}
              disabled={isTyping}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isTyping && handleSendMessage()}
            />
            <button
              className="zy-send-btn"
              onClick={handleSendMessage}
              disabled={isTyping}
              title="Send message"
            >
              ➤
            </button>
          </div>

          {/* ── Resize Grip ── */}
          <div
            className="zy-resize-grip"
            onMouseDown={handleResizeMouseDown}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M14 4L4 14M14 8L8 14M14 12L12 14" stroke="#31525B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiChatBot;
