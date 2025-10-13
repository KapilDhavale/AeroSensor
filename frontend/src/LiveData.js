// src/LiveData.js
import React, { useEffect, useState, useRef } from "react";
import { database, ref, onValue } from "./firebase";
import Chart from "chart.js/auto";

const MAX_POINTS = 40;
const FLASH_MS = 800; // green flash duration
const LIVE_TIMEOUT_MS = 20000; // consider "offline" if no update for 20s

const sanitizeNumber = (v, fallback = 0) => {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const prettyLabel = (key) => {
  const map = {
    temperature: "Cabin Temperature",
    humidity: "Cabin Humidity",
    distance: "Proximity (cm)",
    latitude: "Latitude",
    longitude: "Longitude",
    gpsFix: "GPS Fix",
    satellites: "Satellites",
    hdop: "HDOP",
    timestamp: "Last Seen",
  };
  return map[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const Icon = ({ name }) => {
  const s = { width: 28, height: 28 };
  switch (name) {
    case "temperature":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v10a4 4 0 104 0z" />
        </svg>
      );
    case "humidity":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 00-10 10c0 4.12 2.5 7.62 6 9.24V22h8v-.76c3.5-1.62 6-5.12 6-9.24A10 10 0 0012 2z" />
        </svg>
      );
    case "distance":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3M18 12h3M6.5 7.5l11 9M6.5 16.5l11-9" />
        </svg>
      );
    default:
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
};

export default function LiveData() {
  const [latest, setLatest] = useState({});
  const [history, setHistory] = useState({ labels: [], series: {} });
  const [justUpdated, setJustUpdated] = useState(false);
  const [lastSeenTs, setLastSeenTs] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const updateTimeoutRef = useRef(null);
  const liveCheckIntervalRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Listen to Firebase Realtime Database
  useEffect(() => {
    const dataRef = ref(database, "iot_data/latest");
    const unsubscribe = onValue(
      dataRef,
      (snap) => {
        if (!snap.exists()) return;
        const raw = snap.val();

        // sanitize fields
        const sanitized = {};
        Object.keys(raw).forEach((k) => {
          if (k === "gpsFix") {
            sanitized[k] = raw[k] === true || raw[k] === "true" || raw[k] === 1 || raw[k] === "1";
          } else if (k === "timestamp") {
            sanitized[k] = raw[k];
          } else if (typeof raw[k] === "number") {
            sanitized[k] = raw[k];
          } else if (typeof raw[k] === "string") {
            const n = Number(raw[k]);
            sanitized[k] = Number.isFinite(n) ? n : raw[k];
          } else {
            sanitized[k] = raw[k];
          }
        });

        // ensure core numeric keys exist
        sanitized.temperature = sanitizeNumber(sanitized.temperature, 0);
        sanitized.humidity = sanitizeNumber(sanitized.humidity, 0);
        sanitized.distance = sanitizeNumber(sanitized.distance, 0);
        sanitized.latitude = sanitizeNumber(sanitized.latitude, 0);
        sanitized.longitude = sanitizeNumber(sanitized.longitude, 0);

        setLatest(sanitized);

        // update lastSeen (use server timestamp if provided and valid, else reception time)
        const recv = Date.now();
        let receivedTs = recv;
        if (sanitized.timestamp) {
          const parsed = Date.parse(sanitized.timestamp);
          if (!Number.isNaN(parsed)) receivedTs = parsed;
        }
        setLastSeenTs(receivedTs);

        // flash indicator
        setJustUpdated(true);
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = setTimeout(() => setJustUpdated(false), FLASH_MS);

        // update history (distance + temperature preferred)
        setHistory((prev) => {
          const labels = [...(prev.labels || []), new Date(receivedTs).toLocaleTimeString()];
          const numericKeys = [];
          if ("distance" in sanitized) numericKeys.push("distance");
          if ("temperature" in sanitized && !numericKeys.includes("temperature")) numericKeys.push("temperature");
          if (numericKeys.length < 2) {
            Object.keys(sanitized).forEach((k) => {
              if (numericKeys.length >= 2) return;
              if (["timestamp", "latitude", "longitude", "gpsFix"].includes(k)) return;
              if (typeof sanitized[k] === "number" && !numericKeys.includes(k)) numericKeys.push(k);
            });
          }
          const newSeries = { ...(prev.series || {}) };
          numericKeys.forEach((key) => {
            const arr = newSeries[key] ? [...newSeries[key]] : [];
            arr.push(Number(sanitized[key] ?? 0));
            newSeries[key] = arr.slice(-MAX_POINTS);
          });
          const trimmedLabels = labels.slice(-MAX_POINTS);
          Object.keys(newSeries).forEach((k) => {
            if (newSeries[k].length < trimmedLabels.length) {
              const diff = trimmedLabels.length - newSeries[k].length;
              newSeries[k] = Array(diff).fill(0).concat(newSeries[k]);
            }
          });
          return { labels: trimmedLabels, series: newSeries };
        });
      },
      (err) => {
        console.error("Firebase onValue error:", err);
      }
    );

    return () => {
      unsubscribe();
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    };
  }, []);

  // Live check interval
  useEffect(() => {
    const checkLive = () => {
      if (!lastSeenTs) {
        setIsLive(false);
        return;
      }
      const age = Date.now() - lastSeenTs;
      setIsLive(age <= LIVE_TIMEOUT_MS);
    };
    checkLive();
    liveCheckIntervalRef.current = setInterval(checkLive, 1000);
    return () => clearInterval(liveCheckIntervalRef.current);
  }, [lastSeenTs]);

  // Chart init/update
  useEffect(() => {
    const canvas = document.getElementById("liveChart");
    if (!canvas) return;

    const keys = Object.keys(history.series || {});
    const datasets = keys.slice(0, 2).map((k, idx) => {
      const colors = [
        { bg: "rgba(99,102,241,0.18)", border: "rgba(99,102,241,1)" },
        { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,1)" },
      ];
      const color = colors[idx] || colors[0];
      return {
        label: prettyLabel(k),
        data: history.series[k] || [],
        fill: true,
        backgroundColor: color.bg,
        borderColor: color.border,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 4,
      };
    });

    const chartData = { labels: history.labels || [], datasets };

    if (chartInstanceRef.current) {
      chartInstanceRef.current.data = chartData;
      chartInstanceRef.current.options.scales.y.max =
        datasets.length && datasets[0].data.length ? Math.max(300, ...datasets[0].data) * 1.1 : 300;
      chartInstanceRef.current.update();
    } else {
      chartInstanceRef.current = new Chart(canvas, {
        type: "line",
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: datasets.length > 0 },
            title: { display: true, text: "Realtime Sensor Trends" },
          },
          scales: {
            x: { title: { display: true, text: "Time" } },
            y: { beginAtZero: true, title: { display: true, text: "Value" }, suggestedMax: 300 },
          },
        },
      });
    }
    // cleanup on unmount
    return () => {
      // keep instance (destroy on full unmount handled by browser reload)
    };
  }, [history]);

  // Build display cards
  const primaryOrder = ["temperature", "humidity", "distance", "latitude", "longitude"];
  const keys = Array.from(new Set([...primaryOrder.filter((k) => k in latest), ...Object.keys(latest)]));
  const cards = keys
    .filter((k) => k !== "timestamp")
    .map((k) => {
      const v = latest[k];
      let display = v;
      let unit = "";
      if (k === "temperature") unit = "°C";
      if (k === "humidity") unit = "%";
      if (k === "distance") unit = "cm";
      if (k === "latitude" || k === "longitude") {
        display = typeof v === "number" ? v.toFixed(6) : v;
      } else if (typeof v === "number") {
        display = Number.isFinite(v) ? Number(v).toFixed(2) : v;
      } else if (typeof v === "boolean") {
        display = v ? "Yes" : "No";
      }
      return { key: k, title: prettyLabel(k), value: display, unit };
    });

  // ensure some core cards if missing
  ["temperature", "humidity", "distance"].forEach((k) => {
    if (!cards.find((c) => c.key === k)) {
      cards.push({
        key: k,
        title: prettyLabel(k),
        value: latest[k] ?? 0,
        unit: k === "distance" ? "cm" : k === "humidity" ? "%" : "°C",
      });
    }
  });

  // helper to format last seen
  const renderLastSeen = () => {
    if (!lastSeenTs) return "Never";
    const agoMs = Date.now() - lastSeenTs;
    if (agoMs < 1000) return "just now";
    const s = Math.round(agoMs / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    return `${h}h ago`;
  };

  return (
    <>
      <style>{`
        :root{ --bg:#0b1220; --card:#0f1724; --muted:#94a3b8; --accent:#6366f1; --glass: rgba(255,255,255,0.03)}
        *{box-sizing:border-box}
        body{margin:0}
        .wrap{min-height:100vh;background:var(--bg);color:#e6eef0;font-family:Inter,ui-sans-serif,system-ui,Arial;padding:20px;}
        .container{max-width:1200px;margin:0 auto}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px;flex-wrap:wrap}
        .title{display:flex;gap:12px;align-items:center}
        .logo{width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#4338ca,#06b6d4);display:flex;align-items:center;justify-content:center;font-weight:700;color:white}
        .subtitle{color:var(--muted);font-size:0.95rem}
        .status{color:var(--muted)}
        .status-bullet { margin-right: 8px; font-weight: 700; }
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:14px}
        .card{background:var(--card);padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,0.03);box-shadow:0 6px 18px rgba(2,6,23,0.7)}
        .card .top{display:flex;justify-content:space-between;align-items:flex-start}
        .titleSmall{font-size:0.9rem;color:var(--muted)}
        .value{font-size:1.9rem;font-weight:700;margin-top:8px;color:#fff;transition: color 0.25s ease, transform 0.25s ease;}
        .value.flash { color: #34d399 !important; transform: translateY(-2px); } /* green and slight lift */
        .unit{font-size:1rem;color:var(--muted);margin-left:8px}
        .bottomGrid{display:grid;grid-template-columns:1fr;gap:12px}
        @media(min-width:1024px){ .bottomGrid{grid-template-columns:2fr 1fr} }
        .chartCard{height:320px}
        .latlonWrap{display:flex;flex-direction:column;gap:12px}
        .latlonItem{background:var(--card);padding:12px;border-radius:12px}
        /* Credits styling - responsive */
        .credits { margin-top: 18px; display:flex; flex-wrap:wrap; gap: 10px; align-items:center; justify-content:flex-end; color: var(--muted); font-size: 0.95rem; }
        .credits a { color: var(--muted); text-decoration: none; font-weight: 600; }
        .credits a:hover { color: #fff; text-decoration: underline; }
        @media(max-width:640px) {
          .credits { justify-content:center; text-align:center; }
        }
      `}</style>

      <div className="wrap">
        <div className="container">
          <header className="header" aria-live="polite">
            <div className="title">
              <div className="logo">AS</div>
              <div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>AeroSensor Dashboard</div>
                <div className="subtitle">Live Aircraft Monitoring</div>
              </div>
            </div>

            <div className="status" title={`Last update: ${lastSeenTs ? new Date(lastSeenTs).toLocaleString() : "never"}`}>
              <span className="status-bullet" style={{ color: isLive ? "#34d399" : "#ef4444" }}>
                {isLive ? "●" : "◌"}
              </span>
              <span style={{ fontWeight: 700, color: isLive ? "#34d399" : "#ef4444" }}>{isLive ? "Live" : "Offline"}</span>
              <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: 4 }}>
                {isLive ? `Last update: ${renderLastSeen()}` : `Last seen: ${renderLastSeen()}`}
              </div>
            </div>
          </header>

          <section className="grid" aria-live="polite">
            {cards.map((c) => (
              <article key={c.key} className="card" aria-label={c.title}>
                <div className="top">
                  <div className="titleSmall">{c.title}</div>
                  <div style={{ opacity: 0.95 }}>
                    <Icon name={c.key} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <div className={`value ${justUpdated ? "flash" : ""}`}>{c.value}</div>
                  <div className="unit">{c.unit}</div>
                </div>
              </article>
            ))}
          </section>

          <section className="bottomGrid">
            <div className="card chartCard">
              <canvas id="liveChart" style={{ width: "100%", height: "100%" }} />
            </div>

            <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="latlonItem">
                <div className="titleSmall">Latitude</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{(latest.latitude ?? 0).toFixed(6)}</div>
              </div>
              <div className="latlonItem">
                <div className="titleSmall">Longitude</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{(latest.longitude ?? 0).toFixed(6)}</div>
              </div>
              <div className="latlonItem">
                <div className="titleSmall">Last Updated</div>
                <div style={{ fontSize: 14, color: "#94a3b8" }}>{lastSeenTs ? new Date(lastSeenTs).toLocaleString() : "Never"}</div>
              </div>
            </aside>
          </section>

          {/* Responsive credits */}
          <div className="credits" aria-label="credits">
            <div>Made by</div>
            <a href="https://www.linkedin.com/in/kapildhavale" target="_blank" rel="noopener noreferrer">Kapil Dhavale</a>
            <span>·</span>
            <a href="https://www.linkedin.com/in/riddhi-buva" target="_blank" rel="noopener noreferrer">Riddhi Buva</a>
            {/* <div>Riddhi Buva</div> */}
            <span>·</span>
            <div>Manasvi Bhalerao</div>
            <span>·</span>
            <div>ECS, VESIT</div>
          </div>
        </div>
      </div>
    </>
  );
}
