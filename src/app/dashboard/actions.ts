"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { GmailClient, type Email } from "@/lib/gmail-client";
import { OpenAIClient } from "@/lib/openai-client";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  accessToken?: string;
};

export async function fetchAndClassifyEmails(openaiApiKey: string) {
  try {
    // Get user session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    // Get access token from session
    const accessToken = (session.user as AuthUser).accessToken;
    
    if (!accessToken) {
      throw new Error("No Google access token available");
    }

    // Fetch emails
    const gmailClient = new GmailClient(accessToken);
    const emails = await gmailClient.getRecentEmails(15);

    if (emails.length === 0) {
      throw new Error("No emails found or access denied");
    }

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

    return results;
  } catch (error) {
    console.error("Error in fetchAndClassifyEmails:", error);
    throw error;
  }
}