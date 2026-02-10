import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDyFpUNVE9byLsdhDT0v0xApefI8sSOpSw",
    authDomain: "dataiq-291ae.firebaseapp.com",
    projectId: "dataiq-291ae",
    storageBucket: "dataiq-291ae.firebasestorage.app",
    messagingSenderId: "706708540563",
    appId: "1:706708540563:web:e673276f73c0b19d2e1166",
    measurementId: "G-5BXDB8YJEB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export { app, analytics, auth, db, storage, googleProvider, githubProvider };
