// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// তোমার Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAD09MB-IyxS8qUKaE3Drv-gsnnt2InXU8",
  authDomain: "rankpush-78dbd.firebaseapp.com",
  projectId: "rankpush-78dbd",
  storageBucket: "rankpush-78dbd.firebasestorage.app",
  messagingSenderId: "241497746464",
  appId: "1:241497746464:web:6325428fdb5bb99e61e045",
  measurementId: "G-JG97RR43Y9",
};

// Duplicate App Error এড়ানোর জন্য স্মার্ট অ্যাপ ইনিশিয়ালাইজেশন
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Auth & Firestore এক্সপোর্ট
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);        // ← এটা আগে ছিল না, এখন যোগ করা হয়েছে

export { app };