// chart.js

// Import the listenToSensorData function from firebase.js
import { listenToSensorData } from './firebase.js';

// Function to initialize the chart
function initializeChart() {
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

    // Function to update the chart with new proximity data
    function updateChart(data) {
        const distance = data.proximity || 0;
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

    // Listen for changes in sensor data and update the UI and chart
    listenToSensorData((data) => {
        document.getElementById("humidityData").innerHTML = `${data.humidity}%`;
        document.getElementById("temperatureData").innerHTML = `${data.temperature} °C`;
        document.getElementById("proximityData").innerHTML = `${data.proximity || 0} cm`;
        updateChart(data);
    });
}

// Initialize the chart on page load
initializeChart();
