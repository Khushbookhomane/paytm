"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingStepCard from "@/components/OnboardingStepCard";
import BusinessVerificationCard from "@/components/BusinessVerificationCard";
import OnboardingProgress from "@/components/OnboardingProgress";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function BusinessVerificationPage() {
  const router = useRouter();
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleNext = () => {
    router.push("/onboarding/bank-account");
  };

  const handleSkip = () => {
    router.push("/onboarding/bank-account");
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <OnboardingProgress
          currentStepId="BUSINESS_VERIFICATION"
          completedStepIds={["ACCOUNT_CREATED", "ORGANIZATION_CREATED"]}
        />

        <OnboardingStepCard
          title="Verify Your Business Identity (KYB)"
          description="Provide official business credentials (GSTIN, PAN, CIN, or Trade License) to verify entity identity."
          onBack={() => router.push("/onboarding/business")}
          onSkip={handleSkip}
          skipLabel="Skip verification for now"
          saveProgress={() => router.push("/onboarding")}
        >
          <div className="space-y-6">
            <BusinessVerificationCard
              onVerificationComplete={(res) => setVerificationResult(res)}
            />

            <div className="pt-2">
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
              >
                <span>Continue to Bank Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </OnboardingStepCard>
      </div>
    </div>
  );
}
