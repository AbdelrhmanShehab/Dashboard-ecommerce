import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../firebaseAdmin";

export async function POST() {
    try {
        const auth = getAdminAuth();
        const db = getAdminDb();

        // 1. Get all Auth users
        const listUsersResult = await auth.listUsers();
        const authUids = new Set(listUsersResult.users.map((u) => u.uid));

        // 2. Get all Firestore users
        const usersSnap = await db.collection("users").get();

        let removedCount = 0;
        const batch = db.batch();

        usersSnap.forEach((doc) => {
            if (!authUids.has(doc.id)) {
                batch.delete(doc.ref);
                removedCount++;
            }
        });

        if (removedCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            message: "Cleanup successful",
            removedCount
        });
    } catch (error) {
        console.error("Error during cleanup:", error);
        return NextResponse.json({
            error: "Cleanup failed",
            details: "Please check server logs for more information."
        }, { status: 500 });
    }
}
