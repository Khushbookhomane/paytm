"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, authStorage } from "@/lib/api";
import {
  CheckCircle2, Circle, ArrowRight, Building2, ShieldCheck,
  Landmark, Sparkles, Loader2, Link2, Sliders,
} from "lucide-react";
import OnboardingProgress, { ONBOARDING_FLOW_STEPS } from "@/components/OnboardingProgress";

interface OnboardingStatus {
  current_step: string;
  completed_steps: string[];
  organization_id: number | null;
  org_status?: string;
}

const STEPS = [
  { key: "ACCOUNT_CREATED", label: "Account Setup", icon: CheckCircle2, route: null },
  { key: "ORGANIZATION_CREATED", label: "Business Information", icon: Building2, route: "/onboarding/business" },
  { key: "BUSINESS_VERIFICATION", label: "Business Verification", icon: ShieldCheck, route: "/onboarding/verification", optional: true },
  { key: "BANK_VERIFICATION", label: "Bank Account Verification", icon: Landmark, route: "/onboarding/bank-account", optional: true },
  { key: "FINANCIAL_DATA_CONNECTION", label: "Financial Data Connection", icon: Landmark, route: "/onboarding/bank-consent", optional: true },
  { key: "BUSINESS_DATA_SETUP", label: "Paytm & Business Integrations", icon: Link2, route: "/onboarding/integrations", optional: true },
  { key: "PREFERENCES", label: "Preferences & Language", icon: Sliders, route: "/onboarding/preferences", optional: true },
  { key: "MERCHANT_ACTIVE", label: "Complete Activation", icon: Sparkles, route: "/onboarding/complete" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authStorage.getToken()) { router.replace("/sign-in"); return; }
    apiRequest<OnboardingStatus>("/onboarding/status")
      .then((data) => {
        setStatus(data);
        if (data.org_status === "active") router.replace("/dashboard");
      })
      .catch(() => router.replace("/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  const isComplete = (key: string) => status?.completed_steps?.includes(key) ?? false;
  const isCurrent = (key: string) => status?.current_step === key;

  const handleContinue = () => {
    if (!status?.organization_id) { router.push("/onboarding/business"); return; }
    const nextIncomplete = STEPS.find(
      (s) => s.route && !isComplete(s.key) && s.key !== "MERCHANT_ACTIVE"
    );
    if (nextIncomplete?.route) router.push(nextIncomplete.route);
    else router.push("/onboarding/complete");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F4F6F9]">
        <Loader2 className="w-8 h-8 text-[#00BAF2] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen">
      <div
        className="px-6 pt-10 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #002E6E 0%, #003d8f 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="font-black text-2xl tracking-tight">Onboard Your Merchant Business</h1>
          <p className="text-sky-200 text-xs mt-1">
            Complete the verification and setup steps to activate your VentureAI business dashboard.
          </p>

          <div className="mt-4 bg-white/10 rounded-2xl p-2 backdrop-blur-sm">
            <OnboardingProgress
              currentStepId={status?.current_step || "ORGANIZATION_CREATED"}
              completedStepIds={status?.completed_steps || []}
              onStepClick={(step) => {
                const matched = STEPS.find((s) => s.key === step.id || s.route === step.route);
                if (matched?.route) router.push(matched.route);
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-5 py-6 space-y-3">
        {STEPS.map((step, idx) => {
          const done = isComplete(step.key);
          const current = isCurrent(step.key);
          const Icon = step.icon;
          return (
            <button
              key={step.key}
              onClick={() => step.route && router.push(step.route)}
              disabled={!step.route}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition shadow-sm ${
                done
                  ? "bg-emerald-50/70 border-emerald-200"
                  : current
                  ? "bg-white border-[#00BAF2] ring-2 ring-[#00BAF2]/15"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    done ? "bg-emerald-100" : current ? "bg-[#E8F8FE]" : "bg-slate-100"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Icon className={`w-5 h-5 ${current ? "text-[#00BAF2]" : "text-slate-400"}`} />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-bold ${done ? "text-emerald-900" : "text-slate-900"}`}>
                      {step.label}
                    </p>
                    {step.optional && !done && (
                      <span className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {done
                      ? "Completed"
                      : current
                      ? "Ready to complete"
                      : step.optional
                      ? "Can be completed now or skipped"
                      : "Pending"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}

        <div className="pt-4">
          <button
            onClick={handleContinue}
            className="w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
          >
            <span>Continue Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
