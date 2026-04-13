import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAD09MB-IyxS8qUKaE3Drv-gsnnt2InXU8",
  authDomain: "rankpush-78dbd.firebaseapp.com",
  projectId: "rankpush-78dbd",
  storageBucket: "rankpush-78dbd.firebasestorage.app",
  messagingSenderId: "241497746464",
  appId: "1:241497746464:web:6325428fdb5bb99e61e045",
  measurementId: "G-JG97RR43Y9",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
