// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    serverTimestamp,
    query,
    orderBy,
    where,
    getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCA5Q12fvF9OLaqGBjsu_Rt3gsR1-1W2wA",
    authDomain: "send-message-a0983.firebaseapp.com",
    projectId: "send-message-a0983",
    storageBucket: "send-message-a0983.firebasestorage.app",
    messagingSenderId: "909629024465",
    appId: "1:909629024465:web:0871e44c5020cc6b39bdf0",
    measurementId: "G-0HFN3D351S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export fungsi dan objek yang diperlukan untuk manajemen kontak
export { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    serverTimestamp,
    query,
    orderBy,
    where,
    getCountFromServer
};

console.log("Firebase configured successfully!");
