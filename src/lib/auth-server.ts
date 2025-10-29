import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAuthDatabaseSync } from "@/lib/mongodb";

/**
 * Server-side utility to get authenticated user session
 * Redirects to login if no session exists
 */
export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      redirect("/auth/login");
    }

    return session;
  } catch (error) {
    console.error("Server session validation error:", error);
    redirect("/auth/login");
  }
}

/**
 * Server-side utility to check if user is authenticated
 * Returns session or null (doesn't redirect)
 */
export async function getOptionalServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    return session?.user ? session : null;
  } catch (error) {
    console.error("Server session check error:", error);
    return null;
  }
}

export async function getGoogleAccessToken(userId: string) {
  try {
    const db = getAuthDatabaseSync();
    
    // Try with providerId first (Better Auth v1)
    let account = await db.collection("accounts").findOne({
      userId: userId,
      providerId: "google"
    });

    // Fallback to provider field (older versions)
    if (!account) {
      account = await db.collection("accounts").findOne({
        userId: userId,
        provider: "google"
      });
    }

    console.log("Getting access token for user:", userId);
    console.log("Account found:", !!account);
    console.log("Access token exists:", !!(account?.accessToken || account?.access_token));

    // Check both possible field names
    return account?.accessToken || account?.access_token || null;
  } catch (error) {
    console.error("Error getting Google access token:", error);
    return null;
  }
}

/**
 * Enhanced server session with Google access token
 */
export async function getEnhancedServerSession() {
  try {
    const session = await getServerSession();
    
    if (session?.user) {
      const accessToken = await getGoogleAccessToken(session.user.id);
      return {
        ...session,
        accessToken
      };
    }
    
    return null;
  } catch (error) {
    console.error("Enhanced session error:", error);
    return null;
  }
}