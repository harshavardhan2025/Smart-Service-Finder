import mongoose from "mongoose";
import { geocodeCity } from "../utils/geoUtils.js";

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  service: { type: String, required: true },
  city: { type: String, default: "Kakinada" },
  location: { type: String },
  lat: { type: Number },
  lon: { type: Number },
  rating: { type: Number, default: 2.7 },   // Bayesian starting baseline
  ratingSum: { type: Number, default: 0 },   // Running sum of customer star ratings
  reviews: { type: Number, default: 0 },     // Count of customer reviews
  price: { type: Number, default: 350 },     // Location-adjusted base price
  walletBalance: { type: Number, default: 0 },
  status: { type: String, default: "Active" },
  experience: { type: String, default: "2+ Years" }
}, { timestamps: true });

// Centralized automatic geocoding and rating aggregation hook at database write-time
workerSchema.pre("save", async function () {
  // Auto-initialize ratingSum for seeded or manually imported workers who have ratings/reviews but no ratingSum
  if (this.reviews > 0 && (!this.ratingSum || this.ratingSum === 0)) {
    const baseline = this.rating || 2.7;
    this.ratingSum = Math.round(baseline * this.reviews);
  }

  // Geocode if city/location changes or if coordinates are not populated
  if (
    this.isModified("city") ||
    this.isModified("location") ||
    this.lat === undefined ||
    this.lon === undefined ||
    this.lat === null ||
    this.lon === null
  ) {
    let cityStr = "";
    if (this.location && this.city) {
      const locClean = this.location.toLowerCase().trim();
      const cityClean = this.city.toLowerCase().trim();
      if (locClean !== cityClean) {
        cityStr = `${this.location}, ${this.city}`;
      } else {
        cityStr = this.city;
      }
    } else {
      cityStr = this.location || this.city || "";
    }

    if (cityStr) {
      try {
        const coords = await geocodeCity(cityStr);
        if (coords) {
          this.lat = coords.lat;
          this.lon = coords.lon;
        } else if (this.city) {
          const cityCoords = await geocodeCity(this.city);
          if (cityCoords) {
            this.lat = cityCoords.lat;
            this.lon = cityCoords.lon;
          }
        }
      } catch (err) {
        console.error(`[Worker Schema pre-save] Geocoding failed for ${this.name}:`, err.message);
      }
    }
  }
});

workerSchema.index({ city: 1, service: 1 });
workerSchema.index({ rating: -1 });

const Worker = mongoose.model("Worker", workerSchema);
export default Worker;
