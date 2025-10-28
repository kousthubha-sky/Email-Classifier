"use client";

import { useState, useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmailList } from "./components/email-list";
import { ClassificationResults } from "./components/classification-results";
import { ApiKeyInput } from "./components/api-key-input";
import { fetchAndClassifyEmails } from "./actions";

interface ClassifiedEmail {
  email: {
    id: string;
    subject: string;
    from: string;
    snippet: string;
    body: string;
    date: string;
  };
  classification: {
    category: string;
    confidence: number;
    reasoning: string;
  };
}

export default function DashboardPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [emails, setEmails] = useState<ClassifiedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Load OpenAI key from localStorage
    const savedKey = localStorage.getItem("openai_api_key");
    if (savedKey) {
      setOpenaiKey(savedKey);
    }
  }, []);

  const handleApiKeySave = (key: string) => {
    setOpenaiKey(key);
    localStorage.setItem("openai_api_key", key);
  };

  const handleFetchEmails = async () => {
    if (!openaiKey) {
      setError("Please enter your OpenAI API key first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await fetchAndClassifyEmails(openaiKey);
      setEmails(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch and classify emails";
      setError(errorMessage);
      
      if (errorMessage.includes("Google access token")) {
        setError(prev => prev + ". Please sign out and sign in again with Google.");
      } else if (errorMessage.includes("Gmail API")) {
        setError(prev => prev + ". Make sure Gmail API is enabled and you have granted permissions.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Successfully signed out");
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const handleReauthenticate = () => {
    window.location.href = '/auth/login?provider=google';
  };

  if (sessionLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!session) {
    return <div className="flex justify-center p-8">Please sign in to access the dashboard</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Logout */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Email Classifier</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Welcome, {session.user.email}
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* API Key Input */}
        <ApiKeyInput 
          currentKey={openaiKey} 
          onSave={handleApiKeySave}
        />

        {/* Authentication Status */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Gmail Access Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You need to sign in with Google to access Gmail. 
                  {session.user.email?.includes('gmail.com') ? 
                    " You're using a Gmail account - please sign in with Google to grant access." :
                    " Please use a Google account to access Gmail features."
                  }
                </p>
                <button
                  onClick={handleReauthenticate}
                  className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
                >
                  Sign in with Google
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fetch Button */}
        <div className="flex justify-center">
          <button
            onClick={handleFetchEmails}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Fetching and Classifying..." : "Fetch & Classify Last 15 Emails"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Error</span>
            </div>
            <p className="mt-2">{error}</p>
          </div>
        )}

        {/* Results */}
        {emails.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmailList emails={emails.map(e => e.email)} />
            <ClassificationResults emails={emails} />
          </div>
        )}
      </div>
    </div>
  );
}