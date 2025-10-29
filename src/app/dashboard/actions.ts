"use server";

import { GmailClient, type Email } from "@/lib/gmail-client";
import { OpenAIClient } from "@/lib/openai-client";
import { getServerSession } from "@/lib/auth-server";
import { getAuthDatabaseSync } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function fetchAndClassifyEmails(openaiApiKey: string) {
  try {
    // Get server session
    const session = await getServerSession();

    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Get Google access token from database with both string and ObjectId
    const db = getAuthDatabaseSync();
    
    let userIdObjectId;
    try {
      userIdObjectId = new ObjectId(session.user.id);
    } catch {
      userIdObjectId = null;
    }

    const account = await db.collection("account").findOne({
      $or: [
        { userId: session.user.id, providerId: "google" },
        { userId: userIdObjectId, providerId: "google" }
      ]
    });

    const accessToken = account?.accessToken;

    if (!accessToken) {
      console.error("No access token found for user:", session.user.id);
      console.error("Account found:", !!account);
      throw new Error("No Google access token available. Please sign out and sign in with Google again.");
    }

    console.log("Access token found, fetching emails...");

    // Fetch emails
    const gmailClient = new GmailClient(accessToken);
    const emails = await gmailClient.getRecentEmails(15);

    if (emails.length === 0) {
      throw new Error("No emails found or access denied");
    }

    console.log(`Fetched ${emails.length} emails, starting classification...`);

    // Classify emails
    const openaiClient = new OpenAIClient(openaiApiKey);
    const classifications = await openaiClient.classifyMultipleEmails(emails);

    // Combine results
    const results = emails.map((email: Email, index) => ({
      email,
      classification: {
        ...classifications[index],
        category: classifications[index]?.category || 'general' as const,
        confidence: classifications[index]?.confidence || 0.5,
        reasoning: classifications[index]?.reasoning || 'Classification not available'
      }
    }));

    console.log(`Successfully classified ${results.length} emails`);

    return results;
  } catch (error) {
    console.error("Error in fetchAndClassifyEmails:", error);
    throw error;
  }
}