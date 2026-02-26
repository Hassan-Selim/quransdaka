// Service Worker لـ Firebase
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// ⚡ تهيئة Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCb_96TzCvRetQWHIqn-lExzGcCHKT7E0E",
  authDomain: "quran-sadaka.firebaseapp.com",
  projectId: "quran-sadaka",
  storageBucket: "quran-sadaka.appspot.com",
  messagingSenderId: "375258784873",
  appId: "1:375258784873:web:d92b2fc154187b0e1f2ef8",
  measurementId: "G-XJ4G6WV316"
});

const messaging = firebase.messaging();

// إشعارات الخلفية
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] رسالة واردة في الخلفية:', payload);
  const { title, body } = payload.notification || {};
  if (title && body) {
    self.registration.showNotification(title, { body });
  }
});