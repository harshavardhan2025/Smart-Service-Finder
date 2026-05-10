import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getComplaints, getWorkers, saveWorkers, getTransactions, verdictComplaint, getBookings, getPlans, savePlans, getOffers, saveOffers } from "../data/sharedStore";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Live state pulled dynamically from sharedStore
  const [workers, setWorkers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [liveRealTimeBookings, setLiveRealTimeBookings] = useState([]);

  // Initial Services Mock State (Category management with Sub-categories matching NearbyWorkers.jsx)
  const [services, setServices] = useState([
    { id: "carpentry", name: "Carpentry", icon: "🪚" },
    { id: "plumbing", name: "Plumbing", icon: "🔧" },
    { id: "electrical", name: "Electrical", icon: "⚡" },
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
    { id: "beauty", name: "Beauty, Salon & Spa", icon: "💅" },
    { id: "doctors", name: "Doctors", icon: "🩺" }
  ]);

  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceIcon, setNewServiceIcon] = useState("");

  // Sub-categories Management States
  const [selectedMainSvc, setSelectedMainSvc] = useState("carpentry");
  const [newSubName, setNewSubName] = useState("");
  const [newSubIcon, setNewSubIcon] = useState("");
  const [editingSub, setEditingSub] = useState(null); // { svcId, subId, name, icon } if editing

  // Initial Customers Mock State
  const [customers, setCustomers] = useState([
    { id: 1, name: "Harsha Vardhan", email: "harsha@gmail.com", phone: "9876543210", bookings: 12, status: "Active" },
    { id: 2, name: "Amit Khanna", email: "amit@gmail.com", phone: "9988776655", bookings: 5, status: "Active" },
    { id: 3, name: "Anjali Sen", email: "anjali@gmail.com", phone: "9122334455", bookings: 8, status: "Active" },
    { id: 4, name: "Sanjay Dutt", email: "sanjay@gmail.com", phone: "9888877777", bookings: 3, status: "Suspended" }
  ]);

  const [workerSearch, setWorkerSearch] = useState("");
  const [workerFilterStatus, setWorkerFilterStatus] = useState("All");

  const [customerSearch, setCustomerSearch] = useState("");

  const [adminPlans, setAdminPlans] = useState([]);
  const [adminOffers, setAdminOffers] = useState([]);

  // Form states for creating/editing a Plan
  const [editingPlan, setEditingPlan] = useState(null); // null if creating
  const [planForm, setPlanForm] = useState({ title: "", price: "", features: "", color: "#4f46e5", btnText: "Subscribe Now", workerId: "" });

  // Form states for creating/editing an Offer
  const [editingOffer, setEditingOffer] = useState(null); // null if creating
  const [offerForm, setOfferForm] = useState({ code: "", discount: "", desc: "", expiry: "" });

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
                          w.service.toLowerCase().includes(workerSearch.toLowerCase()) ||
                          w.city.toLowerCase().includes(workerSearch.toLowerCase());
    const matchesStatus = workerFilterStatus === "All" || w.status === workerFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter((c) => {
    return c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
           c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
           c.phone.toLowerCase().includes(customerSearch.toLowerCase());
  });

  const syncAdminStore = async () => {
    // Stop reliance on static dummy stores and continuously pulse the real cloud!
    try {
       const wResp = await fetch("http://localhost:5000/api/workers");
       if (wResp.ok) setWorkers(await wResp.json());

       const bResp = await fetch("http://localhost:5000/api/bookings");
       if (bResp.ok) setLiveRealTimeBookings(await bResp.json());
       const cResp = await fetch("http://localhost:5000/api/complaints");
       if (cResp.ok) setComplaints(await cResp.json());
    } catch(err) { console.error("Background sync fail", err); }

    // Retain internal operational caches for logic continuity
    setTransactions(getTransactions());
    setBookings(getBookings());
    setAdminPlans(getPlans());
    setAdminOffers(getOffers());

    // Dynamic Customer Sync
    const staticCustomers = [
      { id: "CUST-01", name: "Harsha Vardhan", email: "harsha@gmail.com", phone: "9876543210", status: "Active" },
      { id: "CUST-02", name: "Amit Khanna", email: "amit@gmail.com", phone: "9988776655", status: "Active" },
      { id: "CUST-03", name: "Anjali Sen", email: "anjali@gmail.com", phone: "9122334455", status: "Active" },
      { id: "CUST-04", name: "Sanjay Dutt", email: "sanjay@gmail.com", phone: "9888877777", status: "Suspended" }
    ];
    
    const registered = JSON.parse(localStorage.getItem("sh_registered_users") || "[]")
                        .filter(u => u.role === "user")
                        .map(u => ({ id: u.id || u.email, name: u.name, email: u.email, phone: u.phone, status: "Active" }));

    // Dedup logic based on emails
    const combinedMap = new Map();
    staticCustomers.forEach(c => combinedMap.set(c.email, c));
    registered.forEach(c => combinedMap.set(c.email, c));

    setCustomers(Array.from(combinedMap.values()));
  };

  useEffect(() => {
    // Rigid Firewall Check: Enforce Admin Identity Exclusivity instantly
    const role = localStorage.getItem("userRole");
    if (role !== "admin") {
       navigate("/login");
       return;
    }

    const fetchCloudBookings = async () => {
       try {
          const resp = await fetch("http://localhost:5000/api/bookings");
          if (resp.ok) {
             const data = await resp.json();
             setLiveRealTimeBookings(data);
          }
       } catch(err) { console.error("Cloud fetch failed."); }
    };
    const fetchCloudWorkers = async () => {
       try {
          const resp = await fetch("http://localhost:5000/api/workers");
          if (resp.ok) {
             const data = await resp.json();
             setWorkers(data);
          }
       } catch(err) { console.error("Workers cloud fetch failed."); }
    };

    fetchCloudBookings();
    fetchCloudWorkers();
    syncAdminStore();
    // Poll every 3 seconds to ensure instant real-time data sync across modules
    const interval = setInterval(syncAdminStore, 3000);
    return () => clearInterval(interval);
  }, []);

  const getCustomerSpent = (customerName) => {
    const customerTransactions = transactions.filter(t => t.customer && t.customer.toLowerCase() === customerName.toLowerCase());
    const liveSum = customerTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    if (liveSum > 0) return `₹${liveSum}`;
    if (customerName === "Harsha Vardhan") return "₹5,400";
    if (customerName === "Amit Khanna") return "₹1,800";
    if (customerName === "Anjali Sen") return "₹3,200";
    return "₹0";
  };

  const handleDeleteCustomer = (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete customer account "${name}"?`)) {
      setCustomers(customers.filter(c => c.id !== id));
      alert(`Customer account "${name}" deleted successfully.`);
    }
  };

  // Calculate true database stats dynamically from loaded bookings
  const totalRevenue = liveRealTimeBookings
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const averageBookingValue = liveRealTimeBookings.length > 0
    ? Math.round(totalRevenue / liveRealTimeBookings.length)
    : 0;

  // Add Service Handler
  const handleAddService = (e) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceIcon.trim()) return;

    const newSvc = {
      id: newServiceName.trim().toLowerCase().replace(/\s+/g, "-"),
      name: newServiceName.trim(),
      icon: newServiceIcon.trim()
    };

    setServices([...services, newSvc]);
    setNewServiceName("");
    setNewServiceIcon("");
    alert("New service successfully added! 🚀");
  };

  // Remove Service Handler
  const handleRemoveService = (id) => {
    if (window.confirm("Are you sure you want to remove this service?")) {
      setServices(services.filter((s) => s.id !== id));
    }
  };

  // Add Sub-Service Handler
  const handleAddSubService = (e) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubIcon.trim()) return;

    const newSub = {
      id: newSubName.trim().toLowerCase().replace(/\s+/g, "_"),
      name: newSubName.trim(),
      icon: newSubIcon.trim()
    };

    const updated = services.map(s => {
      if (s.id === selectedMainSvc) {
        return {
          ...s,
          subServices: [...(s.subServices || []), newSub]
        };
      }
      return s;
    });

    setServices(updated);
    setNewSubName("");
    setNewSubIcon("");
    alert("New sub-service category successfully added! 🌟");
  };

  // Remove Sub-Service Handler
  const handleRemoveSubService = (svcId, subId) => {
    if (window.confirm("Are you sure you want to remove this sub-service category?")) {
      const updated = services.map(s => {
        if (s.id === svcId) {
          return {
            ...s,
            subServices: (s.subServices || []).filter(sub => sub.id !== subId)
          };
        }
        return s;
      });
      setServices(updated);
      alert("Sub-service category removed successfully! 🗑️");
    }
  };

  // Edit Sub-Service Handler
  const handleSaveEditSub = (e) => {
    e.preventDefault();
    if (!editingSub || !editingSub.name.trim() || !editingSub.icon.trim()) return;

    const updated = services.map(s => {
      if (s.id === editingSub.svcId) {
        return {
          ...s,
          subServices: (s.subServices || []).map(sub => {
            if (sub.id === editingSub.subId) {
              return { ...sub, name: editingSub.name.trim(), icon: editingSub.icon.trim() };
            }
            return sub;
          })
        };
      }
      return s;
    });

    setServices(updated);
    setEditingSub(null);
    alert("Sub-service category updated successfully! ✏️");
  };

  // Toggle Worker Status (Block / Active)
  // Toggle Worker Status physically in Database
  const toggleWorkerStatus = async (id) => {
    const worker = workers.find(w => w._id === id);
    if (!worker) return;
    
    const newStatus = worker.status === "Active" ? "Blocked" : "Active";
    try {
       await fetch(`http://localhost:5000/api/workers/${id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ status: newStatus })
       });
       
       setWorkers(workers.map(w => w._id === id ? { ...w, status: newStatus } : w));
       alert(`Worker "${worker.name}" has been ${newStatus} globally!`);
    } catch(err) { alert("Cloud update failed"); }
  };

  // Dynamically Adjust Worker Price based on Performance
  const updateWorkerPrice = async (id, currentPrice) => {
    const worker = workers.find(w => w._id === id);
    if (!worker) return;
    
    const newPrice = window.prompt(`Enter new base rate for "${worker.name}" (Current: ₹${currentPrice || 0}):`, currentPrice);
    if (!newPrice || isNaN(newPrice)) return;
    
    try {
       const resp = await fetch(`http://localhost:5000/api/workers/${id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ price: Number(newPrice) })
       });
       if (!resp.ok) throw new Error("Price patch failed");
       
       setWorkers(workers.map(w => w._id === id ? { ...w, price: Number(newPrice) } : w));
       alert(`Successfully updated performance price for ${worker.name} to ₹${newPrice}!`);
    } catch(err) { alert("Failed to update cloud price profile."); }
  };

  // Permanently Delete Worker physically in Database
  const handleRemoveWorker = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete worker "${name}"? This cannot be undone.`)) {
       try {
          await fetch(`http://localhost:5000/api/workers/${id}`, {
            method: "DELETE"
          });
          setWorkers(workers.filter(w => w._id !== id));
          alert(`Worker "${name}" has been completely removed from the system.`);
       } catch(err) { alert("Cloud delete failed."); }
    }
  };

  // Toggle Customer Status


  // Handle Complaint Verdict
  const handleComplaintVerdict = async (id, verdict) => {
    try {
       const resp = await fetch(`http://localhost:5000/api/complaints/${id}/resolve`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verdict })
       });
       if (!resp.ok) throw new Error("Server rejected patch.");
       
       alert(`⚖️ DECISION RECORDED!\nComplaint resolved as ${verdict} inside physical cloud ledger.`);
       syncAdminStore();
    } catch(err) { alert(`🛑 Failed to resolve decision: ${err.message}`); }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ display: "flex", flex: 1 }}>
        {/* Left Sidebar */}
        <div
          style={{
            width: "280px",
            backgroundColor: "#1e293b",
            color: "white",
            padding: "30px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "4px 0 10px rgba(0,0,0,0.05)"
          }}
        >

          {[
            { id: "overview", name: "Overview & Revenue", icon: "📊" },
            { id: "services", name: "Manage Services", icon: "🛠️" },
            { id: "workers", name: "Manage Workers", icon: "👷" },
            { id: "customers", name: "Manage Customers", icon: "👤" },
            { id: "complaints", name: `Complaints (${complaints.filter(c => c.status === "Under Review" || c.adminVerdict === "Pending").length})`, icon: "⚠️" },
            { id: "plans-offers", name: "Manage Plans & Offers", icon: "🏷️" },
            { id: "escrow-payouts", name: "Escrow Payouts 💰", icon: "💸" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                width: "100%",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeTab === tab.id ? "var(--primary)" : "transparent",
                color: activeTab === tab.id ? "white" : "#cbd5e1",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = "#334155";
                  e.currentTarget.style.color = "white";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#cbd5e1";
                }
              }}
            >
              <span style={{ fontSize: "18px" }}>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Right Main Dashboard Area */}
        <div style={{ flex: 1, padding: "40px" }}>
          
          {/* TAB 1: OVERVIEW & REVENUE */}
          {activeTab === "overview" && (
            <div>
              <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: 800, color: "#1e293b" }}>
                System Overview & Revenue
              </h2>

              {/* Stats Card Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Payments Volume</span>
                  <h2 style={{ margin: "10px 0 0 0", fontSize: "32px", fontWeight: 800, color: "var(--primary)" }}>₹{totalRevenue}</h2>
                </div>
                <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Average Booking Value</span>
                  <h2 style={{ margin: "10px 0 0 0", fontSize: "32px", fontWeight: 800, color: "#3b82f6" }}>₹{averageBookingValue.toFixed(0)}</h2>
                </div>
                <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Registered Workers</span>
                  <h2 style={{ margin: "10px 0 0 0", fontSize: "32px", fontWeight: 800, color: "#1e293b" }}>{workers.length}</h2>
                </div>
                <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Registered Customers</span>
                  <h2 style={{ margin: "10px 0 0 0", fontSize: "32px", fontWeight: 800, color: "#1e293b" }}>{customers.length}</h2>
                </div>
              </div>

              {/* Graphical Statistics Section */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "25px", marginBottom: "40px" }}>
                {/* Bookings Status Distribution Chart */}
                <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800, color: "#1e293b" }}>Bookings & Order Dynamics</h3>
                  <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "#64748b" }}>Real-time service request allocation and order statuses</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Active/Upcoming Requests */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", fontWeight: 700 }}>
                        <span style={{ color: "#3b82f6" }}>🔵 Active & Upcoming Bookings</span>
                        <span style={{ color: "#1e293b" }}>
                          {bookings.filter(b => b.status === "Upcoming" || b.status === "Accepted").length} orders ({Math.round((bookings.filter(b => b.status === "Upcoming" || b.status === "Accepted").length / (bookings.length || 1)) * 100)}%)
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "10px", backgroundColor: "#eff6ff", borderRadius: "5px", overflow: "hidden" }}>
                        <div style={{
                          width: `${(bookings.filter(b => b.status === "Upcoming" || b.status === "Accepted").length / (bookings.length || 1)) * 100}%`,
                          height: "100%",
                          backgroundColor: "#3b82f6",
                          borderRadius: "5px",
                          transition: "width 0.5s ease"
                        }} />
                      </div>
                    </div>

                    {/* Completed Requests */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", fontWeight: 700 }}>
                        <span style={{ color: "var(--success)" }}>🟢 Completed Bookings</span>
                        <span style={{ color: "#1e293b" }}>
                          {bookings.filter(b => b.status === "Completed").length} orders ({Math.round((bookings.filter(b => b.status === "Completed").length / (bookings.length || 1)) * 100)}%)
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "10px", backgroundColor: "#ecfdf5", borderRadius: "5px", overflow: "hidden" }}>
                        <div style={{
                          width: `${(bookings.filter(b => b.status === "Completed").length / (bookings.length || 1)) * 100}%`,
                          height: "100%",
                          backgroundColor: "var(--success)",
                          borderRadius: "5px",
                          transition: "width 0.5s ease"
                        }} />
                      </div>
                    </div>

                    {/* Cancelled/Rejected Requests */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", fontWeight: 700 }}>
                        <span style={{ color: "#ef4444" }}>🔴 Cancelled & Rejected Orders</span>
                        <span style={{ color: "#1e293b" }}>
                          {bookings.filter(b => b.status === "Rejected").length} orders ({Math.round((bookings.filter(b => b.status === "Rejected").length / (bookings.length || 1)) * 100)}%)
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "10px", backgroundColor: "#fef2f2", borderRadius: "5px", overflow: "hidden" }}>
                        <div style={{
                          width: `${(bookings.filter(b => b.status === "Rejected").length / (bookings.length || 1)) * 100}%`,
                          height: "100%",
                          backgroundColor: "#ef4444",
                          borderRadius: "5px",
                          transition: "width 0.5s ease"
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Growth Trend SVG Chart */}
                <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800, color: "#1e293b" }}>Revenue & Transactions History</h3>
                  <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "#64748b" }}>Cumulative system transaction volume over time</p>
                  
                  <div style={{ position: "relative", width: "100%", height: "160px" }}>
                    <svg viewBox="0 0 400 150" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--success)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="var(--success)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1.5" />
                      <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeWidth="1.5" />
                      <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1.5" />
                      
                      {/* Dynamic Area Fill */}
                      <path d="M 0 120 Q 80 80 160 90 T 320 40 L 400 30 L 400 140 L 0 140 Z" fill="url(#chartGradient)" />
                      
                      {/* Smooth Curve Path */}
                      <path d="M 0 120 Q 80 80 160 90 T 320 40 L 400 30" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" />
                      
                      {/* Interactive Dots */}
                      <circle cx="80" cy="95" r="5" fill="var(--success)" stroke="white" strokeWidth="2" />
                      <circle cx="160" cy="90" r="5" fill="var(--success)" stroke="white" strokeWidth="2" />
                      <circle cx="240" cy="65" r="5" fill="var(--success)" stroke="white" strokeWidth="2" />
                      <circle cx="320" cy="40" r="5" fill="var(--success)" stroke="white" strokeWidth="2" />
                      <circle cx="400" cy="30" r="6" fill="var(--success)" stroke="white" strokeWidth="3" />
                    </svg>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>
                    <span>JAN</span>
                    <span>FEB</span>
                    <span>MAR</span>
                    <span>APR</span>
                    <span>MAY (LIVE)</span>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 800, color: "#1e293b" }}>Recent Payment Transactions</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b" }}>
                      <th style={{ padding: "12px" }}>Transaction ID</th>
                      <th style={{ padding: "12px" }}>Customer</th>
                      <th style={{ padding: "12px" }}>Professional</th>
                      <th style={{ padding: "12px" }}>Service</th>
                      <th style={{ padding: "12px" }}>Date</th>
                      <th style={{ padding: "12px" }}>Amount</th>
                      <th style={{ padding: "12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px", fontWeight: "bold" }}>{t.id}</td>
                        <td style={{ padding: "12px" }}>{t.customer}</td>
                        <td style={{ padding: "12px" }}>{t.worker}</td>
                        <td style={{ padding: "12px" }}>{t.service}</td>
                        <td style={{ padding: "12px" }}>{t.date}</td>
                        <td style={{ padding: "12px", fontWeight: 800, color: "var(--primary)" }}>₹{t.amount}</td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: 700,
                              backgroundColor: t.status === "Paid" ? "var(--primary-light)" : "#ffebee",
                              color: t.status === "Paid" ? "var(--primary-dark)" : "#c62828"
                            }}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE SERVICES */}
          {activeTab === "services" && (
            <div>
              <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: 800, color: "#1e293b" }}>
                Manage Service Categories
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "30px", alignItems: "start" }}>
                {/* Form to add service */}
                <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>Add New Service</h3>
                  <form onSubmit={handleAddService} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Service Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Gardening"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Service Emoji Icon</label>
                      <input
                        type="text"
                        placeholder="e.g. 🏡"
                        value={newServiceIcon}
                        onChange={(e) => setNewServiceIcon(e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{
                        backgroundColor: "var(--primary)",
                        color: "white",
                        border: "none",
                        padding: "12px",
                        borderRadius: "6px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        marginTop: "10px"
                      }}
                    >
                      Create Service Category
                    </button>
                  </form>
                </div>

                {/* Active Services Grid */}
                <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 800, color: "#1e293b" }}>Active Service Offerings</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
                    {services.map((svc) => (
                      <div
                        key={svc.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "16px",
                          textAlign: "center",
                          position: "relative",
                          backgroundColor: "#f8fafc"
                        }}
                      >
                        <div style={{ fontSize: "36px", marginBottom: "8px" }}>{svc.icon}</div>
                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "14px", marginBottom: "12px" }}>{svc.name}</div>
                        <button
                          onClick={() => handleRemoveService(svc.id)}
                          style={{
                            backgroundColor: "#fee2e2",
                            color: "#ef4444",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer"
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* 🌟 HIERARCHICAL ALL SUB-CATEGORIES LISTING SECTION */}
                  <div style={{ marginTop: "40px", borderTop: "2px dashed #e2e8f0", paddingTop: "30px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#1e293b" }}>Manage All Sub-Categories</h3>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>Add, edit and remove sub-services across all main service categories at once</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#475569" }}>Add To Category:</span>
                        <select 
                          value={selectedMainSvc} 
                          onChange={(e) => setSelectedMainSvc(e.target.value)}
                          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white", fontWeight: "bold" }}
                        >
                          {services.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Add Sub-service form */}
                    <form onSubmit={handleAddSubService} style={{ display: "flex", gap: "12px", backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                      <input 
                        type="text" 
                        placeholder={`New sub-category under ${services.find(s => s.id === selectedMainSvc)?.name || "selected category"}`} 
                        value={newSubName} 
                        onChange={(e) => setNewSubName(e.target.value)}
                        required
                        style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                      <input 
                        type="text" 
                        placeholder="Emoji Icon (e.g. 🛋️)" 
                        value={newSubIcon} 
                        onChange={(e) => setNewSubIcon(e.target.value)}
                        required
                        style={{ width: "160px", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                      <button 
                        type="submit" 
                        style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                      >
                        Add Sub-Category
                      </button>
                    </form>

                    {/* Edit Sub-service inline form */}
                    {editingSub && (
                      <form onSubmit={handleSaveEditSub} style={{ display: "flex", gap: "12px", backgroundColor: "#fffbeb", padding: "16px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #fef3c7" }}>
                        <span style={{ alignSelf: "center", fontWeight: "bold", fontSize: "14px", color: "#b45309" }}>Editing Sub-Category:</span>
                        <input 
                          type="text" 
                          value={editingSub.name} 
                          onChange={(e) => setEditingSub({ ...editingSub, name: e.target.value })}
                          required
                          style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #fcd34d" }}
                        />
                        <input 
                          type="text" 
                          value={editingSub.icon} 
                          onChange={(e) => setEditingSub({ ...editingSub, icon: e.target.value })}
                          required
                          style={{ width: "120px", padding: "10px", borderRadius: "6px", border: "1px solid #fcd34d" }}
                        />
                        <button 
                          type="submit" 
                          style={{ padding: "10px 20px", backgroundColor: "#d97706", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          Save Changes
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingSub(null)}
                          style={{ padding: "10px 16px", backgroundColor: "#e2e8f0", color: "#475569", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </form>
                    )}

                    {/* All Categories & Sub-services Hierarchy List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {services.map((svc) => (
                        <div 
                          key={svc.id} 
                          style={{ 
                            padding: "20px", border: "1px solid #e2e8f0", borderRadius: "10px", 
                            backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" 
                          }}
                        >
                          <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "20px" }}>{svc.icon}</span>
                            <span>{svc.name} Sub-Categories</span>
                            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "20px" }}>
                              {((svc.subServices) || []).length} active
                            </span>
                          </h4>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "12px" }}>
                            {(!svc.subServices || svc.subServices.length === 0) ? (
                              <p style={{ gridColumn: "1/-1", color: "#94a3b8", fontSize: "13px", margin: 0, fontStyle: "italic" }}>
                                No sub-categories defined yet. Choose this category in the selector above to add one!
                              </p>
                            ) : (
                              svc.subServices.map((sub) => (
                                <div 
                                  key={sub.id} 
                                  style={{ 
                                    display: "flex", alignItems: "center", justifyContent: "space-between", 
                                    border: "1px solid #f1f5f9", padding: "10px 14px", borderRadius: "8px", backgroundColor: "#f8fafc" 
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "20px" }}>{sub.icon}</span>
                                    <span style={{ fontSize: "13px", fontWeight: "bold", color: "#334155" }}>{sub.name}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    <button 
                                      onClick={() => setEditingSub({ svcId: svc.id, subId: sub.id, name: sub.name, icon: sub.icon })}
                                      style={{ backgroundColor: "#fef3c7", color: "#d97706", border: "none", padding: "3px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveSubService(svc.id, sub.id)}
                                      style={{ backgroundColor: "#fee2e2", color: "#ef4444", border: "none", padding: "3px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE WORKERS */}
          {activeTab === "workers" && (
            <div>
              <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: 800, color: "#1e293b" }}>
                Manage Service Professionals
              </h2>

              <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                {/* Workers Filter Bar */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    <input
                      type="text"
                      placeholder="🔍 Search workers by name, city, specialty..."
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 16px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <select
                      value={workerFilterStatus}
                      onChange={(e) => setWorkerFilterStatus(e.target.value)}
                      style={{
                        padding: "11px 16px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        backgroundColor: "white",
                        cursor: "pointer",
                        outline: "none"
                      }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">🟢 Active</option>
                      <option value="Blocked">🔴 Blocked</option>
                    </select>
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                    Found: {filteredWorkers.length} workers
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b" }}>
                      <th style={{ padding: "12px" }}>Name</th>
                      <th style={{ padding: "12px" }}>Specialty</th>
                      <th style={{ padding: "12px" }}>Location</th>
                      <th style={{ padding: "12px" }}>Base Rate (₹)</th>
                      <th style={{ padding: "12px" }}>Rating</th>
                      <th style={{ padding: "12px" }}>Status</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map((w) => (
                      <tr key={w._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px", fontWeight: 700, color: "#1e293b" }}>{w.name}</td>
                        <td style={{ padding: "12px" }}>{w.service}</td>
                        <td style={{ padding: "12px" }}>📍 {w.city}</td>
                        <td style={{ padding: "12px", fontWeight: "800", color: "var(--success)" }}>₹{w.price || 0}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ color: "#f59e0b", marginRight: "4px" }}>⭐</span>
                          <strong>{w.rating}</strong> ({w.reviews} reviews)
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: 700,
                              backgroundColor: w.status === "Active" ? "var(--primary-light)" : "#ffebee",
                              color: w.status === "Active" ? "var(--primary-dark)" : "#c62828"
                            }}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          {/* 📈 EDIT RATE ACTION */}
                          <button
                            onClick={() => updateWorkerPrice(w._id, w.price)}
                            style={{
                              backgroundColor: "#e8f5e9",
                              color: "#2e7d32",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontWeight: "bold",
                              fontSize: "12px",
                              cursor: "pointer",
                              marginRight: "8px"
                            }}
                          >
                            Edit Rate
                          </button>
                          
                          <button
                            onClick={() => toggleWorkerStatus(w._id)}
                            style={{
                              backgroundColor: w.status === "Active" ? "#fff3e0" : "var(--primary-light)",
                              color: w.status === "Active" ? "#e65100" : "var(--primary-dark)",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontWeight: "bold",
                              fontSize: "12px",
                              cursor: "pointer",
                              marginRight: "8px"
                            }}
                          >
                            {w.status === "Active" ? "Block" : "Unblock"}
                          </button>
                          <button
                            onClick={() => handleRemoveWorker(w._id, w.name)}
                            style={{
                              backgroundColor: "#ffebee",
                              color: "#c62828",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontWeight: "bold",
                              fontSize: "12px",
                              cursor: "pointer"
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MANAGE CUSTOMERS */}
          {activeTab === "customers" && (
            <div>
              <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: 800, color: "#1e293b" }}>
                Manage Registered Customers
              </h2>

              <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                {/* Customers Filter Bar */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    <input
                      type="text"
                      placeholder="🔍 Search customers by name, email, phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 16px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                    Found: {filteredCustomers.length} customers
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b" }}>
                      <th style={{ padding: "12px" }}>Name</th>
                      <th style={{ padding: "12px" }}>Email</th>
                      <th style={{ padding: "12px" }}>Phone</th>
                      <th style={{ padding: "12px" }}>Total Bookings</th>
                      <th style={{ padding: "12px" }}>Payments Spent</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px", fontWeight: 700, color: "#1e293b" }}>{c.name}</td>
                        <td style={{ padding: "12px" }}>{c.email}</td>
                        <td style={{ padding: "12px" }}>{c.phone}</td>
                        <td style={{ padding: "12px", fontWeight: "bold" }}>{c.bookings} bookings</td>
                        <td style={{ padding: "12px", fontWeight: 800, color: "var(--primary-dark)" }}>{getCustomerSpent(c.name)}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <button
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            style={{
                              backgroundColor: "#fee2e2",
                              color: "#ef4444",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontWeight: "bold",
                              fontSize: "12px",
                              cursor: "pointer"
                            }}
                          >
                            Delete Account 🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: MANAGE COMPLAINTS */}
          {activeTab === "complaints" && (
            <div>
              <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: 800, color: "#1e293b" }}>
                Manage Customer Complaints & Moderation
              </h2>

              <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                {complaints.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>No complaints registered yet! All systems clear. ✅</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b" }}>
                        <th style={{ padding: "12px" }}>ID</th>
                        <th style={{ padding: "12px" }}>Customer</th>
                        <th style={{ padding: "12px" }}>Worker Details (ID & Name)</th>
                        <th style={{ padding: "12px" }}>Complaint Detail</th>
                        <th style={{ padding: "12px" }}>Date</th>
                        <th style={{ padding: "12px" }}>Verdict Status</th>
                        <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((c) => (
                        <tr key={c._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px", fontWeight: "bold", fontSize: 11 }}>{c._id?.substr(-6).toUpperCase()}</td>
                          <td style={{ padding: "12px" }}>{c.reported_by || "User"}</td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontWeight: "bold", color: "#dc2626" }}>⚠️ {c.issue_type}</div>
                            <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, marginTop: "2px", backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>
                              Booking: {c.booking_id?.substr(-6) || "N/A"}
                            </div>
                          </td>
                          <td style={{ padding: "12px", color: "#475569", fontSize: 13, fontStyle: "italic" }}>"{c.description}"</td>
                          <td style={{ padding: "12px", fontSize: 12 }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recent"}</td>
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 700,
                                backgroundColor: c.admin_verdict === "Valid" ? "#ffebee" : c.admin_verdict === "Pending" ? "#fff3e0" : "#f0fdf4",
                                color: c.admin_verdict === "Valid" ? "#c62828" : c.admin_verdict === "Pending" ? "#e65100" : "#16a34a"
                              }}
                            >
                              {c.admin_verdict || "Under Review"}
                            </span>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            {c.admin_verdict === "Pending" || !c.admin_verdict ? (
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                <button
                                  onClick={() => handleComplaintVerdict(c._id, "Valid")}
                                  style={{ backgroundColor: "#ef4444", color: "white", border: "none", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                                >
                                  Valid (Deduct ⭐)
                                </button>
                                <button
                                  onClick={() => handleComplaintVerdict(c._id, "Dismissed")}
                                  style={{ backgroundColor: "#e2e8f0", color: "#475569", border: "none", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                                >
                                  Dismiss
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "bold" }}>✅ DECIDED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: MANAGE PLANS & OFFERS */}
          {activeTab === "plans-offers" && (
            <div>
              <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: 800, color: "#1e293b" }}>
                Manage Custom Service Plans & Seasonal Offers
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "40px" }}>
                {/* 1. PLANS MANAGEMENT */}
                <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>
                    {editingPlan ? "✏️ Edit Service Plan" : "➕ Create New Service Plan"}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                    <input 
                      type="text" 
                      placeholder="Plan Title (e.g. 🩺 Doctors Annual Family Plan)" 
                      value={planForm.title} 
                      onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                      style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <input 
                        type="text" 
                        placeholder="Price (e.g. ₹2,999)" 
                        value={planForm.price} 
                        onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                      <select 
                        value={planForm.period} 
                        onChange={(e) => setPlanForm({ ...planForm, period: e.target.value })}
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      >
                        <option value="year">per year</option>
                        <option value="month">per month</option>
                      </select>
                    </div>
                    <textarea 
                      placeholder="Features (comma-separated list, e.g. Unlimited consultations, 24/7 dedicated medical helpdesk)" 
                      value={planForm.features} 
                      onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                      style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", minHeight: "80px", fontFamily: "inherit" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <input 
                        type="text" 
                        placeholder="Theme Color (e.g. #0284c7)" 
                        value={planForm.color} 
                        onChange={(e) => setPlanForm({ ...planForm, color: e.target.value })}
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                      <input 
                        type="text" 
                        placeholder="Button Text (e.g. Subscribe Now)" 
                        value={planForm.btnText} 
                        onChange={(e) => setPlanForm({ ...planForm, btnText: e.target.value })}
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <select
                      value={planForm.workerId}
                      onChange={(e) => setPlanForm({ ...planForm, workerId: e.target.value })}
                      style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white" }}
                    >
                      <option value="">Assign Worker Based on Plan (Optional)</option>
                      {workers.map(w => (
                        <option key={w._id} value={w._id}>{w.name} (ID: {w._id.substr(-6).toUpperCase()} - {w.service})</option>
                      ))}
                    </select>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button 
                        onClick={() => {
                          if (!planForm.title || !planForm.price) { alert("Please fill in Title and Price!"); return; }
                          const currentPlans = getPlans();
                          const featuresArray = typeof planForm.features === "string" ? planForm.features.split(",").map(f => f.trim()).filter(Boolean) : planForm.features;
                          if (editingPlan) {
                            const updated = currentPlans.map(p => p.id === editingPlan.id ? { ...p, ...planForm, features: featuresArray } : p);
                            savePlans(updated);
                            setEditingPlan(null);
                          } else {
                            const newPlan = { id: "PLN" + Date.now(), ...planForm, features: featuresArray };
                            savePlans([...currentPlans, newPlan]);
                          }
                          setPlanForm({ title: "", price: "", features: "", color: "#4f46e5", btnText: "Subscribe Now", workerId: "" });
                          syncAdminStore();
                        }}
                        style={{ backgroundColor: "var(--primary)", color: "white", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", flex: 1 }}
                      >
                        {editingPlan ? "Update Plan" : "Create Plan"}
                      </button>
                      {editingPlan && (
                        <button 
                          onClick={() => {
                            setEditingPlan(null);
                            setPlanForm({ title: "", price: "", features: "", color: "#4f46e5", btnText: "Subscribe Now", workerId: "" });
                          }}
                          style={{ backgroundColor: "#e2e8f0", color: "#475569", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                        <th style={{ padding: "8px" }}>Title</th>
                        <th style={{ padding: "8px" }}>Price</th>
                        <th style={{ padding: "8px" }}>Assigned Worker</th>
                        <th style={{ padding: "8px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminPlans.map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px", fontWeight: "bold" }}>{p.title}</td>
                          <td style={{ padding: "8px" }}>{p.price}/{p.period || "year"}</td>
                          <td style={{ padding: "8px", fontWeight: "600", color: "#475569" }}>
                            {p.workerId ? `${workers.find(w => String(w.id) === String(p.workerId))?.name || "Unknown"} (ID: ${p.workerId})` : "None"}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right" }}>
                            <button 
                              onClick={() => {
                                setEditingPlan(p);
                                setPlanForm({ title: p.title, price: p.price, features: p.features.join(", "), color: p.color || "#4f46e5", btnText: p.btnText || "Subscribe Now", workerId: p.workerId || "" });
                              }}
                              style={{ backgroundColor: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", marginRight: "6px", cursor: "pointer" }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm("Delete this plan?")) {
                                  savePlans(getPlans().filter(pl => pl.id !== p.id));
                                  syncAdminStore();
                                }
                              }}
                              style={{ backgroundColor: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 2. OFFERS MANAGEMENT */}
                <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>
                    {editingOffer ? "✏️ Edit Active Coupon" : "➕ Create New Active Coupon"}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                    <input 
                      type="text" 
                      placeholder="Coupon Code (e.g. DOCFREE)" 
                      value={offerForm.code} 
                      onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value })}
                      style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <input 
                        type="text" 
                        placeholder="Discount Tag (e.g. Flat ₹150 Off)" 
                        value={offerForm.discount} 
                        onChange={(e) => setOfferForm({ ...offerForm, discount: e.target.value })}
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                      <input 
                        type="text" 
                        placeholder="Expiry (e.g. Ends May 31)" 
                        value={offerForm.expiry} 
                        onChange={(e) => setOfferForm({ ...offerForm, expiry: e.target.value })}
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Offer Description (e.g. Valid on all Doctor consult bookings.)" 
                      value={offerForm.desc} 
                      onChange={(e) => setOfferForm({ ...offerForm, desc: e.target.value })}
                      style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button 
                        onClick={() => {
                          if (!offerForm.code || !offerForm.discount) { alert("Please fill in Coupon Code and Discount!"); return; }
                          const currentOffers = getOffers();
                          if (editingOffer) {
                            const updated = currentOffers.map(o => o.id === editingOffer.id ? { ...o, ...offerForm } : o);
                            saveOffers(updated);
                            setEditingOffer(null);
                          } else {
                            const newOffer = { id: "OFR" + Date.now(), ...offerForm };
                            saveOffers([...currentOffers, newOffer]);
                          }
                          setOfferForm({ code: "", discount: "", desc: "", expiry: "" });
                          syncAdminStore();
                        }}
                        style={{ backgroundColor: "var(--primary)", color: "white", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", flex: 1 }}
                      >
                        {editingOffer ? "Update Coupon" : "Create Coupon"}
                      </button>
                      {editingOffer && (
                        <button 
                          onClick={() => {
                            setEditingOffer(null);
                            setOfferForm({ code: "", discount: "", desc: "", expiry: "" });
                          }}
                          style={{ backgroundColor: "#e2e8f0", color: "#475569", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                        <th style={{ padding: "8px" }}>Code</th>
                        <th style={{ padding: "8px" }}>Discount</th>
                        <th style={{ padding: "8px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminOffers.map(o => (
                        <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px", fontWeight: "bold" }}>{o.code}</td>
                          <td style={{ padding: "8px" }}>{o.discount}</td>
                          <td style={{ padding: "8px", textAlign: "right" }}>
                            <button 
                              onClick={() => {
                                setEditingOffer(o);
                                setOfferForm({ code: o.code, discount: o.discount, desc: o.desc, expiry: o.expiry });
                              }}
                              style={{ backgroundColor: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", marginRight: "6px", cursor: "pointer" }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm("Delete this coupon?")) {
                                  saveOffers(getOffers().filter(of => of.id !== o.id));
                                  syncAdminStore();
                                }
                              }}
                              style={{ backgroundColor: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "escrow-payouts" && (
            <div className="fade-in" style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ margin: "0 0 6px", fontWeight: 800, color: "#1e293b" }}>Admin Escrow Approvals</h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Approve & Release locked payments to workers after successful job completion.</p>
                </div>
                <div style={{ backgroundColor: "#e0e7ff", padding: "10px 20px", borderRadius: "8px", color: "#4338ca", fontWeight: 700 }}>
                  🔐 System Hold: ₹{liveRealTimeBookings.filter(b => b.status === "Completed").reduce((a, b) => a + b.price, 0)}
                </div>
              </div>

              <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "24px" }}>
                {liveRealTimeBookings.filter(b => ["Completed", "Paid Out"].includes(b.status)).length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: "48px 0" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>⚖️</div>
                    <h3>No pending escrows found.</h3>
                    <p>Awaiting completion signals from active workers.</p>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontSize: "13px" }}>
                        <th style={{ padding: "12px 8px" }}>Booking ID</th>
                        <th style={{ padding: "12px 8px" }}>Service</th>
                        <th style={{ padding: "12px 8px" }}>Locked Amt</th>
                        <th style={{ padding: "12px 8px" }}>Current Status</th>
                        <th style={{ padding: "12px 8px", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveRealTimeBookings.filter(b => ["Completed", "Paid Out"].includes(b.status)).map(b => (
                        <tr key={b._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 8px", fontFamily: "monospace", fontSize: "12px" }}>#{b._id.substr(-6).toUpperCase()}</td>
                          <td style={{ padding: "14px 8px", fontWeight: 600, color: "#334155" }}>{b.service}</td>
                          <td style={{ padding: "14px 8px", fontWeight: 700, color: "#16a34a" }}>₹{b.price}</td>
                          <td style={{ padding: "14px 8px" }}>
                            <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, backgroundColor: b.status === "Paid Out" ? "#dcfce7" : "#fff3e0", color: b.status === "Paid Out" ? "#16a34a" : "#e65100" }}>
                              {b.status === "Paid Out" ? "✓ SENT TO WORKER" : "🔒 HELD BY ADMIN"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 8px", textAlign: "right" }}>
                            {b.status !== "Paid Out" ? (
                              <button 
                                onClick={async () => {
                                  if(window.confirm(`Verify completion and release ₹${b.price} directly to the Worker account now?`)) {
                                     try {
                                       const respAction = await fetch(`http://localhost:5000/api/bookings/${b._id}/release`, {
                                         method: "POST"
                                       });
                                       if (!respAction.ok) {
                                          const errorData = await respAction.json();
                                          throw new Error(errorData.error || "Server Rejected Release");
                                       }
                                       alert(`💸 FUNDS RELEASED SUCCESSFUL!\n₹${b.price} has been deposited into the Worker wallet system.`);
                                       
                                       // Force IMMEDIATE Local Visual Update Flawlessly
                                       setLiveRealTimeBookings(prev => prev.map(item => item._id === b._id ? { ...item, status: "Paid Out" } : item));
                                       
                                       // Verify with central registry refresh
                                       const resp = await fetch("http://localhost:5000/api/bookings");
                                       if (resp.ok) setLiveRealTimeBookings(await resp.json());
                                     } catch(err) { alert(`🛑 Release Failed: ${err.message}`); }
                                  }
                                }}
                                style={{ backgroundColor: "#4338ca", color: "white", border: "none", padding: "8px 14px", borderRadius: "6px", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                              >
                                💸 Release Money
                              </button>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>Completed Successfully</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
