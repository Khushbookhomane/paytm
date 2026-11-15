"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface EmailMagicLinkFormProps {
  buttonText?: string;
  onSuccess?: (email: string) => void;
}

const inputClass =
  "w-full px-3 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00BAF2] focus:ring-2 focus:ring-[#00BAF2]/20 transition font-medium pl-10";

export default function EmailMagicLinkForm({
  buttonText = "Continue with Email",
  onSuccess,
}: EmailMagicLinkFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data: any = await apiRequest("/auth/magic-link/request", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Console mode: backend returns token directly — build verify URL from current origin
      if (data?.token) {
        router.push(`/auth/verify?token=${data.token}`);
        return;
      }
      if (data?.verify_url) {
        router.push(data.verify_url);
        return;
      }
      setSent(true);
      if (onSuccess) onSuccess(email.trim());
    } catch (err: any) {
      setError(err.message || "Failed to send magic link. Please check the email and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-6 space-y-3 bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">Sign-in Link Sent</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          We sent a passwordless magic sign-in link to <strong>{email}</strong>.
          Open the link on this device to continue.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setError(null);
          }}
          className="text-xs text-[#00BAF2] font-semibold hover:underline"
        >
          Use a different email address
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Business Email Address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
            placeholder="you@yourbusiness.com"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
