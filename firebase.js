import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCaHa3zZjeVXz4sPNRo2X5lORJ8NZuwmPg",
  authDomain: "ecoearn-29f43.firebaseapp.com",
  databaseURL: "https://ecoearn-29f43-default-rtdb.firebaseio.com",
  projectId: "ecoearn-29f43",
  storageBucket: "ecoearn-29f43.firebasestorage.app",
  messagingSenderId: "258122544601",
  appId: "1:258122544601:web:00479f72cdd79a45ab55c8",
  measurementId: "G-LTL6RPKDQ8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
