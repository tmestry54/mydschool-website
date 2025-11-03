// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";  // <-- Add this import
//import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2Mjnsmd3epvRmowaAmhUPdjitysp3iVo",
  authDomain: "mydschool-3f3a0.firebaseapp.com",
  projectId: "mydschool-3f3a0",
  storageBucket: "mydschool-3f3a0.appspot.com",  // corrected minor typo
  messagingSenderId: "1042785485338",
  appId: "1:1042785485338:web:778b0b84db5d6bbf47c7a3",
  measurementId: "G-KDWT60MMME"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const db = getFirestore(app);  // <-- now works correctly
