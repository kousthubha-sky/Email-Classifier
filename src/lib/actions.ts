"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAuthDatabaseSync } from "@/lib/mongodb";

// Get authenticated user with Google access token
async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  
  return session.user;
}

// Fetch user's email preferences from database
export async function getUserPreferences() {
  try {
    const user = await getAuthenticatedUser();
    const db = getAuthDatabaseSync();
    const preferences = await db.collection('userPreferences').findOne({ userId: user.id });
    return preferences || { userId: user.id };
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    throw error;
  }
}

// Update user's email preferences
export async function updateUserPreferences(data: { openaiApiKey?: string }) {
  try {
    const user = await getAuthenticatedUser();
    const db = getAuthDatabaseSync();
    
    await db.collection('userPreferences').updateOne(
      { userId: user.id },
      { 
        $set: {
          ...data,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
}