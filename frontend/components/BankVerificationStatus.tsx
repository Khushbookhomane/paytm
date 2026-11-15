"use client";

import React from "react";
import { CheckCircle2, Clock, AlertTriangle, Building2 } from "lucide-react";

interface BankAccountItem {
  id: number;
  masked_account_number: string;
  ifsc: string;
  bank_name?: string;
  account_type?: string;
  verification_status: string;
  name_match_status?: string;
}

interface BankVerificationStatusProps {
  accounts: BankAccountItem[];
}

export default function BankVerificationStatus({ accounts }: BankVerificationStatusProps) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
        No bank accounts connected yet.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {accounts.map((acc) => {
        const isVerified = acc.verification_status === "VERIFIED";
        const isReview = acc.verification_status === "REQUIRES_REVIEW";

        return (
          <div
            key={acc.id}
            className="p-3.5 rounded-xl border border-slate-200/90 bg-white flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isVerified
                    ? "bg-emerald-50 text-emerald-600"
                    : isReview
                    ? "bg-amber-50 text-amber-600"
                    : "bg-sky-50 text-sky-600"
                }`}
              >
                <Building2 className="w-4 h-4" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800">
                  {acc.bank_name || "Business Bank Account"}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {acc.masked_account_number} · {acc.ifsc}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  isVerified
                    ? "bg-emerald-100 text-emerald-800"
                    : isReview
                    ? "bg-amber-100 text-amber-800"
                    : "bg-sky-100 text-sky-800"
                }`}
              >
                {isVerified ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : isReview ? (
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                ) : (
                  <Clock className="w-3 h-3 text-sky-600" />
                )}
                {acc.verification_status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
