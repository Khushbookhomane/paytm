"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, authStorage } from "@/lib/api";
import { ArrowRight, AlertCircle, CheckCircle2, Landmark, Info } from "lucide-react";

const inputClass =
  "w-full px-3 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00BAF2] focus:ring-2 focus:ring-[#00BAF2]/20 transition font-medium";

interface VerificationResult {
  verification_status: string;
  masked_account_number: string;
  name_match_status: string | null;
  failure_reason: string | null;
}

export default function BankAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    account_holder_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc: "",
    account_type: "current",
    bank_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!authStorage.getToken()) router.replace("/sign-in");
  }, [router]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.account_number !== form.confirm_account_number) {
      setError("Account numbers do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<VerificationResult>("/bank/verify", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setResult(data);
      // Update onboarding progress
      await apiRequest("/onboarding/progress", {
        method: "PATCH",
        body: JSON.stringify({ current_step: "BANK_VERIFICATION" }),
      });
    } catch (err: any) {
      setError(err.message || "Bank verification failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const statusColor = {
    VERIFIED: "emerald",
    FAILED: "red",
    PENDING: "amber",
    REQUIRES_REVIEW: "amber",
  }[result?.verification_status || ""] || "slate";

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9]">
      <div
        className="px-5 pt-8 pb-5"
        style={{ background: "linear-gradient(135deg, #002E6E 0%, #003d8f 100%)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Landmark className="w-5 h-5 text-[#00BAF2]" />
          <h1 className="text-white font-black text-lg">Verify Business Bank Account</h1>
        </div>
        <p className="text-sky-300 text-xs">
          Connect and verify your business bank account to improve financial insights.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#E8F8FE] border border-[#00BAF2]/20">
          <Info className="w-4 h-4 text-[#00BAF2] shrink-0 mt-0.5" />
          <p className="text-xs text-[#002E6E] font-medium leading-relaxed">
            We verify your bank account ownership using a secure third-party service. We never store your full account number or access your banking credentials.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className={`p-5 rounded-2xl border bg-${statusColor}-50 border-${statusColor}-200 text-center space-y-3`}>
            {result.verification_status === "VERIFIED" ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            ) : (
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            )}
            <p className="font-bold text-slate-900">
              {result.verification_status === "VERIFIED"
                ? "Bank Account Verified"
                : result.verification_status === "PENDING"
                ? "Verification Pending"
                : "Verification Requires Review"}
            </p>
            <p className="text-xs text-slate-600">
              Account: <strong>{result.masked_account_number}</strong>
            </p>
            {result.failure_reason && (
              <p className="text-xs text-red-600">{result.failure_reason}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => router.push("/onboarding/bank-consent")}
                className="flex-1 py-3 text-white font-bold text-sm rounded-xl"
                style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
              >
                Continue to Financial Connection
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Account Details</p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.account_holder_name}
                  onChange={(e) => set("account_holder_name", e.target.value)}
                  required
                  className={inputClass}
                  placeholder="As per bank records"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Bank Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.account_number}
                  onChange={(e) => set("account_number", e.target.value.replace(/\D/g, ""))}
                  required
                  className={inputClass}
                  placeholder="Enter account number"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Confirm Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.confirm_account_number}
                  onChange={(e) => set("confirm_account_number", e.target.value.replace(/\D/g, ""))}
                  required
                  className={inputClass}
                  placeholder="Re-enter account number"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.ifsc}
                  onChange={(e) => set("ifsc", e.target.value.toUpperCase())}
                  required
                  className={inputClass}
                  placeholder="SBIN0001234"
                  maxLength={11}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Account Type</label>
                  <select value={form.account_type} onChange={(e) => set("account_type", e.target.value)} className={inputClass}>
                    <option value="current">Current</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bank Name</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => set("bank_name", e.target.value)}
                    className={inputClass}
                    placeholder="SBI, HDFC…"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><span>Verify Bank Account</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/onboarding/bank-consent")}
              className="w-full py-3 text-slate-500 font-semibold text-sm rounded-xl border border-slate-200 bg-white"
            >
              Skip for now
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
