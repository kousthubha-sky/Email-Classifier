import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { GmailClient } from "@/lib/gmail-client";
import { OpenAIClient } from "@/lib/openai-client";
import { getAuthDatabaseSync } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the request body
    const { openaiApiKey } = await request.json();

    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key required" }, { status: 400 });
    }

    // For Better Auth, we need to get the account to access the access token
    const db = getAuthDatabaseSync();
    const account = await db.collection("accounts").findOne({
      userId: session.user.id,
      provider: "google"
    });

    if (!account?.access_token) {
      return NextResponse.json({ error: "No Google access token available" }, { status: 400 });
    }

    // Fetch emails using the access token from the account
    const gmailClient = new GmailClient(account.access_token);
    const emails = await gmailClient.getRecentEmails(15);

    if (emails.length === 0) {
      return NextResponse.json({ error: "No emails found" }, { status: 404 });
    }

    // Classify emails
    const openaiClient = new OpenAIClient(openaiApiKey);
    const classifications = await openaiClient.classifyMultipleEmails(emails);

    // Combine results
    const results = emails.map((email, index) => ({
      email,
      classification: classifications[index] || {
        category: 'general',
        confidence: 0.5,
        reasoning: 'Classification not available'
      }
    }));

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Gmail API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch emails" },
      { status: 500 }
    );
  }
}