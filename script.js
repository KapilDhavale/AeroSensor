// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBK2pCmtWpVd0L4Y4DWuEvJ1dGi4ByIz4s",
  authDomain: "aircraft-monitoring-syst-dc5dc.firebaseapp.com",
  databaseURL: "https://aircraft-monitoring-syst-dc5dc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aircraft-monitoring-syst-dc5dc",
  storageBucket: "aircraft-monitoring-syst-dc5dc.appspot.com",
  messagingSenderId: "320070089409",
  appId: "1:320070089409:web:662f5a82fcee4d9e00b240"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Reference to the sensor data in the database
const sensorRef = ref(database, 'Sensors/sensor123'); // Update to your specific sensor path

// Real-time listener for sensor data
onValue(sensorRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    document.getElementById('humidity').innerHTML = `${data.Humidity}%`;
    document.getElementById('temperature').innerHTML = `${data.Temperature}&deg;C `;
  }
});
