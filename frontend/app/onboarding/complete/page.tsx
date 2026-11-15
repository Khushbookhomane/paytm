"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, authStorage } from "@/lib/api";
import { CheckCircle2, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!authStorage.getToken()) router.replace("/sign-in");
  }, [router]);

  const handleActivate = async () => {
    setLoading(true);
    try {
      await apiRequest("/onboarding/complete", { method: "POST" });
      setDone(true);
      setTimeout(() => router.replace("/home"), 1500);
    } catch {
      // Even if it fails, redirect to home — merchant can complete later
      router.replace("/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #002E6E 0%, #003d8f 50%, #042B62 100%)" }}
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl space-y-5">
        {done ? (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="font-black text-slate-900 text-xl">You're all set!</h2>
            <p className="text-xs text-slate-500">Redirecting to your dashboard…</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-black text-slate-900 text-xl">Ready to launch!</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your VentureAI merchant account is set up. Activate your dashboard to start monitoring your business.
            </p>
            <div className="space-y-2 text-left">
              {[
                "AI-powered sales insights",
                "Inventory & stock management",
                "Customer intelligence",
                "Finance & profitability reports",
                "AI Copilot for business advice",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><span>Activate Dashboard</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
