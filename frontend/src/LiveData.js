// src/LiveData.js
import React, { useEffect, useState, useRef } from "react";
import { database, ref, onValue } from "./firebase";
import Chart from "chart.js/auto";

/*
  LiveData.js
  - Listens to "iot_data/latest" in your Realtime DB
  - Shows main dashboard cards, latitude/longitude, and a line chart of distance history
  - Auto-adds any new numeric parameters as cards
*/

const sanitizeNumber = (v, fallback = 0) => {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const formatLabel = (key) => {
  // friendly labels for known keys
  const mapping = {
    temperature: "Cabin Temperature",
    humidity: "Cabin Humidity",
    distance: "Proximity (Ultrasonic)",
    latitude: "Latitude",
    longitude: "Longitude",
    gpsFix: "GPS Fix",
    satellites: "Satellites",
    hdop: "HDOP",
    timestamp: "Last Seen",
  };
  return mapping[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// Simple icons (inline SVG) - small, lightweight
const Icon = ({ type }) => {
  switch (type) {
    case "temperature":
      return (
        <svg className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v10a4 4 0 104 0z" />
        </svg>
      );
    case "humidity":
      return (
        <svg className="h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 00-10 10c0 4.12 2.5 7.62 6 9.24V22h8v- .76c3.5-1.62 6-5.12 6-9.24A10 10 0 0012 2z" />
        </svg>
      );
    case "distance":
      return (
        <svg className="h-8 w-8 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3M18 12h3M6.5 7.5l11 9M6.5 16.5l11-9" />
        </svg>
      );
    case "location":
      return (
        <svg className="h-8 w-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return (
        <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};

const LiveData = () => {
  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    distance: 0,
    latitude: 0,
    longitude: 0,
  });

  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const chartRef = useRef(null);
  const MAX_POINTS = 30;

  useEffect(() => {
    // attach firebase listener
    const dataRef = ref(database, "iot_data/latest");
    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const val = snapshot.val();

        // ensure numeric fields are sanitized
        const sanitized = { ...val };
        Object.keys(sanitized).forEach((k) => {
          // keep lat/lon as floats; gpsFix boolean
          if (k === "gpsFix") sanitized[k] = sanitized[k] === true || sanitized[k] === "true";
          else if (k === "timestamp") sanitized[k] = sanitized[k];
          else sanitized[k] = sanitizeNumber(sanitized[k], sanitized[k] === undefined ? 0 : sanitized[k]);
        });

        // ensure base keys exist
        sanitized.temperature = sanitizeNumber(sanitized.temperature, 0);
        sanitized.humidity = sanitizeNumber(sanitized.humidity, 0);
        sanitized.distance = sanitizeNumber(sanitized.distance, 0);
        sanitized.latitude = sanitizeNumber(sanitized.latitude, 0);
        sanitized.longitude = sanitizeNumber(sanitized.longitude, 0);

        setData(sanitized);

        // update chart (distance history)
        const nowLabel = new Date().toLocaleTimeString();
        setChartData((prev) => {
          const prevLabels = prev.labels ? [...prev.labels] : [];
          const prevDataset = prev.datasets && prev.datasets[0] ? [...prev.datasets[0].data] : [];
          prevLabels.push(nowLabel);
          prevDataset.push(sanitized.distance);
          // keep last N
          const labels = prevLabels.slice(-MAX_POINTS);
          const dataset = prevDataset.slice(-MAX_POINTS);

          return {
            labels,
            datasets: [
              {
                label: "Ultrasonic Distance (cm)",
                data: dataset,
                fill: true,
                backgroundColor: "rgba(129,140,248,0.18)",
                borderColor: "rgba(129,140,248,1)",
                tension: 0.35,
                pointBackgroundColor: "rgba(129,140,248,1)",
              },
            ],
          };
        });
      },
      (err) => {
        console.error("Firebase onValue error:", err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Chart init/update
  useEffect(() => {
    const canvas = document.getElementById("ultrasonicChart");
    if (!canvas) return;
    if (chartRef.current) chartRef.current.destroy();

    // create chart
    chartRef.current = new Chart(canvas, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: Math.max(300, ...((chartData.datasets[0]?.data || []).map((n) => Number(n) || 0))) * 1.1,
            title: { display: true, text: "Distance (cm)" },
          },
          x: {
            title: { display: true, text: "Time" },
          },
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Real-time Proximity Readings",
            font: { size: 16 },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [chartData]);

  // build cards: primary set (consistent), plus extras (auto detect numeric fields)
  const primaryKeys = ["temperature", "humidity", "distance", "latitude", "longitude"];
  const extras = Object.keys(data).filter((k) => !primaryKeys.includes(k) && k !== "timestamp");

  // prepare cards in display order
  const cards = [
    {
      key: "temperature",
      title: "Cabin Temperature",
      value: data.temperature,
      unit: "°C",
      iconType: "temperature",
    },
    {
      key: "humidity",
      title: "Cabin Humidity",
      value: data.humidity,
      unit: "%",
      iconType: "humidity",
    },
    {
      key: "distance",
      title: "Ultrasonic Sensor",
      value: data.distance,
      unit: "cm",
      iconType: "distance",
    },
  ];

  // append extras (only show simple scalars: numbers/booleans)
  extras.forEach((k) => {
    // show booleans and numbers
    const raw = data[k];
    const isBoolean = typeof raw === "boolean";
    const isNumber = typeof raw === "number";
    if (isBoolean || isNumber || typeof raw === "string") {
      cards.push({
        key: k,
        title: formatLabel(k),
        value: isBoolean ? (raw ? "Yes" : "No") : raw,
        unit: isBoolean ? "" : "",
        iconType: "default",
      });
    }
  });

  // static cards for pressure/CO2/O2 (placeholders if not present)
  const staticExtra = [
    { key: "pressure", title: "Cabin Pressure", value: data.pressure ?? 1013, unit: "hPa" },
    { key: "co2", title: "CO₂ Concentration", value: data.co2 ?? 415, unit: "ppm" },
    { key: "o2", title: "O₂ Concentration", value: data.o2 ?? 20.9, unit: "%" },
  ];

  return (
    <>
      {/* Tailwind + font (allowed as you used earlier) */}
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      <main className="bg-slate-900 min-h-screen p-4 sm:p-6 lg:p-8 font-['Inter'] text-slate-200">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <img src="/logo.png" alt="logo" className="w-9 h-9 object-contain rounded-md" />
                AeroSensor Dashboard
              </h1>
              <p className="text-slate-400 mt-1">Live Aircraft Monitoring System</p>
            </div>
            <div className="text-sm text-slate-400 mt-4 sm:mt-0">
              Status: <span className="font-semibold text-green-400">● Live</span>
            </div>
          </header>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {cards.map((c) => (
              <div key={c.key} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg transition-all duration-300 hover:border-indigo-500">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-slate-400">{c.title}</p>
                  <Icon type={c.iconType} />
                </div>
                <p className="text-4xl font-bold text-white mt-2">
                  {typeof c.value === "number" ? c.value : String(c.value)}
                  <span className="text-2xl font-medium text-slate-400"> {c.unit}</span>
                </p>
              </div>
            ))}

            {/* static extras */}
            {staticExtra.map((s) => (
              <div key={s.key} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg transition-all duration-300 hover:border-indigo-500">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-slate-400">{s.title}</p>
                  <svg className="h-8 w-8 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-white mt-2">
                  {s.value} <span className="text-2xl font-medium text-slate-400">{s.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Chart + Lat/Lon */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg">
              <div className="h-96 w-full">
                <canvas id="ultrasonicChart"></canvas>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-slate-400">Latitude</p>
                  <Icon type="location" />
                </div>
                <p className="text-4xl font-bold text-white mt-2">{(data.latitude || 0).toFixed(6)}</p>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-slate-400">Longitude</p>
                  <Icon type="location" />
                </div>
                <p className="text-4xl font-bold text-white mt-2">{(data.longitude || 0).toFixed(6)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default LiveData;
