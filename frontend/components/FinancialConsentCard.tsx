"use client";

import React, { useState } from "react";
import { Shield, ArrowRight, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface FinancialConsentCardProps {
  onSuccess?: (consent: any) => void;
  onSkip?: () => void;
}

export default function FinancialConsentCard({ onSuccess, onSkip }: FinancialConsentCardProps) {
  const [provider, setProvider] = useState<"setu" | "finvu">("setu");
  const [days, setDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [consentResult, setConsentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await apiRequest("/bank/connections", {
        method: "POST",
        body: JSON.stringify({
          provider,
          purpose: "Automated cashflow analytics, revenue reconciliation, and credit eligibility for Paytm VentureAI",
          data_range_days: days,
        }),
      });
      setConsentResult(res);
      if (onSuccess) onSuccess(res);
    } catch (err: any) {
      setError(err.message || "Failed to initiate consent request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00BAF2]/10 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-[#00BAF2]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Connect via RBI-Regulated Account Aggregator
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Securely grant read-only access to transaction history directly from your bank.
            You can revoke access at any time.
          </p>
        </div>
      </div>

      {/* Purpose & terms summary */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">Requested Data Types & Purpose:</p>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
          <li>Account summary and 365-day transaction statement</li>
          <li>Used exclusively for cash flow forecasting and business intelligence</li>
          <li>No withdrawal, debit, or funds movement permissions</li>
        </ul>
      </div>

      {/* Provider Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setProvider("setu")}
          className={`p-3 rounded-xl border text-left transition ${
            provider === "setu"
              ? "border-[#00BAF2] bg-sky-50/50 ring-2 ring-[#00BAF2]/20"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="text-xs font-bold text-slate-900">Setu AA (Pine Labs)</p>
          <p className="text-[10px] text-slate-500 mt-0.5">RBI Regulated NBFC-AA</p>
        </button>

        <button
          type="button"
          onClick={() => setProvider("finvu")}
          className={`p-3 rounded-xl border text-left transition ${
            provider === "finvu"
              ? "border-[#00BAF2] bg-sky-50/50 ring-2 ring-[#00BAF2]/20"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="text-xs font-bold text-slate-900">Finvu (Cookiejar)</p>
          <p className="text-[10px] text-slate-500 mt-0.5">RBI Regulated NBFC-AA</p>
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          {error}
        </p>
      )}

      {consentResult ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-800">
          <p className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Consent Initiated ({consentResult.status})
          </p>
          <p className="text-[11px] text-emerald-700">
            Provider Reference: <span className="font-mono">{consentResult.consent_reference}</span>
          </p>
          {consentResult.redirect_url && (
            <a
              href={consentResult.redirect_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#002E6E] font-bold hover:underline mt-1"
            >
              Open Provider Consent Approval Flow <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="flex-1 py-3 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Connect via {provider.toUpperCase()}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-3 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
            >
              Skip
            </button>
          )}
        </div>
      )}
    </div>
  );
}
