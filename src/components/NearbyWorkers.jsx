import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { filterWorkersClientSide } from "../utils/workerService";
import { FaTools, FaHandPointRight, FaSearch, FaBuilding, FaMapMarkerAlt, FaStar, FaMap } from "react-icons/fa";

const SERVICES = [
  { id: "carpentry", name: "Carpentry", icon: "🪚" },
  { id: "plumbing", name: "Plumbing", icon: "🔧" },
  { id: "electrical", name: "Electrical", icon: "⚡" },
  { 
    id: "beauty", 
    name: "Beauty, Salon & Spa", 
    icon: "💅",
    genders: [
      {
        id: "men",
        name: "Men",
        icon: "👨",
        subServices: [
          { id: "men_haircut", name: "Haircut (Men)", icon: "💇‍♂️" },
          { id: "men_beard", name: "Beard Trimming (Men)", icon: "🪒" },
          { id: "men_grooming", name: "Grooming (Men)", icon: "🤵" },
          { id: "men_spa", name: "Spa (Men)", icon: "💆‍♂️" }
        ]
      },
      {
        id: "women",
        name: "Women",
        icon: "👩",
        subServices: [
          { id: "women_hairstyling", name: "Hairstyling (Women)", icon: "💇‍♀️" },
          { id: "women_threading", name: "Threading (Women)", icon: "🧵" },
          { id: "women_facials", name: "Facials (Women)", icon: "🧖‍♀️" },
          { id: "women_nails", name: "Nail Art (Women)", icon: "💅" },
          { id: "women_manicure", name: "Manicure / pedicure (Women)", icon: "🧼" }
        ]
      }
    ]
  },
  { 
    id: "cleaning", 
    name: "Cleaning", 
    icon: "🧹", 
    subServices: [
      { id: "floor_cleaning", name: "Floor cleaning", icon: "🧹" },
      { id: "utensils_cleaning", name: "Utensils Cleaning", icon: "🍽️" },
      { id: "house_cleaning", name: "House Cleaning", icon: "🏠" }
    ]
  },
  { 
    id: "painting", 
    name: "Painting", 
    icon: "🎨", 
    subServices: [
      { id: "putty_coating", name: "Wall Putty Coating", icon: "🧱" },
      { id: "interior_painting", name: "Interior Painting", icon: "🏠" },
      { id: "exterior_painting", name: "Exterior Painting", icon: "🏢" },
      { id: "texture_finishers", name: "Texture & Designer Finishers", icon: "✨" },
      { id: "wallpaper_install", name: "Wallpaper Installation", icon: "🖼️" },
      { id: "wood_polishing", name: "Wood Polishing", icon: "🪵" }
    ]
  },
  { id: "packers", name: "Packers & Movers", icon: "📦" },
  { 
    id: "mechanical", 
    name: "Mechanical", 
    icon: "⚙️", 
    subServices: [
      { id: "two_wheeler", name: "Two-Wheeler (Bikes)", icon: "🏍️" },
      { id: "four_wheeler", name: "Four-Wheeler (Cars)", icon: "🚗" },
      { id: "heavy_others", name: "Others (Heavy)", icon: "🚜" }
    ]
  },
  { 
    id: "auto_cleaning", 
    name: "Automobile Cleaning", 
    icon: "🚗", 
    subServices: [
      { id: "bike_wash", name: "Bike Wash", icon: "🏍️" },
      { id: "car_wash", name: "Car Wash", icon: "🧼" },
      { id: "auto_cleaning_others", name: "Others", icon: "🚚" }
    ]
  },
  { 
    id: "appliance_repair", 
    name: "Electrical Appliances Repair", 
    icon: "🔌", 
    subServices: [
      { id: "ac_repair", name: "AC Repair", icon: "❄️" },
      { id: "washing_machine", name: "Washing Machine", icon: "🧺" },
      { id: "geyser", name: "Geyser", icon: "🔥" },
      { id: "grinder", name: "Grinder", icon: "🌀" },
      { id: "mixer", name: "Mixer", icon: "🌪️" },
      { id: "refrigerator", name: "Refrigerator", icon: "🧊" },
      { id: "water_purifier", name: "Water Purifier", icon: "💧" }
    ]
  },
  { id: "caretakers", name: "Care takers (baby)", icon: "👶" },
  { 
    id: "events", 
    name: "Events", 
    icon: "🎉", 
    subServices: [
      { id: "photography", name: "Photography", icon: "📸" },
      { id: "purohit", name: "Purohit", icon: "🪔" },
      { id: "decor", name: "Decor", icon: "🎈" },
      { id: "mehandi", name: "Mehandi", icon: "🌿" },
      { id: "makeup", name: "Makeup", icon: "💄" }
    ]
  },
  { 
    id: "doctors", 
    name: "Doctors & Medical", 
    icon: "🩺" 
  }
];

