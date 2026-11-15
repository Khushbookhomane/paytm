"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest, storeAuthResponse, authStorage, AuthResponse } from "@/lib/api";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

/**
 * Handles two flows:
 * 1. Google OAuth callback — backend redirects here with ?token=<session_token>
 * 2. Magic link verify — /auth/verify?token=<magic_token> (legacy path kept working)
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      const messages: Record<string, string> = {
        google_cancelled: "Google sign-in was cancelled.",
        google_failed: "Google sign-in failed. Please try again.",
        google_not_configured: "Google sign-in is not available right now.",
        google_unverified_email: "Your Google account email is not verified.",
        account_suspended: "Your account has been suspended.",
      };
      setStatus("error");
      setError(messages[errorParam] || "Sign-in failed. Please try again.");
      return;
    }

    if (!token) {
      setStatus("error");
      setError("No sign-in token found. Please request a new sign-in link.");
      return;
    }

    // Determine if this is a Google session token (already a session) or a magic link token
    // Google tokens are stored directly; magic link tokens need verification
    const pathname = window.location.pathname;
    const isMagicLink = pathname.includes("/verify");

    if (isMagicLink) {
      // Magic link verification
      apiRequest<AuthResponse>("/auth/magic-link/verify", {
        method: "POST",
        body: JSON.stringify({ token }),
      })
        .then((data) => {
          storeAuthResponse(data);
          setStatus("success");
          redirectAfterAuth(data, router);
        })
        .catch((err) => {
          setStatus("error");
          setError(err.message || "This sign-in link is invalid or has expired.");
        });
    } else {
      // Google OAuth — token is already a session token, store it and fetch user
      authStorage.setToken(token);
      apiRequest<any>("/auth/me")
        .then((user) => {
          authStorage.setUser(user);
          authStorage.setMerchant(user);
          authStorage.setLanguage((user.language as "en" | "hi" | "mr") || "en");
          setStatus("success");
          redirectAfterAuthUser(user, router);
        })
        .catch((err) => {
          authStorage.clear();
          setStatus("error");
          setError(err.message || "Failed to load your account.");
        });
    }
  }, [searchParams, router]);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #002E6E 0%, #003d8f 50%, #042B62 100%)" }}
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
        {status === "verifying" && (
          <>
            <Loader2 className="w-10 h-10 text-[#00BAF2] animate-spin mx-auto mb-4" />
            <h2 className="font-bold text-slate-900 text-lg">Signing you in…</h2>
            <p className="text-xs text-slate-500 mt-1">Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="font-bold text-slate-900 text-lg">Signed in successfully!</h2>
            <p className="text-xs text-slate-500 mt-1">Redirecting…</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="font-bold text-slate-900 text-lg">Sign-in failed</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
            <button
              onClick={() => router.replace("/sign-in")}
              className="w-full py-3 text-white font-bold text-sm rounded-xl"
              style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function redirectAfterAuth(data: AuthResponse, router: ReturnType<typeof useRouter>) {
  redirectAfterAuthUser(data.user, router);
}

function redirectAfterAuthUser(user: any, router: ReturnType<typeof useRouter>) {
  if (!user) { router.replace("/sign-in"); return; }
  if (user.onboarding_complete) {
    router.replace("/home");
  } else if (user.organization_id) {
    router.replace("/onboarding");
  } else {
    router.replace("/onboarding/business");
  }
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex-1 flex items-center justify-center min-h-screen"
          style={{ background: "linear-gradient(160deg, #002E6E 0%, #003d8f 50%, #042B62 100%)" }}
        >
          <Loader2 className="w-8 h-8 text-[#00BAF2] animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
