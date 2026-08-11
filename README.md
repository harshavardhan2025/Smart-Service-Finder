# 🚀 Smart Service Finder

**Smart Service Finder** is a premium, AI-powered on-demand home service booking platform designed to instantly connect customers with verified local professionals (Plumbers, Electricians, Carpenters, Doctors, Cleaners, and more).

This platform is built with a state-of-the-art aesthetic and dynamic real-time architecture to deliver a seamless, ultra-premium user experience.

---

## ✨ Key Features

### 🧠 AI Smart Search Hub
- **Natural Language Processing**: Users can search for complex issues (e.g., "My sink is leaking and smells bad") and our integrated AI (`meta/llama-3.1-70b-instruct`) will instantly diagnose the problem and recommend the exact service sub-category required.
- **Voice Search**: Fully integrated Web Speech API allows hands-free voice searching.

### 📍 Hyper-Local Real-Time Tracking
- **Proximity Matching**: The platform dynamically calculates the distance (`distanceKm`) between the customer and active workers.
- **Dynamic Response Times**: Automatically estimates arrival times based on live distance brackets (e.g., `< 1 KM = < 15 Mins`).
- **Geo-Pricing**: Service prices scale dynamically based on the cost of living in the selected city using advanced Geo-Multipliers.

### 💳 Premium Plans & Offers
- **Subscription Tiers**: Users can subscribe to premium plans (Monthly/Yearly) to unlock 100% discounts on base service prices and bypass platform convenience fees.
- **Dynamic Upselling**: Intelligent banners prompt non-subscribed users to upgrade during checkout when it's financially beneficial for them.
- **Custom Coupons**: The system supports highly configurable promotional offers with strict constraints (City limits, usage limits per user, expiration dates).

### 🛡️ Admin Command Center
- **Live Metrics**: Monitor Total Revenue, Active Workers, and Escrow Payouts in real-time.
- **SOS Emergency Monitor**: A dedicated dashboard for tracking critical distress signals sent by field workers.
- **Plan & Offer Management**: Fully functional CRUD interface allowing admins to generate new subscription tiers and marketing coupons on the fly.
- **Defensive Data Handling**: The dashboard is heavily fortified with defensive rendering mechanisms to prevent crashes from incomplete legacy database records.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 18
- **Styling**: Vanilla CSS with modern Glassmorphism, CSS Variables, and dynamic animations.
- **Backend Core**: Node.js & Express
- **Database**: MongoDB (Mongoose ORM)
- **Authentication**: JWT & Google OAuth (Seamless & secure login flows)
- **AI Integration**: NVIDIA API (LLaMA 3.1)
- **Mapping**: Leaflet & OpenStreetMap API

---

## 💻 Local Development

### 1. Start the Backend Server
```bash
cd backend
npm install
npm start
```

### 2. Start the Frontend Application
Open a new terminal window:
```bash
npm install
npm start
```
The application will boot up at `http://localhost:3000`.

---

## 🚀 Deployment (Vercel)

This repository is pre-configured for instant deployment on Vercel.

If you have the Vercel CLI authenticated locally, simply run:
```bash
npx vercel --prod
```

*Note: If your local Vercel session expires, run `npx vercel login` first to re-authenticate your machine.*
