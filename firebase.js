// firebase.js

// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAP4ocwoX9F9n2ECf3MwNsXWl8NiEUWz10",
    authDomain: "sensor-database-9bafe.firebaseapp.com",
    databaseURL: "https://sensor-database-9bafe-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sensor-database-9bafe",
    storageBucket: "sensor-database-9bafe.appspot.com",
    messagingSenderId: "107844464414",
    appId: "1:107844464414:web:b753b6de9a87c5813e230f",
    measurementId: "G-ESHHGTQX7S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const sensorRef = ref(database, "sensorData"); // Updated reference

// Real-time listener for sensor data from Firebase
export function listenToSensorData(updateUI) {
    onValue(sensorRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            console.log("Sensor Data Updated: ", data); // Debugging log
            updateUI(data);
        } else {
            console.error("No data available");
        }
    }, (error) => {
        console.error("Error fetching sensor data: ", error);
    });
}
