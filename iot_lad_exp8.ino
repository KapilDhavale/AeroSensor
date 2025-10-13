#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include "DHT.h"

#define DHTPIN D4
#define DHTTYPE DHT11

#define TRIG_PIN D5
#define ECHO_PIN D6

const char* ssid = "Bajirao";        // 🔹 Replace with your WiFi name
const char* password = "10849kapil"; // 🔹 Replace with your WiFi password

// Example endpoint — replace with your server or API endpoint
const char* server = "http://192.168.251.215:5000/data";  

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✅ Connected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2;  // cm
  return distance;
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  float distance = getDistance();

  if (isnan(h) || isnan(t)) {
    Serial.println("⚠️ Failed to read from DHT sensor!");
    return;
  }

  Serial.println("-----------");
  Serial.printf("🌡 Temperature: %.2f °C\n", t);
  Serial.printf("💧 Humidity: %.2f %%\n", h);
  Serial.printf("📏 Distance: %.2f cm\n", distance);

  // Send data to the server
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    http.begin(client, server);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"temperature\":" + String(t) + 
                     ",\"humidity\":" + String(h) + 
                     ",\"distance\":" + String(distance) + "}";

    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      Serial.printf("✅ HTTP Response code: %d\n", httpResponseCode);
    } else {
      Serial.printf("❌ Error sending POST: %s\n", http.errorToString(httpResponseCode).c_str());
    }

    http.end();
  } else {
    Serial.println("🚫 WiFi not connected!");
  }

  delay(5000); // Wait 5 seconds before next reading
}
