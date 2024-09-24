



***************************TO directly update the Firebase data***********************************


curl -X PATCH -d "{\"temperature\": 30, \"humidity\": 55, \"proximity\": 25}" "https://sensor-database-9bafe-default-rtdb.asia-southeast1.firebasedatabase.app/sensorData.json"