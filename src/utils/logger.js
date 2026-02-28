import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Logs an administrative action to the database.
 * 
 * @param {string} action - The type of action (e.g., "Created Product", "Updated Stock")
 * @param {string} details - A human-readable description of exactly what changed
 * @param {Object} user - The currently authenticated admin user (from useAuth)
 * @param {Object} [changes] - Optional object detailing the before/after states of the edit
 */
export const logActivity = async (action, details, user, changes = null) => {
    if (!user) {
        console.warn("Attempted to log activity without a user object.");
        return;
    }

    try {
        await addDoc(collection(db, "activity_logs"), {
            action,
            details,
            user: {
                uid: user.uid,
                email: user.email,
                name: user.displayName || "Admin",
            },
            changes,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};