function getShortLocation(fullAddress) {
  const storedCity = localStorage.getItem("userCity");
  if (storedCity) return storedCity.toLowerCase().trim();

  if (!fullAddress) return "";
  const firstSegment = fullAddress.split(",")[0].trim();
  return firstSegment.toLowerCase();
}

const truncateLocation = (loc) => {
  if (!loc) return "";
  const parts = loc.split(",");
  if (parts.length > 2) {
    return parts.slice(0, 2).join(",").trim();
  }
  return loc;
};

function NearbyWorkers({ searchedLocation, userCoords }) {
  const [selectedService, setSelectedService] = useState(null);
  const [cloudWorkers, setCloudWorkers] = useState([]);

  const locationKey = getShortLocation(searchedLocation);

  useEffect(() => {
    if (!searchedLocation && !userCoords) {
      setCloudWorkers([]);
      return;
    }

    // Immediately clear previous list to prevent showing wrong or stale data while loading new location
    setCloudWorkers([]);

    const fetchLiveWorkers = async () => {
       try {
         const results = await filterWorkersClientSide(userCoords, locationKey);
         setCloudWorkers(results);
       } catch(e) { console.error("Nearby fetch fail", e); }
    };
    fetchLiveWorkers();
  }, [locationKey, userCoords, searchedLocation]); 
  
  // Generic Subservice State
  const [activeSubService, setActiveSubService] = useState(null);
  const [subServiceQuery, setSubServiceQuery] = useState("");

  // Beauty Specific States
  const [selectedGender, setSelectedGender] = useState(null);
  const [activeBeautySubService, setActiveBeautySubService] = useState(null);

  // Determine active service filter text based on interactive state selection
  let activeServiceText = null;

  if (selectedService?.id === "beauty") {
    if (activeBeautySubService) {
      activeServiceText = activeBeautySubService.name;
    }
  } else if (activeSubService) {
    activeServiceText = activeSubService.name;
  } else if (selectedService && !selectedService.subServices) {
    activeServiceText = selectedService.name;
  }

  const allWorkers = cloudWorkers;
  
  let filteredWorkers = [];
  if (activeServiceText) {
    // TIER 1: High-precision exact match!
    filteredWorkers = allWorkers.filter(w => w.service === activeServiceText);

    // TIER 2: Intelligent Fuzzy Fallback (ensures containment matches succeed)!
    if (filteredWorkers.length === 0) {
      filteredWorkers = allWorkers.filter(w => 
         w.service && (
           w.service.toLowerCase().includes(activeServiceText.toLowerCase()) ||
           activeServiceText.toLowerCase().includes(w.service.toLowerCase())
         )
      );
    }
    
    // TIER 3: Ultimate Fail-Safe Wide Match (pull ANY availability from the master category domain)!
    if (filteredWorkers.length === 0 && selectedService) {
       const safeTerm = selectedService.name.split(/[&,]/)[0].trim().toLowerCase();
       filteredWorkers = allWorkers.filter(w => w.service && w.service.toLowerCase().includes(safeTerm));
    }
  }

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setActiveSubService(null);
    setSelectedGender(null);
    setActiveBeautySubService(null);
    setSubServiceQuery("");
  };

  const handleSubServiceClick = (subService) => {
    setActiveSubService(subService);
  };

  const handleGenderSelect = (genderId) => {
    setSelectedGender(genderId);
    setActiveBeautySubService(null);
  };

  const handleBeautySubServiceClick = (sub) => {
    setActiveBeautySubService(sub);
  };

  const currentGenderData = selectedService?.genders?.find(g => g.id === selectedGender);

  // Filter subservices in case a category has many
  const filteredSubServicesList = selectedService?.subServices
    ? selectedService.subServices.filter(sub => 
        sub.name.toLowerCase().includes(subServiceQuery.toLowerCase())
      )
    : [];

  return (
    <div className="fade-in nearby-workers-container" style={{ padding: "20px 24px", margin: "14px 0px", background: "linear-gradient(135deg, rgba(49, 82, 91, 0.05) 0%, rgba(49, 82, 91, 0.01) 100%)", borderRadius: "0px", borderTop: "1.5px solid rgba(49, 82, 91, 0.12)", borderBottom: "1.5px solid rgba(49, 82, 91, 0.12)", borderLeft: "none", borderRight: "none", fontFamily: "'Outfit', sans-serif" }}>
      <h2 className="nearby-title" style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "8px" }}>
        <FaTools size={20} style={{ color: "var(--primary)" }} /> Explore & Book Services
      </h2>
      <p className="nearby-subtitle" style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 10px 0" }}>
        Select a category below to view verified available professionals near you.
      </p>

      {/* Styles for mobile horizontal scrolling slider and full width support */}
      <style>{`
        @media (max-width: 768px) {
          .nearby-workers-container {
            padding: 16px 12px !important;
            margin: 10px 0 !important;
            border-radius: 0px !important;
          }
          .nearby-title, .nearby-subtitle {
            padding-left: 0px !important;
            padding-right: 0px !important;
          }
          .services-grid-container {
            display: flex !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory;
            gap: 12px !important;
            margin-left: -12px !important;
            margin-right: -12px !important;
            padding: 4px 12px 12px 12px !important;
            margin-bottom: 16px !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none; /* Hide scrollbar for Firefox */
          }
          .services-grid-container::-webkit-scrollbar {
            display: none; /* Hide scrollbar for Chrome/Safari */
          }
          .services-grid-container .category-card {
            min-width: 110px !important;
            max-width: 110px !important;
            scroll-snap-align: start;
            flex: 0 0 auto !important;
            padding: 14px 6px !important;
          }
        }
      `}</style>

      {/* Services Grid (Main Categories) */}
      <div
        className="services-grid-container"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: "14px",
          marginBottom: "24px"
        }}
      >
        {SERVICES.map((service) => {
          const isSelected = selectedService?.id === service.id;
          return (
            <div
              key={service.id}
              className="premium-card category-card"
              onClick={() => handleServiceClick(service)}
              style={{
                backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                border: isSelected ? "2.5px solid var(--primary)" : "1.5px solid rgba(107, 79, 79, 0.35)",
                padding: "20px 10px",
                textAlign: "center",
                cursor: "pointer",
                boxShadow: isSelected ? "0 8px 20px var(--primary-glow)" : "var(--card-shadow)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                userSelect: "none"
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px", filter: isSelected ? "drop-shadow(0 4px 6px var(--primary-glow))" : "none" }}>{service.icon}</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: isSelected ? "var(--primary-dark)" : "var(--text-secondary)" }}>
                {service.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Beauty Category Gender & Subservices Selector */}
      {selectedService?.id === "beauty" && (
        <div
          style={{
            backgroundColor: "var(--bg-card-hover)",
            borderRadius: "20px",
            padding: "20px",
            border: "1.5px solid #e2e8f0",
            marginBottom: "24px",
            animation: "fadeIn 0.2s ease-out"
          }}
        >
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
            💅 Select Gender Category
          </h3>
          
          {/* Gender Selection Row */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            {selectedService.genders.map((gender) => {
              const isGenderSelected = selectedGender === gender.id;
              return (
                <button
                  key={gender.id}
                  onClick={() => handleGenderSelect(gender.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "14px",
                    borderRadius: "12px",
                    border: isGenderSelected ? "2.5px solid var(--primary)" : "1.5px solid rgba(107, 79, 79, 0.35)",
                    backgroundColor: isGenderSelected ? "var(--primary-light)" : "var(--bg-card)",
                    color: isGenderSelected ? "var(--primary-dark)" : "var(--text-secondary)",
                    fontWeight: "bold",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: isGenderSelected ? "0 4px 10px var(--primary-glow)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{gender.icon}</span>
                  {gender.name} Services
                </button>
              );
            })}
          </div>

          {/* Sub-Services Grid based on Gender Selection */}
          {selectedGender && currentGenderData && (
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 10px 0" }}>
                Available {currentGenderData.name} Spa & Salon Services
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: "12px"
                }}
              >
                {currentGenderData.subServices.map((sub) => {
                  const isBeautySubActive = activeBeautySubService?.id === sub.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => handleBeautySubServiceClick(sub)}
                      style={{
                        backgroundColor: isBeautySubActive ? "var(--primary-light)" : "var(--bg-card)",
                        border: isBeautySubActive ? "2.5px solid var(--primary)" : "1.5px solid rgba(107, 79, 79, 0.35)",
                        borderRadius: "12px",
                        padding: "12px 8px",
                        textAlign: "center",
                        cursor: "pointer",
                        boxShadow: isBeautySubActive ? "0 4px 10px var(--primary-glow)" : "0 1px 3px rgba(0,0,0,0.02)",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ fontSize: "24px", marginBottom: "6px" }}>{sub.icon}</div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: isBeautySubActive ? "var(--primary-dark)" : "var(--text-secondary)" }}>
                        {sub.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unified Dynamic Sub-Services Panel for categories with subServices */}
      {selectedService && selectedService.subServices && (
        <div
          className="premium-card fade-in"
          style={{
            marginBottom: "24px"
          }}
        >
          {/* Header & Internal Filtering/Search Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {selectedService.icon} {selectedService.name} Sub-Services
            </h3>
            
            {/* Inner Subservice Search Box */}
            {selectedService.subServices.length > 4 && (
              <input
                type="text"
                placeholder={`🔍 Filter ${selectedService.name} services...`}
                value={subServiceQuery}
                onChange={(e) => setSubServiceQuery(e.target.value)}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  borderRadius: "10px",
                  border: "1.5px solid rgba(107, 79, 79, 0.35)",
                  outline: "none",
                  width: "180px",
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-primary)"
                }}
              />
            )}
          </div>

          {/* Sub-Services List */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "12px"
            }}
          >
            {filteredSubServicesList.length > 0 ? (
              filteredSubServicesList.map((sub) => {
                const isSubActive = activeSubService?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSubServiceClick(sub)}
                    style={{
                      backgroundColor: isSubActive ? "var(--primary-light)" : "var(--bg-card)",
                      border: isSubActive ? "2.5px solid var(--primary)" : "1.5px solid rgba(107, 79, 79, 0.35)",
                      borderRadius: "12px",
                      padding: "16px 8px",
                      textAlign: "center",
                      cursor: "pointer",
                      boxShadow: isSubActive ? "0 4px 10px var(--primary-glow)" : "0 2px 4px rgba(0,0,0,0.02)",
                      transition: "all 0.2s ease",
                      userSelect: "none"
                    }}
                  >
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>{sub.icon}</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: isSubActive ? "var(--primary-dark)" : "var(--text-secondary)" }}>
                      {sub.name}
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", fontStyle: "italic", gridColumn: "1/-1" }}>
                No services match "{subServiceQuery}" in this category.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Workers Display Section */}
      <div
        style={{
          borderTop: "1.5px solid var(--border-color)",
          paddingTop: "24px",
          marginTop: "12px"
        }}
      >
        {!activeServiceText ? (
          <div className="premium-card" style={{ textAlign: "center", backgroundColor: "var(--bg-primary)" }}>
            <FaHandPointRight size={36} style={{ color: "var(--primary)", marginBottom: "12px" }} />
            <h4 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0" }}>
              Ready to find a Professional?
            </h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
              Tap on any service category above to view available experts.
            </p>
          </div>
        ) : (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                {activeBeautySubService?.icon || activeSubService?.icon || selectedService.icon} Available {activeServiceText} Experts
              </h3>
              {searchedLocation && (
                <span style={{ fontSize: "12px", backgroundColor: "var(--bg-primary)", padding: "4px 10px", borderRadius: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                  📍 {searchedLocation.split(",")[0]}
                </span>
              )}
            </div>

            {filteredWorkers.length === 0 ? (
              <div className="premium-card" style={{ textAlign: "center", backgroundColor: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                <FaSearch size={28} style={{ color: "var(--warning)", marginBottom: "8px" }} />
                <p style={{ fontWeight: "800", color: "#b45309", margin: "0 0 4px 0", fontSize: "16px" }}>
                  No {activeServiceText} experts found near you
                </p>
                <p style={{ color: "var(--warning)", fontSize: "14px", margin: 0, fontWeight: 500 }}>
                  {searchedLocation ? `Try changing your location from "${searchedLocation.split(",")[0]}".` : "Try adding your location to auto-match nearby professionals."}
                </p>
              </div>
            ) : (
              <div
                className="explore-workers-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "24px"
                }}
              >
                {filteredWorkers.map((worker, index) => (
                  <div
                    key={index}
                    className="premium-card worker-card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "20px", color: "var(--text-primary)", fontWeight: 800 }}>
                        {worker.name}
                      </h4>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "var(--primary-light)",
                          color: "var(--primary-dark)",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}
                      >
                        {worker.service}
                      </span>
                      <p style={{ margin: "14px 0 4px 0", fontSize: "14px", color: "var(--primary)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaBuilding size={12} /> {truncateLocation(worker.city)}
                      </p>
                      {worker.distanceKm !== undefined ? (
                        <p style={{ margin: "4px 0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                              borderRadius: "12px",
                              padding: "2px 10px",
                              fontSize: "12px",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <FaMap size={10} /> {worker.distanceKm < 0.5 ? "below 0.5 km" : `${worker.distanceKm} km away`}
                          </span>
                        </p>
                      ) : (
                        <p style={{ margin: "4px 0 4px 0", fontSize: "14px", color: "var(--text-secondary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                          <FaMapMarkerAlt size={12} /> {worker.distance} Away
                        </p>
                      )}
                      <p style={{ margin: "4px 0 4px 0", fontSize: "14px", color: "var(--warning)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaStar size={12} style={{ color: "var(--warning)" }} /> {worker.rating}
                      </p>
                      <span className="price-badge">₹{worker.price || (worker.service.includes("Carpentry") ? 399 : worker.service.includes("Plumbing") ? 299 : worker.service.includes("Doctors") ? 599 : 349)}</span>
                    </div>

                    <Link to="/worker" style={{ textDecoration: "none" }} onClick={() => localStorage.setItem("selected_worker", JSON.stringify(worker))}>
                      <button
                        style={{
                          width: "100%",
                          background: "var(--primary-grad)",
                          color: "white",
                        }}
                      >
                        Book
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default NearbyWorkers;

