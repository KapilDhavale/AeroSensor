import React, { useEffect, useState, useRef } from "react";
import { database, ref, onValue } from "./firebase"; // Make sure firebase.js is correctly configured
import Chart from 'chart.js/auto'; // Import Chart.js

// --- Component CSS ---
// All the CSS is embedded here for a single-file component.
const styles = `
  @import url("https://fonts.googleapis.com/css2?family=Gloock&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Michroma&display=swap");

  .live-data-container {
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
    overflow-x: hidden; /* Prevents horizontal scroll */
  }

  .header {
    font-family: "Gloock", sans-serif;
    font-size: 40px;
    background: linear-gradient(
      to bottom,
      rgba(99, 133, 235, 0.7),
      rgba(149, 167, 221, 0.5),
      rgba(189, 194, 210, 0)
    );
    padding: 20px;
  }

  .logo {
    width: 20%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }

  .logo img {
    width: 30px;
    height: auto;
    margin-bottom: 5px;
  }

  .rows {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center; /* Center cards instead of space-evenly */
    gap: 30px; /* Modern way to add space between items */
    margin-bottom: 30px;
    flex-wrap: wrap; /* Allows cards to wrap to the next line on smaller screens */
  }

  .cards {
    width: 400px;
    background-color: rgba(8, 51, 255, 0.13);
    border: 1px solid #0021bd;
    border-radius: 13px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    font-family: "Merriweather", serif;
    font-size: 25px;
    padding: 20px;
    transition: all 0.3s ease;
  }

  .cards:hover {
    background-color: rgba(80, 200, 120, 0.25);
    border: 1px solid rgba(47, 141, 79, 1);
    transform: translateY(-5px);
  }

  .value {
    background-color: rgba(6, 38, 192, 0.21);
    border: 1px solid rgba(0, 14, 83, 0.3);
    border-radius: 6px;
    display: flex;
    min-width: 110px;
    height: 80px;
    padding: 5px;
    justify-content: center;
    align-items: center;
    font-family: "Roboto", sans-serif;
    font-size: 20px;
    font-weight: 700;
  }

  .cards:hover .value {
    background-color: rgba(48, 170, 89, 0.3);
    border: 1px solid rgba(35, 91, 54, 0.3);
  }

  .footer {
    display: flex;
    height: 100%;
    width: 95%;
    padding-bottom: 20px;
    justify-content: flex-end;
    font-family: "Michroma", sans-serif;
    font-size: 20px;
  }

  .chart-container {
    max-width: 1000px;
    margin: 20px auto;
    padding: 20px;
    background-color: #ffffff; 
    border-radius: 8px; 
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); 
  }

  /* --- RESPONSIVE STYLES FOR MOBILE --- */
  @media (max-width: 768px) {
    .header {
      font-size: 32px;
      text-align: center;
      padding: 15px;
    }

    .logo {
      width: 100%;
      align-items: center;
    }

    .rows {
      flex-direction: column; /* Stack cards vertically */
      align-items: center; /* Center the stacked cards */
      gap: 20px;
      margin-bottom: 20px;
    }

    .cards {
      width: 90%; /* Make cards take up most of the screen width */
      font-size: 20px;
      padding: 15px;
    }

    .value {
      font-size: 18px;
    }
    
    .chart-container {
      width: 95%; /* Ensure chart container fits screen */
      padding: 10px;
    }
    
    .footer {
      justify-content: center; /* Center footer text */
      font-size: 16px;
    }
  }
`;

const LiveData = () => {
  // State to hold the latest sensor readings
  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    distance: 0,
  });

  // State to hold the historical data for the chart
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  
  const chartRef = useRef(null); // To hold the chart instance
  const MAX_DATA_POINTS = 20; // Max number of points to show on the chart

  // Effect for fetching data from Firebase
  useEffect(() => {
    const dataRef = ref(database, "iot_data/latest"); // Path to your latest data in Firebase
    
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const newData = snapshot.val();
        setData(newData);

        // Update chart data history
        const newTime = new Date().toLocaleTimeString();
        setChartData(prevData => {
            const newLabels = [...prevData.labels, newTime].slice(-MAX_DATA_POINTS);
            const newDistances = [...(prevData.datasets[0]?.data || []), newData.distance].slice(-MAX_DATA_POINTS);

            return {
                labels: newLabels,
                datasets: [
                    {
                        label: 'Ultrasonic Sensor Distance (cm)',
                        data: newDistances,
                        fill: true,
                        backgroundColor: 'rgba(99, 133, 235, 0.2)',
                        borderColor: 'rgba(99, 133, 235, 1)',
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(99, 133, 235, 1)',
                    },
                ],
            };
        });
      } else {
        console.log("No data available at the specified path.");
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  // Effect for initializing and updating the chart
  useEffect(() => {
    const canvas = document.getElementById('ultrasonicChart');
    if (canvas) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(canvas, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Distance (cm)',
              },
            },
            x: {
              title: {
                display: true,
                text: 'Time',
              },
            },
          },
          plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Real-time Proximity Readings',
                font: {
                    size: 18,
                }
            }
          }
        },
      });
    }

    return () => {
        if(chartRef.current) {
            chartRef.current.destroy();
        }
    }
  }, [chartData]);

  return (
    <>
      <style>{styles}</style>
      <div className="live-data-container">
        <div className="header">
          <div className="logo">
            <img src="logo.png" alt="AeroSensor Logo" />
            AeroSensor
          </div>
        </div>

        {/* 1st ROW */}
        <div className="rows">
          <div className="cards">
            Cabin Temperature
            <div className="value">{data.temperature} °C</div>
          </div>
          <div className="cards">
            CO2 Concentration
            <div className="value">400 ppm</div>
          </div>
        </div>

        {/* 2nd ROW */}
        <div className="rows">
          <div className="cards">
            Cabin Humidity
            <div className="value">{data.humidity} %</div>
          </div>
          <div className="cards">
            Ultrasonic Sensor
            <div className="value">{data.distance} cm</div>
          </div>
        </div>

        {/* 3rd ROW */}
        <div className="rows">
          <div className="cards">
            Cabin Pressure
            <div className="value">1013 hPa</div>
          </div>
          <div className="cards">
            O2 Concentration
            <div className="value">21% O2</div>
          </div>
        </div>

        <div className="chart-container">
          <canvas id="ultrasonicChart" height="400"></canvas>
        </div>

        <div className="footer">Aircraft Monitoring System</div>
      </div>
    </>
  );
};

export default LiveData;