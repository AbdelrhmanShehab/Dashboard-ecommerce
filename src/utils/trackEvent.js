import { doc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Atomically updates product engagement stats in Firestore.
 * Fire-and-forget — does NOT block the UI (no await needed).
 *
 * @param {string} productId  - Firestore document ID of the product
 * @param {'click'|'view'|'cart'|'purchase'} event - The event type
 * @param {{ qty?: number, price?: number, email?: string, name?: string }} [meta] - Extra data
 */
export function trackEvent(productId, event, meta = {}) {
    if (!productId || !event) return;

    const ref = doc(db, "productStats", productId);

    const updates = {};

    switch (event) {
        case "click":
            updates.clicks = increment(1);
            break;
        case "view":
            updates.views = increment(1);
            break;
        case "cart":
            updates.cartAdds = increment(1);
            break;
        case "purchase": {
            const qty = meta.qty ?? 1;
            const price = meta.price ?? 0;
            updates.purchases = increment(qty);
            updates.revenue = increment(price * qty);
            break;
        }
        default:
            console.warn(`[trackEvent] Unknown event type: "${event}"`);
            return;
    }

    // merge:true creates the document if it doesn't exist
    setDoc(ref, updates, { merge: true }).catch((err) =>
        console.error("[trackEvent] Failed to track event:", err)
    );

    // Track Lead activity if email is provided
    if (meta.email && (event === "cart" || event === "view")) {
        const leadId = `${meta.email}_${productId}`;
        const leadRef = doc(db, "leads", leadId);
        setDoc(leadRef, {
            email: meta.email,
            name: meta.name || "",
            productId: productId,
            lastActivity: event,
            status: "pending",
            updatedAt: serverTimestamp(),
        }, { merge: true }).catch(() => { });
    }
}
