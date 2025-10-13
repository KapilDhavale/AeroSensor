// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { database, ref, set } = require("./firebase");

const app = express();
const PORT = process.env.PORT || 5000;

// Increase body size if needed and add custom JSON error handler
app.use(express.json({ limit: "1mb" }));

// JSON parse error handler (captures invalid JSON -> 400)
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    console.error("❌ JSON parse error:", err.message);
    return res.status(400).json({ error: "Invalid JSON payload", detail: err.message });
  }
  next();
});

app.use(cors());

// Utility sanitizers
const sanitizeNumber = (v, fallback = 0) => {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const sanitizeBoolean = (v, fallback = false) => {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1" || v === 1) return true;
  if (v === "false" || v === "0" || v === 0) return false;
  return fallback;
};

// Basic health
app.get("/", (req, res) => res.send("ESP8266 Node.js Server is running ✅"));

// Main endpoint
app.post("/data", async (req, res) => {
  try {
    // Log headers and raw body (useful for debugging)
    console.log("---- Incoming /data request ----");
    console.log("Headers:", req.headers);
    console.log("Raw body:", req.body);

    const body = req.body || {};

    // If required fields are completely missing, return 400
    if (
      body.temperature === undefined &&
      body.humidity === undefined &&
      body.distance === undefined &&
      body.latitude === undefined &&
      body.longitude === undefined
    ) {
      return res.status(400).json({ error: "Empty payload or missing sensor fields" });
    }

    // Sanitize / coerce
    const temperature = sanitizeNumber(body.temperature, 0);
    const humidity = sanitizeNumber(body.humidity, 0);
    const distance = sanitizeNumber(body.distance, 0);
    const latitude = sanitizeNumber(body.latitude, 0);
    const longitude = sanitizeNumber(body.longitude, 0);
    const satellites = sanitizeNumber(body.satellites, 0);
    const hdop = sanitizeNumber(body.hdop, 0);
    const gpsFix = sanitizeBoolean(body.gpsFix, false);

    // Log types for debugging
    console.log("Parsed values (types):",
      {
        temperature: { value: temperature, type: typeof temperature },
        humidity: { value: humidity, type: typeof humidity },
        distance: { value: distance, type: typeof distance },
        latitude: { value: latitude, type: typeof latitude },
        longitude: { value: longitude, type: typeof longitude },
        gpsFix: { value: gpsFix, type: typeof gpsFix },
        satellites: { value: satellites, type: typeof satellites },
        hdop: { value: hdop, type: typeof hdop },
      }
    );

    // Optionally, add domain validation (e.g., lat/lng ranges) and return 400 if out of range:
    if (latitude !== 0 && (latitude < -90 || latitude > 90)) {
      return res.status(400).json({ error: "latitude out of range" });
    }
    if (longitude !== 0 && (longitude < -180 || longitude > 180)) {
      return res.status(400).json({ error: "longitude out of range" });
    }

    // Write to Firebase under iot_data/latest
    const dbRef = ref(database, "iot_data/latest");
    await set(dbRef, {
      temperature,
      humidity,
      distance,
      latitude,
      longitude,
      gpsFix,
      satellites,
      hdop,
      timestamp: new Date().toISOString(),
    });

    console.log("✅ Firebase updated with latest data including GPS stats");
    return res.status(200).json({ message: "Data updated in Firebase" });
  } catch (err) {
    console.error("❌ Failed to update Firebase or process request:", err);
    // If Firebase set throws, it will be logged here
    return res.status(500).json({ error: "Internal server error", detail: String(err) });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
