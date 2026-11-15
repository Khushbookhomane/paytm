"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingStepCard from "@/components/OnboardingStepCard";
import FinancialConsentCard from "@/components/FinancialConsentCard";
import StatementUpload from "@/components/StatementUpload";
import OnboardingProgress from "@/components/OnboardingProgress";
import { ArrowRight, FileText, Shield } from "lucide-react";

export default function BankConsentPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"aa" | "upload">("aa");

  const handleNext = () => {
    router.push("/onboarding/integrations");
  };

  const handleSkip = () => {
    router.push("/onboarding/integrations");
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <OnboardingProgress
          currentStepId="FINANCIAL_DATA_CONNECTION"
          completedStepIds={["ACCOUNT_CREATED", "ORGANIZATION_CREATED", "BUSINESS_VERIFICATION", "BANK_VERIFICATION"]}
        />

        <OnboardingStepCard
          title="Connect Financial Data"
          description="Link your business banking data via RBI-regulated Account Aggregators or upload a recent bank statement."
          onBack={() => router.push("/onboarding/bank-account")}
          onSkip={handleSkip}
          skipLabel="Skip financial connection for now"
          saveProgress={() => router.push("/onboarding")}
        >
          <div className="space-y-5">
            {/* Connection mode toggle */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTab("aa")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  tab === "aa"
                    ? "bg-white text-[#002E6E] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Account Aggregator (Setu / Finvu)</span>
              </button>

              <button
                type="button"
                onClick={() => setTab("upload")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  tab === "upload"
                    ? "bg-white text-[#002E6E] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Upload Statement (CSV / PDF)</span>
              </button>
            </div>

            {tab === "aa" ? (
              <FinancialConsentCard
                onSuccess={() => {}}
                onSkip={handleSkip}
              />
            ) : (
              <StatementUpload
                onSuccess={() => {}}
              />
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
              >
                <span>Continue to Business Integrations</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </OnboardingStepCard>
      </div>
    </div>
  );
}
