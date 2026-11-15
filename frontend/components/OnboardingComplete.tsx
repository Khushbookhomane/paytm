"use client";

import React from "react";
import { CheckCircle, ArrowRight, Sparkles, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

interface OnboardingCompleteProps {
  businessName?: string;
  onGoToDashboard?: () => void;
}

export default function OnboardingComplete({
  businessName = "Your Business",
  onGoToDashboard,
}: OnboardingCompleteProps) {
  const router = useRouter();

  const handleDashboard = () => {
    if (onGoToDashboard) onGoToDashboard();
    else router.push("/dashboard");
  };

  return (
    <div className="text-center py-8 px-4 space-y-6 max-w-md mx-auto">
      {/* Animated badge */}
      <div className="relative inline-block">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#00BAF2] flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome to Paytm VentureAI!
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
          Onboarding for <strong>{businessName}</strong> is complete. Your AI Copilot, live analytics, and sales intelligence are now activated.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5">
        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          Activated Platform Features:
        </p>
        <ul className="text-xs text-slate-600 space-y-1.5">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>AI Business Copilot in English, Hindi & Marathi</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Real-time Sales & Inventory Forecasting</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Bank Account Ownership & Financial Ledger</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Customer Behaviour & Automated Marketing Campaigns</span>
          </li>
        </ul>
      </div>

      <button
        onClick={handleDashboard}
        className="w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #002E6E 0%, #00BAF2 100%)" }}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Open Merchant Dashboard</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
