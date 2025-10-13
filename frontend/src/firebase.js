// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBXgBt6ZGAEPMdSY39V8swJ6esAOWPDYlQ",
  authDomain: "iotprojectexp8.firebaseapp.com",
  databaseURL: "https://iotprojectexp8-default-rtdb.firebaseio.com",
  projectId: "iotprojectexp8",
  storageBucket: "iotprojectexp8.firebasestorage.app",
  messagingSenderId: "645990672071",
  appId: "1:645990672071:web:0980f0a51bfe94826700e2",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, onValue };
