// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging.js";

// إعدادات Firebase الخاصة بمشروعك
const firebaseConfig = {
  apiKey: "AIzaSyCb_96TzCvRetQWHIqn-lExzGcCHKT7E0E",
  authDomain: "quran-sadaka.firebaseapp.com",
  projectId: "quran-sadaka",
  storageBucket: "quran-sadaka.appspot.com",
  messagingSenderId: "375258784873",
  appId: "1:375258784873:web:d92b2fc154187b0e1f2ef8",
  measurementId: "G-XJ4G6WV316"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);