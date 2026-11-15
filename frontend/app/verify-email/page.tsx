"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002E6E] to-[#042B62] px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-[#00BAF2]" />
        </div>
        <h2 className="font-black text-slate-900 text-xl mb-2">Check your email</h2>
        <p className="text-sm text-slate-600 mb-1">
          We sent a sign-in link to:
        </p>
        <p className="font-bold text-slate-900 text-sm mb-4">{email}</p>
        <p className="text-xs text-slate-500 mb-6">
          Click the link in the email to sign in. It expires in 10 minutes.
        </p>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4">
          <strong>Demo mode:</strong> Check the Render backend logs for the magic link URL.
          Go to Render → your service → Logs and look for <code>[EMAIL:console] Link:</code>
        </div>
        <Link
          href="/sign-in"
          className="block w-full py-3 text-white font-bold text-sm rounded-xl text-center"
          style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#002E6E] text-white">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
