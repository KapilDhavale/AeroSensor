const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set } = require("firebase/database");

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBXgBt6ZGAEPMdSY39V8swJ6esAOWPDYlQ",
  authDomain: "iotprojectexp8.firebaseapp.com",
  databaseURL: "https://iotprojectexp8-default-rtdb.firebaseio.com",
  projectId: "iotprojectexp8",
  storageBucket: "iotprojectexp8.firebasestorage.app",
  messagingSenderId: "645990672071",
  appId: "1:645990672071:web:0980f0a51bfe94826700e2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Log confirmation
console.log("✅ Firebase initialized and database ready");

module.exports = { database, ref, set };
