require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { database, ref, set } = require("./firebase"); // import Firebase

const app = express();
const PORT = process.env.PORT || 5000; // Render dynamic port

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Route to receive ESP8266 data with GPS
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

  // Ensure no undefined values
  gpsFix = gpsFix ?? false;
  satellites = satellites ?? 0;
  hdop = hdop ?? 0.0;
  latitude = latitude ?? 0.0;
  longitude = longitude ?? 0.0;
  distance = distance ?? 0.0;
  temperature = temperature ?? 0.0;
  humidity = humidity ?? 0.0;

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

    console.log("✅ Firebase updated with latest data including GPS stats");
    res.status(200).json({ message: "Data updated in Firebase" });
  } catch (err) {
    console.error("❌ Failed to update Firebase:", err);
    res.status(500).json({ message: "Failed to update data in Firebase" });
  }
});

// Optional: basic route
app.get("/", (req, res) => res.send("ESP8266 Node.js Server is running ✅"));

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
