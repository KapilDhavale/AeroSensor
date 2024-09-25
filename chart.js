import { listenToSensorData } from './firebase.js';


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
                    borderColor: "rgba(0, 255, 0, 1)", 
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
                        color: '#ffffff'
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
                        color: '#ffffff' 
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: "#ffffff", 
                    },
                },
                tooltip: {
                    backgroundColor: "rgba(0, 0, 0, 0.8)", 
                    titleColor: "#ffffff",
                    bodyColor: "#ffffff",
                },
            },
        },
    });

    // A Function to Update the chart with new proximity data
    function updateChart(data) {
        const distance = data.proximity || 0;
        const time = new Date().toLocaleTimeString(); // Capture current time

        if (ultrasonicChart.data.labels.length >= 20) {
            ultrasonicChart.data.labels.shift(); // Remove oldest label if exceeding 20
            ultrasonicChart.data.datasets[0].data.shift(); // Remove oldest data point
        }

        ultrasonicChart.data.labels.push(time); // Add new time label
        ultrasonicChart.data.datasets[0].data.push(distance); // Add new proximity data

        // If Our Aircraft i.e an object is closer to the Proximity Sensor more than 15cm the line will turn red
        ultrasonicChart.data.datasets[0].borderColor = distance <= 15 ? "rgba(255, 0, 0, 1)" : "rgba(0, 255, 0, 1)";


        ultrasonicChart.update();
    }

    // Listen for changes in sensor daa and update the UI and chart
    listenToSensorData((data) => {
        document.getElementById("humidityData").innerHTML = `${data.humidity}%`;
        document.getElementById("temperatureData").innerHTML = `${data.temperature} °C`;
        document.getElementById("proximityData").innerHTML = `${data.proximity || 0} cm`;
        updateChart(data);
    });
}

// This is used to initialize the cart on page load
initializeChart();
