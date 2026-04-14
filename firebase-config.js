// firebase-config.js
// Firebase + Cloudinary Configuration

// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
  apiKey: "AIzaSyCFTMtaIp9ld3UKmscT8MBxfCKh5_-fOcM",
  authDomain: "amre-3fae9.firebaseapp.com",
  databaseURL: "https://amre-3fae9-default-rtdb.firebaseio.com",
  projectId: "amre-3fae9",
  storageBucket: "amre-3fae9.firebasestorage.app",
  messagingSenderId: "573470407576",
  appId: "1:573470407576:web:3a24d023cbb10d6ce309ed",
  measurementId: "G-MEB1GL3ET7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

console.log("🔥 Firebase initialized - Admin: jasim28v@gmail.com");

// ==================== CLOUDINARY CONFIG ====================
const CLOUDINARY_CLOUD_NAME = 'do33_x';
const CLOUDINARY_COLLECTION = 'da457cqma';
const CLOUDINARY_UPLOAD_PRESET = 'pinterest_upload';

console.log("☁️ Cloudinary ready - Cloud:", CLOUDINARY_CLOUD_NAME);
