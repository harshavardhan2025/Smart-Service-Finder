import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function AiChatBot() {
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

  // Context containers for AI intelligence
  const [activeOffers, setActiveOffers] = useState([]);
  const [activePlans, setActivePlans] = useState([]);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const parseProblem = (text) => {
    const lowercaseText = text.toLowerCase();

    // 1. AC & Appliances Repair
    if (lowercaseText.includes("ac") || lowercaseText.includes("air cond") || lowercaseText.includes("cooling")) {
      return "AC Repair";
    }
    if (lowercaseText.includes("washing") || lowercaseText.includes("washer") || lowercaseText.includes("dryer") || lowercaseText.includes("laundry")) {
      return "Washing Machine";
    }
    if (lowercaseText.includes("geyser") || lowercaseText.includes("hot water") || lowercaseText.includes("heater")) {
      return "Geyser";
    }
    if (lowercaseText.includes("grinder")) {
      return "Grinder";
    }
    if (lowercaseText.includes("mixer") || lowercaseText.includes("miker") || lowercaseText.includes("mix") || lowercaseText.includes("juicer") || lowercaseText.includes("blender")) {
      return "Mixer";
    }
    if (lowercaseText.includes("fridge") || lowercaseText.includes("refrigerator") || lowercaseText.includes("freezer")) {
      return "Refrigerator";
    }
    if (lowercaseText.includes("purifier") || lowercaseText.includes("ro filter") || lowercaseText.includes("water filter")) {
      return "Water Purifier";
    }

    // 2. Painting Subservices
    if (lowercaseText.includes("putty") || lowercaseText.includes("coating") || lowercaseText.includes("wall putty")) {
      return "Wall Putty Coating";
    }
    if (lowercaseText.includes("indoor paint") || lowercaseText.includes("interior paint") || lowercaseText.includes("room paint")) {
      return "Interior Painting";
    }
    if (lowercaseText.includes("outdoor paint") || lowercaseText.includes("exterior paint") || lowercaseText.includes("building paint")) {
      return "Exterior Painting";
    }
    if (lowercaseText.includes("texture") || lowercaseText.includes("wall art") || lowercaseText.includes("designer finish")) {
      return "Texture & Designer Finishers";
    }
    if (lowercaseText.includes("wallpaper") || lowercaseText.includes("wall sticker") || lowercaseText.includes("wall paper")) {
      return "Wallpaper Installation";
    }
    if (lowercaseText.includes("polish") || lowercaseText.includes("wood polish") || lowercaseText.includes("varnish")) {
      return "Wood Polishing";
    }
    if (lowercaseText.includes("paint") || lowercaseText.includes("color")) {
      return "Interior Painting"; // Default Painting
    }

    // 3. Mechanical
    if (lowercaseText.includes("bike repair") || lowercaseText.includes("motorcycle") || lowercaseText.includes("scooter repair") || lowercaseText.includes("two wheeler")) {
      return "Two-Wheeler (Bikes)";
    }
    if (lowercaseText.includes("car repair") || lowercaseText.includes("car mechanic") || lowercaseText.includes("sedan") || lowercaseText.includes("suv") || lowercaseText.includes("four wheeler")) {
      return "Four-Wheeler (Cars)";
    }
    if (lowercaseText.includes("tractor") || lowercaseText.includes("crane") || lowercaseText.includes("heavy mech")) {
      return "Others (Heavy)";
    }
    if (lowercaseText.includes("repair") || lowercaseText.includes("mechanic") || lowercaseText.includes("engine") || lowercaseText.includes("puncture")) {
      return "Two-Wheeler (Bikes)"; // Default Mechanical
    }

    // 4. Automobile Cleaning
    if (lowercaseText.includes("bike wash") || lowercaseText.includes("scooter wash") || lowercaseText.includes("wash bike")) {
      return "Bike Wash";
    }
    if (lowercaseText.includes("car wash") || lowercaseText.includes("car vacuum") || lowercaseText.includes("wash car")) {
      return "Car Wash";
    }
    if (lowercaseText.includes("cleaning") && (lowercaseText.includes("truck") || lowercaseText.includes("bus") || lowercaseText.includes("tempo"))) {
      return "Others";
    }

    // 5. Cleaning
    if (lowercaseText.includes("mop") || lowercaseText.includes("floor") || lowercaseText.includes("scrub")) {
      return "Floor cleaning";
    }
    if (lowercaseText.includes("dish") || lowercaseText.includes("utensil") || lowercaseText.includes("plate") || lowercaseText.includes("pot")) {
      return "Utensils Cleaning";
    }
    if (lowercaseText.includes("house") || lowercaseText.includes("home") || lowercaseText.includes("deep clean") || lowercaseText.includes("flat")) {
      return "House Cleaning";
    }
    if (lowercaseText.includes("clean") || lowercaseText.includes("maid") || lowercaseText.includes("sweep")) {
      return "House Cleaning"; // Default Cleaning
    }

    // 6. Beauty, Salon & Spa
    // Men's Beauty
    if (lowercaseText.includes("men haircut") || lowercaseText.includes("male haircut") || lowercaseText.includes("boy haircut") || ((lowercaseText.includes("haircut") || lowercaseText.includes("hair cut")) && (lowercaseText.includes("men") || lowercaseText.includes("boy")))) {
      return "Haircut (Men)";
    }
    if (lowercaseText.includes("beard") || lowercaseText.includes("trim beard") || lowercaseText.includes("shave") || lowercaseText.includes("mustache")) {
      return "Beard Trimming (Men)";
    }
    if (lowercaseText.includes("grooming") && (lowercaseText.includes("men") || lowercaseText.includes("groom"))) {
      return "Grooming (Men)";
    }
    if (lowercaseText.includes("spa") && lowercaseText.includes("men")) {
      return "Spa (Men)";
    }
    // Women's Beauty
    if (lowercaseText.includes("women haircut") || lowercaseText.includes("female haircut") || lowercaseText.includes("hair styling") || lowercaseText.includes("hairstyling") || ((lowercaseText.includes("haircut") || lowercaseText.includes("hair cut")) && (lowercaseText.includes("women") || lowercaseText.includes("girl") || lowercaseText.includes("lady")))) {
      return "Haircut (Women)";
    }
    if (lowercaseText.includes("thread") || lowercaseText.includes("eyebrow") || lowercaseText.includes("upper lip")) {
      return "Threading (Women)";
    }
    if (lowercaseText.includes("facial") || lowercaseText.includes("face clean") || lowercaseText.includes("glow")) {
      return "Facials (Women)";
    }
    if (lowercaseText.includes("nail") || lowercaseText.includes("nail polish") || lowercaseText.includes("nail art")) {
      return "Nail Art (Women)";
    }
    if (lowercaseText.includes("manicure") || lowercaseText.includes("pedicure") || lowercaseText.includes("mani pedi")) {
      return "Manicure / pedicure (Women)";
    }
    // General Beauty/Salon fallback (Catches general "haircut" or "hair cut" without gender)
    if (lowercaseText.includes("haircut") || lowercaseText.includes("hair cut") || lowercaseText.includes("salon") || lowercaseText.includes("parlor") || lowercaseText.includes("beauty")) {
      return "Haircut (Men)"; // Serves as the primary haircut fallback match
    }

    // 7. Events
    if (lowercaseText.includes("photo") || lowercaseText.includes("video") || lowercaseText.includes("shoot") || lowercaseText.includes("camera") || lowercaseText.includes("wedding shoot")) {
      return "Photography";
    }
    if (lowercaseText.includes("priest") || lowercaseText.includes("pandit") || lowercaseText.includes("pooja") || lowercaseText.includes("puja") || lowercaseText.includes("purohit") || lowercaseText.includes("havan")) {
      return "Purohit";
    }
    if (lowercaseText.includes("decor") || lowercaseText.includes("balloon") || lowercaseText.includes("flower decoration") || lowercaseText.includes("stage")) {
      return "Decor";
    }
    if (lowercaseText.includes("mehandi") || lowercaseText.includes("henna") || lowercaseText.includes("bridal mehandi")) {
      return "Mehandi";
    }
    if (lowercaseText.includes("makeup") || lowercaseText.includes("cosmetic") || lowercaseText.includes("makeup artist")) {
      return "Makeup";
    }

    // 8. General Standard Services
    if (lowercaseText.includes("switch") || lowercaseText.includes("swit") || lowercaseText.includes("wire") || lowercaseText.includes("electric") || lowercaseText.includes("elec") || lowercaseText.includes("fuse") || lowercaseText.includes("fan") || lowercaseText.includes("light") || lowercaseText.includes("current") || lowercaseText.includes("power")) {
      return "Electrical";
    }
    if (lowercaseText.includes("tap") || lowercaseText.includes("leak") || lowercaseText.includes("pipe") || lowercaseText.includes("sink") || lowercaseText.includes("plumber")) {
      return "Plumbing";
    }
    if (lowercaseText.includes("furniture") || lowercaseText.includes("wood") || lowercaseText.includes("door") || lowercaseText.includes("chair") || lowercaseText.includes("sofa") || lowercaseText.includes("carpenter")) {
      return "Carpentry";
    }
    if (lowercaseText.includes("mover") || lowercaseText.includes("packer") || lowercaseText.includes("shifting") || lowercaseText.includes("luggage")) {
      return "Packers & Movers";
    }
    if (lowercaseText.includes("baby") || lowercaseText.includes("child") || lowercaseText.includes("nanny") || lowercaseText.includes("care")) {
      return "Care takers (baby)";
    }

    return null;
  };

  const getSupportReply = (text) => {
    const lowercaseText = text.toLowerCase().trim();

    // 1. Core Support/Booking guides
    if (lowercaseText.includes("how to book") || lowercaseText.includes("booking")) {
      return "To book a service:\n1. Open the homepage.\n2. Tap on any main category (like Painting, Events, Beauty) to view its sub-services.\n3. Click on your desired sub-service (e.g. AC Repair, Makeup).\n4. Select a nearby professional, click 'View Profile & Book', select your date and time slot, and confirm!";
    }

    if (lowercaseText.includes("payment") || lowercaseText.includes("refund")) {
      return "We support multiple secure payment options including UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery. To see your past transaction receipts, please head over to your 'Profile' section!";
    }

    if (lowercaseText.includes("complaint") || lowercaseText.includes("support") || lowercaseText.includes("issue")) {
      return "I can record any feedback or complaints here. You can also head over to our support portal to generate an official complaint ticket, and our team will get in touch with you within 24 hours.";
    }

    // 2. Informational & Data Queries (Pricing, Offers, Policies, etc.)
    if (lowercaseText.includes("price") || lowercaseText.includes("cost") || lowercaseText.includes("charges") || lowercaseText.includes("rate") || lowercaseText.includes("how much")) {
      return "Prices vary based on the specific service and professional you choose.\n\nTypically:\n- Consultation/Visit: ₹150 - ₹300\n- Basic Repairs: ₹300 - ₹800\n- Specialized Services (AC, Makeup): ₹1000+\n\nYou can see exact pricing on each professional's profile before booking!";
    }

    if (lowercaseText.includes("discount") || lowercaseText.includes("offer") || lowercaseText.includes("coupon") || lowercaseText.includes("promo")) {
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

    if (lowercaseText.includes("cancel") || lowercaseText.includes("reschedule") || lowercaseText.includes("change time")) {
      return "You can easily cancel or reschedule your booking.\n\nJust go to 'My Bookings', select the upcoming service, and tap 'Cancel' or 'Reschedule'. Cancellations made at least 2 hours before the scheduled time are completely free of charge!";
    }

    if (lowercaseText.includes("verify") || lowercaseText.includes("verified") || lowercaseText.includes("safe") || lowercaseText.includes("background check") || lowercaseText.includes("guarantee") || lowercaseText.includes("warranty")) {
      return "🛡️ Your safety is our top priority!\n\nEvery professional on our platform undergoes a strict background check and skill verification. We also provide a 30-day service guarantee on most repair works to ensure complete peace of mind.";
    }

    if (lowercaseText.includes("time") || lowercaseText.includes("hours") || lowercaseText.includes("when") || lowercaseText.includes("open") || lowercaseText.includes("available")) {
      return "Our professionals are typically available from 8:00 AM to 9:00 PM, 7 days a week. During checkout, you can select any available time slot that perfectly fits your schedule!";
    }

    if (lowercaseText.includes("where") || lowercaseText.includes("city") || lowercaseText.includes("cities") || lowercaseText.includes("location") || lowercaseText.includes("bangalore") || lowercaseText.includes("mumbai") || lowercaseText.includes("delhi")) {
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
    const textToSend = typeof overrideText === "string" ? overrideText : inputText;
    if (!textToSend.trim()) return;

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
          { sender: "ai", text: aiReply }
        ]);
      }

    } catch (err) {
      console.error("ChatBot API Fetch Failed, using local fallback", err);
      setIsTyping(false);
      
      // Fallback local logic
      if (matchedCategory) {
        const workers = await fetchDynamicWorkers(matchedCategory);
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
        const replyText = getSupportReply(textToSend);
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: replyText }
        ]);
      }
    }
  };

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
          background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
          boxShadow: "0 8px 24px rgba(139, 92, 246, 0.3)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          zIndex: 1000,
          transition: "transform 0.2s ease",
          color: "white",
          fontSize: "24px"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        💬
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "360px",
            height: "500px",
            backgroundColor: "white",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            borderRadius: "15px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1000,
            border: "1px solid #eee"
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              color: "white",
              padding: "15px",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
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
              onClick={() => setIsOpen(false)}
              style={{ cursor: "pointer", fontSize: "20px" }}
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
              backgroundColor: "#f5f7fb",
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
                    backgroundColor: msg.sender === "user" ? "#8b5cf6" : "white",
                    color: msg.sender === "user" ? "white" : "#333",
                    padding: "10px 14px",
                    borderRadius: msg.sender === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    fontSize: "14px",
                    whiteSpace: "pre-line",
                    border: msg.sender === "user" ? "none" : "1px solid #eef"
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
                          backgroundColor: "white",
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                          padding: "12px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                        }}
                      >
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "14px" }}>
                          {worker.name}
                        </h4>
                        <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "gray", margin: "4px 0" }}>
                          <span>⭐ {worker.rating}</span>
                          <span>🛠️ {worker.experience}</span>
                          <span style={{ color: "green", fontWeight: "bold" }}>💰 ₹{worker.price || 350}</span>
                        </div>
                        <Link 
                          to="/worker"
                          onClick={() => {
                             localStorage.setItem("selected_worker", JSON.stringify(worker));
                             setIsOpen(false);
                          }}
                        >
                          <button
                            style={{
                              width: "100%",
                              padding: "6px",
                              backgroundColor: "#2196F3",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                              fontWeight: "bold",
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
                  backgroundColor: "white",
                  padding: "10px 14px",
                  borderRadius: "12px 12px 12px 0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  fontSize: "12px",
                  color: "gray",
                  border: "1px solid #eef"
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
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #eef2f6",
              overflowX: "auto",
              whiteSpace: "nowrap"
            }}
          >
            {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSendMessage(prompt.query)}
                style={{
                  backgroundColor: "white",
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "20px",
                  padding: "5px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#475569",
                  cursor: "pointer",
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
              borderTop: "1px solid #eee",
              display: "flex",
              gap: "8px",
              backgroundColor: "white"
            }}
          >
            <input
              type="text"
              placeholder="Describe your issue..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                outline: "none",
                fontSize: "14px"
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: "10px 15px",
                backgroundColor: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiChatBot;
