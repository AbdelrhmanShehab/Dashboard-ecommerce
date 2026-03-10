import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../firebaseAdmin"

export async function GET() {
    try {
        const auth = getAdminAuth();
        const db = getAdminDb();

        // 1. Fetch all users from Firebase Auth
        const listUsersResult = await auth.listUsers();
        const authUsers = listUsersResult.users;

        // 2. Fetch all users from Firestore to get roles/names
        const usersSnap = await db.collection("users").get();
        const firestoreUsers = {};
        usersSnap.forEach((doc) => {
            firestoreUsers[doc.id] = doc.data();
        });

        // 3. Merge data
        const mergedUsers = authUsers.map((authUser) => {
            const fUser = firestoreUsers[authUser.uid] || {};
            return {
                id: authUser.uid,
                email: authUser.email,
                name: fUser.name || authUser.displayName || "N/A",
                role: fUser.role || "editor",
                status: fUser.status || "active",
                createdAt: authUser.metadata.creationTime,
                lastSignIn: authUser.metadata.lastSignInTime,
            };
        });

        return NextResponse.json(mergedUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({
            error: "Failed to fetch users",
            details: "Administrative credentials might be missing or invalid."
        }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get("id");

        if (!uid) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const auth = getAdminAuth();
        const db = getAdminDb();

        // Delete from Auth
        await auth.deleteUser(uid);

        // Delete from Firestore
        await db.collection("users").doc(uid).delete();

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
