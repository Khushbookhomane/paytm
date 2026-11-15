"use client";

import React, { useState } from "react";
import { Building, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface BankVerificationFormProps {
  onSuccess?: (account: any) => void;
}

const inputClass =
  "w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00BAF2] focus:ring-2 focus:ring-[#00BAF2]/20 transition font-medium text-slate-800";
const labelClass = "block text-[11px] font-semibold text-slate-600 mb-1";

export default function BankVerificationForm({ onSuccess }: BankVerificationFormProps) {
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountType, setAccountType] = useState("current");
  const [bankName, setBankName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountNumber !== confirmAccount) {
      setError("Account numbers do not match.");
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
      setError("Invalid IFSC format. Expected 11-character code (e.g. HDFC0001234).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: any = await apiRequest("/bank/verify", {
        method: "POST",
        body: JSON.stringify({
          account_holder_name: holderName.trim(),
          account_number: accountNumber.trim(),
          confirm_account_number: confirmAccount.trim(),
          ifsc: ifsc.trim().toUpperCase(),
          account_type: accountType,
          bank_name: bankName.trim() || undefined,
        }),
      });
      setResult(res);
      if (onSuccess) onSuccess(res);
    } catch (err: any) {
      setError(err.message || "Bank account verification failed.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Verification Status: {result.verification_status}</span>
        </div>
        <div className="text-xs text-slate-600 space-y-1">
          <p>Account: <strong className="font-mono">{result.masked_account_number}</strong></p>
          <p>IFSC: <strong className="font-mono">{result.ifsc}</strong></p>
          <p>Name Match: <strong>{result.name_match_status || "Completed"}</strong></p>
        </div>
        <button
          type="button"
          onClick={() => { setResult(null); setAccountNumber(""); setConfirmAccount(""); }}
          className="text-xs text-[#00BAF2] font-semibold hover:underline"
        >
          Verify another bank account
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className={labelClass}>Account Holder Name (as in bank records) *</label>
        <input
          type="text"
          required
          className={inputClass}
          placeholder="e.g. Ramesh Kumar Sharma / Sharma Enterprises"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Bank Account Number *</label>
          <input
            type="password"
            required
            className={inputClass + " font-mono"}
            placeholder="Enter account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Confirm Account Number *</label>
          <input
            type="text"
            required
            className={inputClass + " font-mono"}
            placeholder="Re-enter account number"
            value={confirmAccount}
            onChange={(e) => setConfirmAccount(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>IFSC Code *</label>
          <input
            type="text"
            required
            maxLength={11}
            className={inputClass + " font-mono uppercase"}
            placeholder="e.g. SBIN0001234"
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value.toUpperCase())}
          />
        </div>

        <div>
          <label className={labelClass}>Account Type</label>
          <select
            className={inputClass}
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
          >
            <option value="current">Current Account (Business)</option>
            <option value="savings">Savings Account (Proprietor)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Account numbers are encrypted at rest with AES-256 and never displayed unmasked.
        </span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Verify Bank Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  );
}
