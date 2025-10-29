// app/api/debug-account/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAuthDatabaseSync } from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No session" });
    }

    const db = getAuthDatabaseSync();
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Find user
    const user = await db.collection("user").findOne({ id: session.user.id });
    
    // Try different account queries
    const accountByUserId = await db.collection("account").findOne({
      userId: session.user.id
    });
    
    const accountByProviderId = await db.collection("account").findOne({
      userId: session.user.id,
      providerId: "google"
    });
    
    const accountByProvider = await db.collection("account").findOne({
      userId: session.user.id,
      provider: "google"
    });
    
    // Get all accounts for this user
    const allAccounts = await db.collection("account").find({
      userId: session.user.id
    }).toArray();

    // Sanitize tokens
    type AccountLike = Record<string, unknown> & {
      accessToken?: string;
      access_token?: string;
      refreshToken?: string;
      refresh_token?: string;
    };

    const sanitize = (obj: AccountLike | null | undefined): AccountLike | null | undefined => {
      if (!obj) return obj;
      const accessToken = typeof obj.accessToken === "string" && obj.accessToken.length > 0
        ? `${obj.accessToken.slice(0, 6)}...${obj.accessToken.slice(-4)}`
        : undefined;
      const access_token = typeof obj.access_token === "string" && obj.access_token.length > 0
        ? `${obj.access_token.slice(0, 6)}...${obj.access_token.slice(-4)}`
        : undefined;
      const refreshToken = typeof obj.refreshToken === "string" && obj.refreshToken.length > 0 ? "***" : undefined;
      const refresh_token = typeof obj.refresh_token === "string" && obj.refresh_token.length > 0 ? "***" : undefined;

      return {
        ...obj,
        accessToken,
        access_token,
        refreshToken,
        refresh_token,
      };
    };

    return NextResponse.json({ 
      userId: session.user.id,
      email: session.user.email,
      collections: collectionNames,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      } : null,
      queries: {
        byUserId: sanitize(accountByUserId),
        byProviderId: sanitize(accountByProviderId),
        byProvider: sanitize(accountByProvider),
        allAccounts: allAccounts.map(sanitize)
      },
      accountFields: allAccounts[0] ? Object.keys(allAccounts[0]) : []
    });
  } catch (error) {
    console.error("Error debugging account:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}