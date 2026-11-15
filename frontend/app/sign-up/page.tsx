"use client";

import React from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import EmailMagicLinkForm from "@/components/EmailMagicLinkForm";

export default function SignUpPage() {
  return (
    <AuthLayout
      heading="Welcome to VentureAI"
      subtitle="Your AI-powered business partner. Understand your business, manage operations and make smarter decisions."
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Create Merchant Account</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Get started with AI-driven inventory, sales intelligence & Copilot.
          </p>
        </div>

        {/* Primary Auth Actions */}
        <div className="space-y-2.5">
          <GoogleSignInButton text="Sign up with Google" />

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              or email
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <EmailMagicLinkForm buttonText="Register with Email Link" />
        </div>

        {/* Existing account link */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Already have an account?</span>
          <Link href="/sign-in" className="text-[#00BAF2] font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
