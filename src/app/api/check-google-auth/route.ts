// app/api/check-google-auth/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAuthDatabaseSync } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      return NextResponse.json({ hasGoogleAuth: false, reason: "No session" });
    }

    const db = getAuthDatabaseSync();
    
    // Try both string and ObjectId for userId
    const userIdString = session.user.id;
    let userIdObjectId;
    try {
      userIdObjectId = new ObjectId(session.user.id);
    } catch {
      userIdObjectId = null;
    }

    // Check with both userId formats
    const account = await db.collection("account").findOne({
      $or: [
        { userId: userIdString, providerId: "google" },
        { userId: userIdObjectId, providerId: "google" }
      ]
    });

    console.log("Checking Google auth for user:", session.user.id);
    console.log("Found account:", account ? "Yes" : "No");
    console.log("Has access token:", !!account?.accessToken);

    return NextResponse.json({ 
      hasGoogleAuth: !!account?.accessToken,
      debug: {
        userId: session.user.id,
        accountFound: !!account,
        hasAccessToken: !!account?.accessToken
      }
    });
  } catch (error) {
    console.error("Error checking Google auth:", error);
    return NextResponse.json({ 
      hasGoogleAuth: false, 
      reason: "Error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}