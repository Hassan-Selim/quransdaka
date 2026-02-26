function waitForFirebase(callback) {
  if (typeof firebase !== "undefined") {
    callback();
  } else {
    setTimeout(() => waitForFirebase(callback), 100);
  }
}

waitForFirebase(() => {

  console.log("Firebase جاهز ✅");

  const messaging = firebase.messaging();

  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      messaging.getToken({
        vapidKey: "BBBtubURw4DTgm4XWhgNj-x0_kzHjnLt9pWA0_9In9wqpO3DmIecYxMdqcPlD3L6Mt7vPOmg8Q6Zc1KXc9oEGug"
      }).then(token => {
        console.log("User Token:", token);
      });
    }
  });

  messaging.onMessage((payload) => {
    const { title, body } = payload.notification || {};
    if (title && body) {
      new Notification(title, { body });
    }
  });

});