/* ESP8266 HTTPS POST with JSON (ArduinoJson)
   - Works with HTTPS backend (WiFiClientSecure)
   - Sends DHT11, HC-SR04, GPS data
   - Uses ArduinoJson for safe JSON
*/

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SoftwareSerial.h>
#include <TinyGPS++.h>
#include "DHT.h"
#include <ArduinoJson.h>

// ===== Pins =====
#define DHTPIN D4
#define DHTTYPE DHT11
#define TRIG_PIN D5
#define ECHO_PIN D6
#define GPS_RX D7
#define GPS_TX D8

// ===== WiFi =====
const char* ssid = "Bajirao";
const char* password = "10849kapil";

// ===== Server =====
const char* server = "https://aerosensor-iot-experiment-backend.onrender.com/data";

// ===== Objects =====
DHT dht(DHTPIN, DHTTYPE);
SoftwareSerial gpsSerial(GPS_RX, GPS_TX);
TinyGPSPlus gps;

// ===== Helpers =====
float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  float dist = (duration / 2.0) * 0.034; // cm
  if (isnan(dist) || isinf(dist)) return 0.0;
  return dist;
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  gpsSerial.begin(9600);

  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000UL) {
    delay(300);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n⚠️ WiFi connect timeout. Requests will fail until WiFi reconnects.");
  }
}

void loop() {
  // ===== Read sensors =====
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h)) h = 0.0;
  if (isnan(t)) t = 0.0;
  float distance = getDistance();

  // ===== Read GPS =====
  while (gpsSerial.available() > 0) gps.encode(gpsSerial.read());
  bool gpsFix = gps.location.isValid();
  double latitude = gpsFix ? gps.location.lat() : 0.0;
  double longitude = gpsFix ? gps.location.lng() : 0.0;
  int satellites = gps.satellites.isValid() ? gps.satellites.value() : 0;
  float hdop = gps.hdop.isValid() ? gps.hdop.hdop() : 99.99;

  Serial.println("-----------");
  Serial.printf("🌡 Temperature: %.2f °C\n💧 Humidity: %.2f %%\n📏 Distance: %.2f cm\n", t, h, distance);
  Serial.printf("📍 Lat: %.6f, Lng: %.6f, GPS fix: %s, Sats: %d, HDOP: %.2f\n",
                latitude, longitude, gpsFix ? "YES" : "NO", satellites, hdop);

  // ===== Build JSON =====
  DynamicJsonDocument doc(384);
  doc["temperature"] = t;
  doc["humidity"] = h;
  doc["distance"] = distance;
  doc["latitude"] = latitude;
  doc["longitude"] = longitude;
  doc["gpsFix"] = gpsFix;
  doc["satellites"] = satellites;
  doc["hdop"] = hdop;

  String payload;
  serializeJson(doc, payload);
  Serial.println("Payload:");
  Serial.println(payload);

  // ===== HTTPS POST =====
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Only for testing; for production, use proper certificate
    HTTPClient http;
    http.begin(client, server);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(payload);
    String resp = http.getString();

    Serial.printf("HTTP code: %d\n", httpCode);
    Serial.println("Server response:");
    Serial.println(resp);

    if (httpCode >= 200 && httpCode < 300) {
      Serial.println("✅ Data sent successfully.");
    } else if (httpCode == 400) {
      Serial.println("⚠️ Server returned 400. Check payload & endpoint.");
    } else {
      Serial.printf("⚠️ HTTP error %d\n", httpCode);
    }

    http.end();
  } else {
    Serial.println("🚫 WiFi not connected, skipping send");
  }

  delay(5000);
}
