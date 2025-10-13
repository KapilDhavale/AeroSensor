const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { database, ref, set } = require("./firebase"); // import Firebase

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Route to receive ESP8266 data with GPS
app.post("/data", async (req, res) => {
  const { temperature, humidity, distance, latitude, longitude } = req.body;

  console.log("📡 Data received from ESP8266:");
  console.log(`🌡 Temperature: ${temperature} °C`);
  console.log(`💧 Humidity: ${humidity} %`);
  console.log(`📏 Distance: ${distance} cm`);
  console.log(`📍 Latitude: ${latitude}`);
  console.log(`📍 Longitude: ${longitude}`);
  console.log("---------------------------------");

  try {
    // Overwrite the latest data in Firebase
    const dbRef = ref(database, "iot_data/latest"); 
    await set(dbRef, {
      temperature,
      humidity,
      distance,
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    });

    console.log("✅ Firebase updated with latest data including GPS");
    res.status(200).json({ message: "Data updated in Firebase" });
  } catch (err) {
    console.error("❌ Failed to update Firebase:", err);
    res.status(500).json({ message: "Failed to update data in Firebase" });
  }
});

// Optional: basic route
app.get("/", (req, res) => res.send("ESP8266 Node.js Server is running ✅"));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
