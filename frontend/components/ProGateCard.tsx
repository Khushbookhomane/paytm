"use client";

import React, { useState } from "react";
import { Lock, Sparkles, CheckCircle2, Zap } from "lucide-react";
import { apiRequest, authStorage, Merchant } from "@/lib/api";

interface ProGateCardProps {
  featureTitle: string;
  featureDesc: string;
  benefits?: string[];
  onUnlocked?: () => void;
  lang?: "en" | "hi" | "mr";
}

export default function ProGateCard({
  featureTitle,
  featureDesc,
  benefits = [
    "Machine Learning 7-day demand forecasting",
    "RFM customer churn detection & win-back campaigns",
    "Multilingual vernacular voice & WhatsApp marketing"
  ],
  onUnlocked,
  lang = "hi"
}: ProGateCardProps) {
  const [loading, setLoading] = useState(false);

  const handleInstantUpgrade = async () => {
    setLoading(true);
    try {
      const updated = await apiRequest<Merchant>("/auth/toggle-plan", { method: "POST" });
      authStorage.setMerchant(updated);
      if (onUnlocked) {
        onUnlocked();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      alert("Failed to upgrade plan: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const isHindi = lang === "hi";
  const isMarathi = lang === "mr";

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/40 p-6 text-center shadow-sm">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-3">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        Paytm VentureAI Pro
      </div>

      <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3 text-amber-700">
        <Lock className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-1">
        {featureTitle}
      </h3>
      <p className="text-sm text-slate-600 max-w-sm mx-auto mb-4">
        {featureDesc}
      </p>

      {benefits && benefits.length > 0 && (
        <div className="text-left bg-white/80 rounded-xl p-3 border border-amber-100 max-w-xs mx-auto mb-4 space-y-2">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleInstantUpgrade}
        disabled={loading}
        className="w-full max-w-xs mx-auto py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-md hover:from-amber-600 hover:to-amber-700 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75"
      >
        <Zap className="w-4 h-4 text-amber-100 fill-amber-100" />
        {loading
          ? (isHindi ? "प्लान अपग्रेड हो रहा है..." : isMarathi ? "अपग्रेड करत आहे..." : "Upgrading to Pro...")
          : (isHindi ? "प्रो में अपग्रेड करें (1-क्लिक डेमो)" : isMarathi ? "प्रो मध्ये अपग्रेड करा (डेमो)" : "Upgrade to Pro (Instant Demo)")}
      </button>

      <p className="text-[11px] text-slate-400 mt-2">
        {isHindi
          ? "डेमो मोड: बिना किसी भुगतान के तुरंत अनलॉक करें"
          : isMarathi
          ? "डेमो मोड: विनामूल्य त्वरित अनलॉक करा"
          : "Demo mode: Free instant switch. State persists on refresh."}
      </p>
    </div>
  );
}
