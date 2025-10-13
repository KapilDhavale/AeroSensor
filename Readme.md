# AeroSensor Dashboard

**Live Demo:** [https://aerosensor.onrender.com/](https://aerosensor.onrender.com/)

AeroSensor Dashboard is a **real-time aircraft sensor monitoring web application** built with **React** and **Firebase**. It displays live sensor data (temperature, humidity, distance, GPS) from IoT devices and visualizes trends using interactive charts.

---

## Table of Contents

* [Features](#features)
* [Demo](#demo)
* [Technologies Used](#technologies-used)
* [Setup & Installation](#setup--installation)
* [Usage](#usage)
* [Project Structure](#project-structure)
* [Contributors](#contributors)
* [License](#license)

---

## Features

* Real-time IoT data visualization
* Interactive line charts for sensor trends
* Auto-generating dynamic cards for new sensor parameters
* GPS coordinates tracking with live display
* Responsive and clean UI
* Highlighting recently updated data

---

## Demo

![Live Dashboard](https://via.placeholder.com/800x400.png?text=AeroSensor+Dashboard+Demo)
Access the live project at [https://aerosensor.onrender.com/](https://aerosensor.onrender.com/)

---

## Technologies Used

* **Frontend:** React, Chart.js
* **Backend & Database:** Firebase Realtime Database
* **IoT Device Integration:** ESP8266 with DHT11, Ultrasonic Sensor, GPS
* **Other:** ArduinoJson, TinyGPS++

---

## Setup & Installation

### Prerequisites

* Node.js (v18+)
* npm or yarn
* Firebase project with Realtime Database

### Steps

1. Clone the repository:

```bash
git clone https://github.com/yourusername/aerosensor-dashboard.git
cd aerosensor-dashboard
```

2. Install dependencies:

```bash
npm install
```

3. Configure Firebase:

* Create a `.env` file in the root directory and add your Firebase config:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:

```bash
npm start
```

5. Build for production:

```bash
npm run build
```

* **Render Build Command:**

```bash
npm install && npm run build
```

* **Publish Directory:** `build`

---

## Usage

* Connect your ESP8266 IoT devices configured with DHT11, Ultrasonic Sensor, and GPS
* Send JSON data to the Firebase Realtime Database path: `iot_data/latest`
* The dashboard automatically updates cards and charts in real-time

**JSON Example:**

```json
{
  "temperature": 28.5,
  "humidity": 45.2,
  "distance": 100,
  "latitude": 19.0735,
  "longitude": 72.8995,
  "gpsFix": true,
  "satellites": 8,
  "hdop": 0.9,
  "timestamp": "2025-10-13T12:00:00Z"
}
```

---

## Project Structure

```
aerosensor-dashboard/
├─ src/
│  ├─ LiveData.js       # Main live dashboard component
│  ├─ firebase.js       # Firebase configuration
│  └─ App.js
├─ public/
├─ package.json
└─ README.md
```

---

## Contributors

Made by **Kapil Dhavale**, **Riddhi Buva**, and **Manasvi Bhalerao** – ECS, VESIT

* [Kapil Dhavale LinkedIn](https://www.linkedin.com/in/kapildhavale)
* [Riddhi Buva LinkedIn](https://www.linkedin.com/in/riddhi-buva)
* Manasvi Bhalerao

---
