import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../firebaseAdmin";

export async function POST(req) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const user = await adminAuth.createUser({
      email,
      password,
    });

    await adminDb.collection("users").doc(user.uid).set({
      email,
      Role: role,
      Status: "active",
      Created: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    let message = "Something went wrong";
    let status = 500;

    if (error.code === "auth/email-already-exists") {
      message = "Email already exists";
      status = 409;
    }

    if (error.code === "auth/invalid-email") {
      message = "Invalid email format";
      status = 400;
    }

    return NextResponse.json({ error: message }, { status });
  }
}
