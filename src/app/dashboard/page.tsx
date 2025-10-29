"use client";

import { useState, useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmailList } from "./components/email-list";
import { ClassificationResults } from "./components/classification-results";
import { ApiKeyInput } from "./components/api-key-input";
import { fetchAndClassifyEmails } from "./actions";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, RefreshCw, LogOut, Loader2 } from "lucide-react";

import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";


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
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto" />
          </motion.div>
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
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Logout */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Email Classifier</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">Welcome, {session.user.email}</div>
            <Button onClick={handleSignOut} className="inline-flex items-center gap-2 bg-red-600 text-white hover:bg-red-700">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Google Authentication Status */}
        {!hasGoogleAuth ? (
          <Card className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-yellow-900">Google Account Required</h3>
                <div className="mt-2 text-yellow-800">
                  <p className="mb-3">To classify your Gmail emails, you need to sign in with your Google account.</p>
                  <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mb-4">
                    <p className="text-sm font-medium mb-2">📝 Quick Fix:</p>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Click `Logout` (top right)</li>
                      <li>Click `Sign In` and choose `Continue with Google`</li>
                      <li>Grant Gmail permissions</li>
                      <li>Return here and start classifying!</li>
                    </ol>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSignOut} className="inline-flex items-center gap-2 bg-red-600 text-white hover:bg-red-700">
                      <LogOut className="h-4 w-4" />
                      Logout & Sign in with Google
                    </Button>
                    <Button onClick={handleRefreshAuthStatus} disabled={checkingGoogleAuth} className="inline-flex items-center gap-2 bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 disabled:opacity-50">
                      <RefreshCw className="h-4 w-4" />
                      Refresh Status
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">✓ Google Account Connected - Ready to classify emails</span>
              </div>
              <Button onClick={handleRefreshAuthStatus} disabled={checkingGoogleAuth} className="text-green-700 hover:text-green-800 text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </Card>
        )}

        {/* API Key Input */}
        <ApiKeyInput currentKey={openaiKey} onSave={handleApiKeySave} />

        {/* Fetch Button */}
        <div className="flex justify-center">
          <Button onClick={handleFetchEmails} disabled={loading || !hasGoogleAuth || !openaiKey} className="inline-flex items-center gap-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium">
            {loading ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Loader2 className="h-5 w-5" />
                </motion.span>
                <span>Fetching and Classifying...</span>
              </>
            ) : (
              "Fetch & Classify Last 15 Emails"
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <span className="font-medium text-red-800">Error</span>
                <p className="mt-1 text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {emails.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmailList emails={emails.map(e => e.email)} />
            <ClassificationResults emails={emails} />
          </div>
        )}
      </div>
    </motion.div>
  );
}