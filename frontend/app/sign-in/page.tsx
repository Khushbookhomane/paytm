"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import EmailMagicLinkForm from "@/components/EmailMagicLinkForm";
import PasskeyButton from "@/components/PasskeyButton";
import { apiRequest, storeAuthResponse, AuthResponse } from "@/lib/api";
import { Sparkles, AlertCircle, KeyRound, ArrowRight, Store } from "lucide-react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [email, setEmail] = useState("demo@venture.ai");
  const [password, setPassword] = useState("demo123");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const messages: Record<string, string> = {
        google_not_configured: "Google sign-in is not configured on this server.",
        google_cancelled: "Google sign-in was cancelled.",
        google_failed: "Google sign-in failed. Please try again or use the demo login below.",
        google_unverified_email: "Your Google account email is not verified.",
        account_suspended: "Your account has been suspended.",
      };
      setErrorMsg(messages[errorParam] || "Sign-in error occurred. Please try again.");
    }
  }, [searchParams]);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "demo@venture.ai", password: "demo123" }),
      });
      storeAuthResponse(data);
      router.replace("/home");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in with demo account.");
    } finally {
      setDemoLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      storeAuthResponse(data);
      router.replace("/home");
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Merchant Sign-In</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Passwordless & secure authentication for merchants.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1-Click Quick Demo Login Card */}
      <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/70 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-950">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Local Demo Mode</span>
          </div>
          <span className="text-[10px] bg-sky-200 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
            Kirana Store
          </span>
        </div>
        <p className="text-[11px] text-sky-800 leading-snug">
          Instantly access Sharma General Store pre-seeded with 90-day transactions.
        </p>
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={demoLoading}
          className="w-full py-2.5 px-3 bg-[#002E6E] hover:bg-[#003d8f] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-60"
        >
          {demoLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Store className="w-4 h-4 text-[#00BAF2]" />
              <span>1-Click Demo Login (demo@venture.ai)</span>
            </>
          )}
        </button>
      </div>

      {/* Primary Auth Actions */}
      <div className="space-y-2.5">
        <GoogleSignInButton text="Continue with Google" />

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            or email
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <EmailMagicLinkForm buttonText="Continue with Email" />

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            or password
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {!showPasswordForm ? (
          <button
            type="button"
            onClick={() => setShowPasswordForm(true)}
            className="w-full py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign in with Email & Password</span>
          </button>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2 bg-[#00BAF2] hover:bg-[#00a3d4] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition disabled:opacity-60"
            >
              {passwordLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            biometric
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <PasskeyButton
          mode="login"
          text="Sign in with Passkey (for previously registered devices)"
        />
      </div>

      {/* Existing vs New Account */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">New merchant?</span>
        <Link href="/sign-up" className="text-[#00BAF2] font-bold hover:underline">
          Create merchant account
        </Link>
      </div>

      <div className="text-center pt-1">
        <Link
          href="/recover-account"
          className="text-[11px] text-slate-400 hover:text-slate-600 transition"
        >
          Lost access to your device or email?
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <AuthLayout
      heading="Welcome to VentureAI"
      subtitle="Your AI-powered business partner. Understand your business, manage operations and make smarter decisions."
    >
      <Suspense fallback={<div className="text-xs text-slate-400 text-center py-6">Loading sign-in...</div>}>
        <SignInContent />
      </Suspense>
    </AuthLayout>
  );
}
