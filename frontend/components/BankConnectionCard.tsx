"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, XCircle, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface BankConnectionCardProps {
  connection: {
    id: number;
    provider: string;
    consent_reference: string;
    purpose?: string;
    data_range?: string;
    status: string;
    expires_at?: string;
    revoked_at?: string;
  };
  onRevoked?: () => void;
}

export default function BankConnectionCard({ connection, onRevoked }: BankConnectionCardProps) {
  const [loading, setLoading] = useState(false);
  const [revoked, setRevoked] = useState(connection.status === "CONSENT_REVOKED");

  const handleRevoke = async () => {
    if (!confirm("Are you sure you want to revoke data sharing consent for this connection?")) return;
    setLoading(true);
    try {
      await apiRequest(`/bank/consents/${connection.id}/revoke`, { method: "POST" });
      setRevoked(true);
      if (onRevoked) onRevoked();
    } catch (err: any) {
      alert(err.message || "Failed to revoke consent.");
    } finally {
      setLoading(false);
    }
  };

  const isConnected = connection.status === "CONNECTED" || connection.status === "CONSENT_APPROVED";

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              revoked
                ? "bg-slate-100 text-slate-400"
                : isConnected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isConnected ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 capitalize">
              {connection.provider} Account Aggregator
            </h4>
            <p className="text-[10px] text-slate-500 font-mono">
              Ref: {connection.consent_reference || "N/A"}
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            revoked
              ? "bg-slate-100 text-slate-500"
              : isConnected
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {revoked ? "REVOKED" : connection.status}
        </span>
      </div>

      <div className="text-[11px] text-slate-500 space-y-0.5">
        <p>Purpose: {connection.purpose || "Financial Insights"}</p>
        <p>Data Range: {connection.data_range || "365 Days"}</p>
        {connection.expires_at && (
          <p>Expires: {new Date(connection.expires_at).toLocaleDateString()}</p>
        )}
      </div>

      {!revoked && (
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={handleRevoke}
            disabled={loading}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Revoke Access</span>
          </button>
        </div>
      )}
    </div>
  );
}
