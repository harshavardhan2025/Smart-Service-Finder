import Service from "../models/Service.js";
import { getCache, setCache, getVersion, invalidateVersion } from "../config/redisClient.js";

export const getServices = async (req, res) => {
  try {
    const version = await getVersion("services");
    const cacheKey = `services:list:v${version}`;
    
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`🚀 [REDIS CACHE HIT] Serving service categories list`);
      return res.status(200).json(cachedData);
    }

    const services = await Service.find();
    
    await setCache(cacheKey, services, 300); // Services change rarely, cache for 5 mins (300s)

    res.status(200).json(services);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const { name } = req.body;
    if (name) {
      const existingService = await Service.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
      if (existingService) {
        return res.status(409).json({ error: "A service category with this name already exists." });
      }
    }
    const service = await Service.create(req.body);
    
    await invalidateVersion("services");

    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    
    await invalidateVersion("services");

    res.status(200).json({ success: true, message: "Service category deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
