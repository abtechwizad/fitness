import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXNjW87xM0NxqBYSwE1UdOl6qLjxgmc7U",
  authDomain: "fitness-77cc8.firebaseapp.com",
  projectId: "fitness-77cc8",
  storageBucket: "fitness-77cc8.firebasestorage.app",
  messagingSenderId: "393545683922",
  appId: "1:393545683922:web:03f70baea7668dc29aee0b",
  measurementId: "G-XYFSJNRK4T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
