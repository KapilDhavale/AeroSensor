// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

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
const sensorRef = ref(database, "Sensors/sensor123");

// Function to simulate random sensor data
function getRandomSensorData() {
  const randomTemperature = (Math.random() *40).toFixed(2); // Limit temperature to 40°C
  const randomHumidity = (Math.random() * 50).toFixed(2);    // Limit humidity to 50%
  const randomProximity = Math.floor(Math.random() * 50);    // Limit proximity to 50 cm
  return {
    temperature: randomTemperature,
    humidity: randomHumidity,
    proximity: randomProximity
  };
}

// Function to update simulated sensor data in Firebase
function updateSensorData() {
  const newData = getRandomSensorData();
  set(sensorRef, newData);
}

// Set an interval to update the simulated sensor data every second
setInterval(updateSensorData, 1000);

// Initialize the line chart for the ultrasonic sensor using Chart.js
const ctx = document.getElementById("ultrasonicChart").getContext("2d");
const ultrasonicChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [], // Empty labels (timestamps will be added dynamically)
    datasets: [
      {
        label: "Distance (cm)",
        data: [], // Empty data array for distance readings
        backgroundColor: "rgba(0, 255, 0, 0.4)", 
        borderColor: "rgba(0, 255, 0, 1)", // Green border initially
        borderWidth: 3,
        pointBackgroundColor: "rgba(0, 255, 0, 1)",
        pointBorderColor: "#fff",
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          color: '#ffffff'
        },
        ticks: {
          color: '#ffffff' // White tick color for better visibility
        }
      },
      y: {
        beginAtZero: true,
        max: 100, // Adjust Y-axis based on expected proximity range
        title: {
          display: true,
          text: 'Distance (cm)',
          color: '#ffffff'
        },
        ticks: {
          color: '#ffffff' // White tick color for better visibility
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#ffffff", // Legend text color
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)", // Tooltip background
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
      },
    },
  },
});

// Real-time listener for sensor data from Firebase
onValue(sensorRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    // Update temperature and humidity on the page
    document.getElementById("humidity").innerHTML = `${data.humidity}%`;
    document.getElementById("temperature").innerHTML = `${data.temperature}&deg;C`;

    // Update the ultrasonic sensor reading on the page
    const distance = data.proximity || 0;
    document.getElementById("ultrasonic").innerHTML = `${distance} cm`;

    // Update the chart with new proximity data
    const time = new Date().toLocaleTimeString(); // Capture current time
    if (ultrasonicChart.data.labels.length >= 20) {
      ultrasonicChart.data.labels.shift(); // Remove oldest label if exceeding 20
      ultrasonicChart.data.datasets[0].data.shift(); // Remove oldest data point
    }
    ultrasonicChart.data.labels.push(time); // Add new time label
    ultrasonicChart.data.datasets[0].data.push(distance); // Add new proximity data

    // Change chart line color based on proximity value
    ultrasonicChart.data.datasets[0].borderColor = distance <= 15 ? "rgba(255, 0, 0, 1)" : "rgba(0, 255, 0, 1)";
    
    // Update the chart to reflect the new data
    ultrasonicChart.update();
  }
});
