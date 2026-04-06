import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// আপনার কনসোল থেকে পাওয়া রিয়েল কনফিগ
const firebaseConfig = {
  apiKey: "AIzaSyAD09MB-IyxS8qUKaE3Drv-gsnnt2InXU8",
  authDomain: "rankpush-78dbd.firebaseapp.com",
  projectId: "rankpush-78dbd",
  storageBucket: "rankpush-78dbd.firebasestorage.app",
  messagingSenderId: "241497746464",
  appId: "1:241497746464:web:6325428fdb5bb99e61e045",
  measurementId: "G-JG97RR43Y9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();