"use client";

import { useEffect } from "react";
import { doc, setDoc, serverTimestamp, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Hook to track user presence on the storefront.
 * @param {string} userEmail - Optional email if user is logged in
 * @param {string} currentPath - Current page path
 */
export function usePresence(userEmail = null, currentPath = "/") {
    useEffect(() => {
        // Create a unique session ID for this tab/window
        const sessionId = Math.random().toString(36).substring(2, 15);
        const presenceRef = doc(db, "activePresence", sessionId);

        const updatePresence = async () => {
            try {
                await setDoc(presenceRef, {
                    email: userEmail || "Anonymous",
                    path: currentPath,
                    lastActive: serverTimestamp(),
                    sessionId: sessionId
                });
            } catch (err) {
                console.error("Presence update error:", err);
            }
        };

        // Initial heartbeat
        updatePresence();

        // Heartbeat every 45 seconds
        const interval = setInterval(updatePresence, 45000);

        // Cleanup on unmount (tab closed/refreshed)
        const handleUnload = () => {
            // Note: We don't await this as the window is closing
            deleteDoc(presenceRef);
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            clearInterval(interval);
            window.removeEventListener("beforeunload", handleUnload);
            deleteDoc(presenceRef).catch(() => { });
        };
    }, [userEmail, currentPath]);
}
