"use client";

import React from "react";
import { Check } from "lucide-react";

export interface OnboardingStep {
  id: string;
  name: string;
  route: string;
}

export const ONBOARDING_FLOW_STEPS: OnboardingStep[] = [
  { id: "ACCOUNT_CREATED", name: "Account Setup", route: "/sign-up" },
  { id: "BUSINESS_PROFILE_COMPLETE", name: "Business Info", route: "/onboarding/business" },
  { id: "BUSINESS_VERIFICATION", name: "Business Verification", route: "/onboarding/verification" },
  { id: "BANK_VERIFICATION", name: "Bank Verification", route: "/onboarding/bank-account" },
  { id: "FINANCIAL_DATA_CONNECTION", name: "Financial Data", route: "/onboarding/bank-consent" },
  { id: "BUSINESS_DATA_SETUP", name: "Integrations", route: "/onboarding/integrations" },
  { id: "PREFERENCES", name: "Preferences", route: "/onboarding/preferences" },
  { id: "MERCHANT_ACTIVE", name: "Completion", route: "/onboarding/complete" },
];

interface OnboardingProgressProps {
  currentStepId: string;
  completedStepIds?: string[];
  onStepClick?: (step: OnboardingStep) => void;
}

export default function OnboardingProgress({
  currentStepId,
  completedStepIds = [],
  onStepClick,
}: OnboardingProgressProps) {
  const currentIndex = ONBOARDING_FLOW_STEPS.findIndex((s) => s.id === currentStepId);

  return (
    <div className="w-full py-4 px-2">
      {/* Horizontal step indicator */}
      <div className="flex items-center justify-between relative overflow-x-auto pb-2 scrollbar-none">
        {ONBOARDING_FLOW_STEPS.map((step, idx) => {
          const isDone = completedStepIds.includes(step.id) || idx < currentIndex;
          const isCurrent = step.id === currentStepId || idx === currentIndex;

          return (
            <div
              key={step.id}
              onClick={() => onStepClick && onStepClick(step)}
              className={`flex flex-col items-center flex-1 min-w-[70px] cursor-pointer group transition`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-[#00BAF2] text-white ring-4 ring-[#00BAF2]/20"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] mt-1.5 text-center font-semibold leading-tight line-clamp-1 ${
                  isCurrent
                    ? "text-[#002E6E] font-bold"
                    : isDone
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
