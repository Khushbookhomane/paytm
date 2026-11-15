"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, ShieldAlert, ArrowRight, FileCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface BusinessVerificationCardProps {
  onVerificationComplete?: (result: any) => void;
  defaultType?: "gstin" | "pan" | "cin" | "document";
}

export default function BusinessVerificationCard({
  onVerificationComplete,
  defaultType = "gstin",
}: BusinessVerificationCardProps) {
  const [method, setMethod] = useState<"gstin" | "pan" | "cin" | "document">(defaultType);
  const [inputValue, setInputValue] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("NOT_STARTED");
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) {
      setError("Please grant consent for business verification.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload: any = { verification_type: method };
    if (method === "gstin") payload.gstin = inputValue.trim().toUpperCase();
    if (method === "pan") payload.pan = inputValue.trim().toUpperCase();
    if (method === "cin") payload.cin = inputValue.trim().toUpperCase();
    if (method === "document") {
      payload.document_type = "trade_license";
      payload.document_reference = inputValue.trim() || "DOC_LICENSE_REF";
    }

    try {
      const res: any = await apiRequest("/business/verify", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStatus(res.status);
      setResultData(res);
      if (onVerificationComplete) onVerificationComplete(res);
    } catch (err: any) {
      setError(err.message || "Business verification failed.");
      setStatus("FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      {/* Method Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
        {(["gstin", "pan", "cin", "document"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMethod(m);
              setInputValue("");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition capitalize ${
              method === m
                ? "bg-white text-[#002E6E] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {m === "gstin" ? "GSTIN" : m === "pan" ? "PAN" : m === "cin" ? "CIN" : "Document"}
          </button>
        ))}
      </div>

      {/* Form */}
      {status === "NOT_STARTED" || status === "FAILED" ? (
        <form onSubmit={handleVerify} className="space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {method === "gstin"
                ? "Goods & Services Tax Identifier (GSTIN)"
                : method === "pan"
                ? "Permanent Account Number (PAN)"
                : method === "cin"
                ? "Corporate Identity Number (CIN)"
                : "Business Trade License / Udyam Number"}
            </label>
            <input
              type="text"
              required
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              placeholder={
                method === "gstin"
                  ? "27AAPFU0939F1ZV"
                  : method === "pan"
                  ? "ABCDE1234F"
                  : method === "cin"
                  ? "U12345MH2020PTC123456"
                  : "e.g. UDYAM-MH-01-0012345"
              }
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00BAF2] focus:ring-2 focus:ring-[#00BAF2]/20 uppercase font-mono"
            />
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <input
              type="checkbox"
              id="kyb-consent"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded text-[#00BAF2] focus:ring-[#00BAF2]"
            />
            <label htmlFor="kyb-consent" className="text-[11px] text-slate-600 leading-tight">
              I authorize Paytm VentureAI to verify my business registration with authorized government
              and partner registries in compliance with applicable laws.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Verify Business Identity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* Status Result Banner */
        <div className="space-y-3">
          <div
            className={`p-4 rounded-xl flex items-start gap-3 border ${
              status === "VERIFIED"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : status === "REQUIRES_REVIEW"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-sky-50 border-sky-200 text-sky-800"
            }`}
          >
            {status === "VERIFIED" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            ) : status === "REQUIRES_REVIEW" ? (
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 shrink-0 text-sky-600 mt-0.5" />
            )}

            <div className="space-y-1">
              <h4 className="font-bold text-xs">
                {status === "VERIFIED"
                  ? "Business Verified"
                  : status === "REQUIRES_REVIEW"
                  ? "Under Compliance Review"
                  : "Verification Initiated (Pending)"}
              </h4>
              <p className="text-[11px] leading-relaxed opacity-90">
                {status === "VERIFIED"
                  ? "Your business legal identity has been successfully verified."
                  : status === "REQUIRES_REVIEW"
                  ? "Your submission has been queued for manual review. You may continue onboarding without blocking."
                  : "We have initiated verification with the provider registry."}
              </p>
              {resultData?.provider_reference && (
                <p className="text-[10px] opacity-75 font-mono">
                  Ref: {resultData.provider_reference}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStatus("NOT_STARTED")}
            className="text-xs text-[#00BAF2] font-semibold hover:underline"
          >
            Submit another verification identifier
          </button>
        </div>
      )}
    </div>
  );
}
