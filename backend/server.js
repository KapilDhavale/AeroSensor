require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { database, ref, set } = require("./firebase"); // Firebase module

const app = express();
const PORT = process.env.PORT || 5000; // Dynamic port for Render

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Utility to sanitize incoming data
function sanitizeNumber(value, defaultValue = 0) {
  return typeof value === "number" && !isNaN(value) ? value : defaultValue;
}

function sanitizeBoolean(value, defaultValue = false) {
  return typeof value === "boolean" ? value : defaultValue;
}

// Route to receive ESP8266 data
app.post("/data", async (req, res) => {
  let {
    temperature,
    humidity,
    distance,
    latitude,
    longitude,
    gpsFix,
    satellites,
    hdop
  } = req.body;

  // Sanitize all values
  temperature = sanitizeNumber(temperature);
  humidity = sanitizeNumber(humidity);
  distance = sanitizeNumber(distance);
  latitude = sanitizeNumber(latitude);
  longitude = sanitizeNumber(longitude);
  satellites = sanitizeNumber(satellites);
  hdop = sanitizeNumber(hdop, 0.0);
  gpsFix = sanitizeBoolean(gpsFix);

  console.log("📡 Data received from ESP8266:");
  console.log(`🌡 Temperature: ${temperature} °C`);
  console.log(`💧 Humidity: ${humidity} %`);
  console.log(`📏 Distance: ${distance} cm`);
  console.log(`📍 Latitude: ${latitude}`);
  console.log(`📍 Longitude: ${longitude}`);
  console.log(`🛰 GPS Fix Acquired: ${gpsFix}`);
  console.log(`🛰 Satellites in view: ${satellites}`);
  console.log(`🛰 HDOP: ${hdop}`);
  console.log("---------------------------------");

  try {
    // Update Firebase safely
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
      timestamp: new Date().toISOString()
    });

    console.log("✅ Firebase updated successfully!");
    res.status(200).json({ message: "Data updated in Firebase" });
  } catch (err) {
    console.error("❌ Failed to update Firebase:", err);
    res.status(500).json({ message: "Failed to update data in Firebase" });
  }
});

// Basic test route
app.get("/", (req, res) => res.send("ESP8266 Node.js Server is running ✅"));

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
