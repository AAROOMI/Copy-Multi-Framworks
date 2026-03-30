
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBY2XUA9lh47JrdPLUJq-D3hkCioDC9SIs",
  authDomain: "gen-lang-client-0539526472.firebaseapp.com",
  projectId: "gen-lang-client-0539526472",
  storageBucket: "gen-lang-client-0539526472.firebasestorage.app",
  messagingSenderId: "442027961273",
  appId: "1:442027961273:web:22821c914b88e59bb96468",
  measurementId: "G-HHYHQKSJMX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Analytics
export const analytics = getAnalytics(app);
