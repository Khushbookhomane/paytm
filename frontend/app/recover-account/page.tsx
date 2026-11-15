"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import EmailMagicLinkForm from "@/components/EmailMagicLinkForm";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { ShieldCheck, LifeBuoy } from "lucide-react";

export default function RecoverAccountPage() {
  return (
    <AuthLayout
      heading="Account Recovery"
      subtitle="Restore access to your merchant account securely without SMS OTP or passwords."
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Recover Your Account</h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Choose your recovery method below. A single-use secure link will be issued to your verified email.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <EmailMagicLinkForm buttonText="Send Recovery Link" />

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <GoogleSignInButton text="Recover with Verified Google Account" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
          <LifeBuoy className="w-4 h-4 text-[#00BAF2] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Need enterprise assistance? Contact Paytm VentureAI Merchant Support at{" "}
            <span className="font-semibold text-slate-800">merchant-support@ventureai.in</span>.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 text-center">
          <Link href="/sign-in" className="text-xs text-[#00BAF2] font-bold hover:underline">
            Return to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
