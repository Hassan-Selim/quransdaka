// تسجيل SW الأساسي
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}

// تسجيل Firebase SW
navigator.serviceWorker.register('/firebase-messaging-sw.js')
  .then(() => {
    loadFirebase();
  });

function loadFirebase() {

  const appScript = document.createElement("script");
  appScript.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
  document.head.appendChild(appScript);

  appScript.onload = () => {

    const msgScript = document.createElement("script");
    msgScript.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js";
    document.head.appendChild(msgScript);

    msgScript.onload = () => {

      firebase.initializeApp({
        apiKey: "AIzaSyCb_96TzCvRetQWHIqn-lExzGcCHKT7E0E",
        authDomain: "quran-sadaka.firebaseapp.com",
        projectId: "quran-sadaka",
        storageBucket: "quran-sadaka.appspot.com",
        messagingSenderId: "375258784873",
        appId: "1:375258784873:web:d92b2fc154187b0e1f2ef8"
      });

      const notifScript = document.createElement("script");
      notifScript.src = "../js/notifications.js";
      document.body.appendChild(notifScript);
    };
  };
}