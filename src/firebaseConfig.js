// src/firebaseConfig.js

// Import the required Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import Firebase Authentication
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getAnalytics } from "firebase/analytics"; // Import Analytics (if needed)

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlc6554D41zalJAEHYbZUDtGsa1Z1OegU",
  authDomain: "capstone-android-41771.firebaseapp.com",
  projectId: "capstone-android-41771",
  storageBucket: "capstone-android-41771.appspot.com",
  messagingSenderId: "790713922702",
  appId: "1:790713922702:web:e0755ea4a7f0c7c335c5df",
  measurementId: "G-RFTJ37NP2W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app); // Firebase Authentication
const firestore = getFirestore(app); // Firestore database
const analytics = getAnalytics(app); // Optional: Only use if you're using Google Analytics

// Export the initialized services for use in your app
export { auth, firestore, analytics };

