"use client";

import React from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface OnboardingStepCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  saveProgress?: () => void;
}

export default function OnboardingStepCard({
  title,
  description,
  children,
  onBack,
  onSkip,
  skipLabel = "Skip for now",
  saveProgress,
}: OnboardingStepCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Step Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        </div>
        {saveProgress && (
          <button
            type="button"
            onClick={saveProgress}
            className="text-xs text-slate-400 hover:text-slate-600 transition whitespace-nowrap font-medium px-2 py-1 rounded-md hover:bg-slate-50"
          >
            Save progress
          </button>
        )}
      </div>

      {/* Main Body */}
      <div>{children}</div>

      {/* Footer Nav Controls */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium transition"
          >
            {skipLabel}
          </button>
        )}
      </div>
    </div>
  );
}
