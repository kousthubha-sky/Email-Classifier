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
  const [checkingGoogleAuth, setCheckingGoogleAuth] = useState(true);
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);

  // Check if user has Google authentication
  useEffect(() => {
    async function checkGoogleAuth() {
      if (!session?.user?.id) {
        setCheckingGoogleAuth(false);
        return;
      }

      try {
        const response = await fetch('/api/check-google-auth');
        const data = await response.json();
        setHasGoogleAuth(data.hasGoogleAuth);
        
        if (data.hasGoogleAuth) {
          toast.success("Google account connected successfully!");
        }
      } catch (err) {
        console.error('Failed to check Google auth:', err);
        setHasGoogleAuth(false);
      } finally {
        setCheckingGoogleAuth(false);
      }
    }

    checkGoogleAuth();
  }, [session?.user?.id]);

  // Re-check Google auth when page becomes visible (after OAuth redirect)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user?.id) {
        setCheckingGoogleAuth(true);
        fetch('/api/check-google-auth')
          .then(res => res.json())
          .then(data => {
            setHasGoogleAuth(data.hasGoogleAuth);
            if (data.hasGoogleAuth) {
              toast.success("Google account connected successfully!");
            }
          })
          .catch(err => console.error('Failed to re-check Google auth:', err))
          .finally(() => setCheckingGoogleAuth(false));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session?.user?.id]);

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

    if (!hasGoogleAuth) {
      setError("Please connect your Google account to access Gmail");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await fetchAndClassifyEmails(openaiKey);
      setEmails(result);
      toast.success(`Successfully classified ${result.length} emails`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch and classify emails";
      setError(errorMessage);
      toast.error(errorMessage);
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

 

  const handleRefreshAuthStatus = async () => {
    setCheckingGoogleAuth(true);
    try {
      const response = await fetch('/api/check-google-auth');
      const data = await response.json();
      setHasGoogleAuth(data.hasGoogleAuth);
      
      if (data.hasGoogleAuth) {
        toast.success("Google account is connected!");
      } else {
        toast.error("Google account not connected");
      }
    } catch (err) {
      console.error('Failed to check Google auth:', err);
      toast.error("Failed to check connection status");
    } finally {
      setCheckingGoogleAuth(false);
    }
  };

  if (sessionLoading || checkingGoogleAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/login');
    return null;
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

        {/* Google Authentication Status */}
        {!hasGoogleAuth ? (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-yellow-900">
                  Google Account Required
                </h3>
                <div className="mt-2 text-yellow-800">
                  <p className="mb-3">
                    To classify your Gmail emails, you need to sign in with your Google account.
                  </p>
                  <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mb-4">
                    <p className="text-sm font-medium mb-2">📝 Quick Fix:</p>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Click `Logout`(top right)</li>
                      <li>Click `Sign In` and choose `Continue with Google`</li>
                      <li>Grant Gmail permissions</li>
                      <li>Return here and start classifying!</li>
                    </ol>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSignOut}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      Logout & Sign in with Google
                    </button>
                    <button
                      onClick={handleRefreshAuthStatus}
                      disabled={checkingGoogleAuth}
                      className="inline-flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">
                  ✓ Google Account Connected - Ready to classify emails
                </span>
              </div>
              <button
                onClick={handleRefreshAuthStatus}
                disabled={checkingGoogleAuth}
                className="text-green-700 hover:text-green-800 text-sm font-medium disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* API Key Input */}
        <ApiKeyInput 
          currentKey={openaiKey} 
          onSave={handleApiKeySave}
        />

        {/* Fetch Button */}
        <div className="flex justify-center">
          <button
            onClick={handleFetchEmails}
            disabled={loading || !hasGoogleAuth || !openaiKey}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Fetching and Classifying...
              </span>
            ) : (
              "Fetch & Classify Last 15 Emails"
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-600 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-medium text-red-800">Error</span>
                <p className="mt-1 text-red-700">{error}</p>
              </div>
            </div>
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