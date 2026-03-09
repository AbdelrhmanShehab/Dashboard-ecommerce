import { getAdminDb } from "../../firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Server-side product stats tracker (Firebase Admin SDK).
 * Use this in Next.js API routes (e.g. app/api/orders/route.js).
 * Runs inside the server — safe to await.
 *
 * @param {string} productId  - Firestore document ID of the product
 * @param {'click'|'view'|'cart'|'purchase'} event - The event type
 * @param {{ qty?: number, price?: number, email?: string }} [meta] - Extra data for purchases
 */
export async function trackEventServer(productId, event, meta = {}) {
    if (!productId || !event) return;

    try {
        const db = getAdminDb();
        const ref = db.collection("productStats").doc(productId);

        const updates = {};

        switch (event) {
            case "click":
                updates.clicks = FieldValue.increment(1);
                break;
            case "view":
                updates.views = FieldValue.increment(1);
                break;
            case "cart":
                updates.cartAdds = FieldValue.increment(1);
                break;
            case "purchase": {
                const qty = meta.qty ?? 1;
                const price = meta.price ?? 0;
                updates.purchases = FieldValue.increment(qty);
                updates.revenue = FieldValue.increment(price * qty);
                break;
            }
            default:
                console.warn(`[trackEventServer] Unknown event type: "${event}"`);
                return;
        }

        // merge (set with merge) creates the document if it doesn't exist
        await ref.set(updates, { merge: true });

        // Mark leads as converted
        if (meta.email && event === "purchase") {
            const leadId = `${meta.email}_${productId}`;
            await db.collection("leads").doc(leadId).update({
                status: "converted",
                convertedAt: FieldValue.serverTimestamp()
            }).catch(() => { }); // Ignore if lead doc doesn't exist
        }

    } catch (err) {
        // Never crash an order from a tracking failure
        console.error("[trackEventServer] Failed to track event:", err);
    }
}
