importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCQa6Nx0YPRM6v4A9-mXlIFP0-Gw_MSPCg",
  authDomain: "hedoomyy.firebaseapp.com",
  projectId: "hedoomyy",
  storageBucket: "gs://hedoomyy.firebasestorage.app",
  messagingSenderId: "298566845163",
  appId: "1:298566845163:web:5c284e9ce1f53bc33474ae",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/sidebar-icon.svg',
    vibrate: [200, 100, 200, 100, 400],
    sound: '/notification.mp3', // Supported by some mobile browsers/OS
    tag: 'order-notification',
    data: {
      url: '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
