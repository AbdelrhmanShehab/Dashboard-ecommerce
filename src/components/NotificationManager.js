"use client";

import { useEffect } from "react";
import { messaging } from "../firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";

export default function NotificationManager() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          console.log("Service Worker registered with scope:", registration.scope);

          if (messaging && Notification.permission === "granted") {
            try {
              const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration,
              });
              if (token) {
                console.log("FCM Token:", token);
              } else {
                console.log("No registration token available.");
              }
            } catch (tokenError) {
              console.error("Error retrieving FCM token:", tokenError);
            }
          }
        } catch (err) {
          console.error("Service Worker registration failed:", err);
        }
      };

      registerServiceWorker();

      if (messaging) {
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log("Foreground message received:", payload);
          // Foreground notifications are handled by the browser if the user has permitted them
          // But we can also show a custom UI or trigger the sound here if needed.
          // However, Header.js is already listening to Firestore, which is more "real-time" for orders.
        });
        return () => unsubscribe();
      }
    }
  }, []);

  return null;
}
