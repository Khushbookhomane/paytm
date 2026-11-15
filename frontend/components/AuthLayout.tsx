"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  heading?: string;
  subtitle?: string;
}

export default function AuthLayout({
  children,
  heading = "Welcome to VentureAI",
  subtitle = "Your AI-powered business partner. Understand your business, manage operations and make smarter decisions.",
}: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #002E6E 0%, #003d8f 45%, #042B62 100%)" }}
    >
      {/* Header Branding */}
      <div className="flex flex-col items-center pt-10 pb-6 px-6 text-center max-w-md mx-auto">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-xl"
          style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
        >
          <span className="text-white font-black text-3xl leading-none">P</span>
        </div>
        <h1 className="text-white font-black text-2xl tracking-tight">{heading}</h1>
        <p className="text-[#00BAF2] text-[11px] font-bold uppercase tracking-[0.2em] mt-0.5">
          by Paytm · for business
        </p>
        <p className="text-sky-200 text-xs mt-2 leading-relaxed max-w-sm">
          {subtitle}
        </p>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md mx-auto flex-1 bg-white rounded-t-3xl px-6 pt-6 pb-8 shadow-2xl flex flex-col justify-between">
        <div>{children}</div>

        {/* Footer legal & security */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Link href="/terms" className="hover:underline hover:text-slate-600 transition">
              Terms & Conditions
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:underline hover:text-slate-600 transition">
              Privacy Policy
            </Link>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Bank-grade 256-bit encryption · Official Paytm VentureAI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
