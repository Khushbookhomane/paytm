"use client";

import React from "react";
import { CheckCircle2, Clock, AlertCircle, Unplug } from "lucide-react";

interface ProviderConnectionStatusProps {
  providerName: string;
  status: "connected" | "pending" | "unavailable" | "disconnected" | string;
  description?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  loading?: boolean;
}

export default function ProviderConnectionStatus({
  providerName,
  status,
  description,
  onConnect,
  onDisconnect,
  loading = false,
}: ProviderConnectionStatusProps) {
  const isConnected = status === "connected";
  const isPending = status === "pending";
  const isUnavailable = status === "unavailable";

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-slate-900">{providerName}</h4>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isConnected
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : isPending
                ? "bg-sky-50 text-sky-700 border border-sky-200"
                : isUnavailable
                ? "bg-slate-100 text-slate-500 border border-slate-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ) : isPending ? (
              <Clock className="w-3 h-3 text-sky-600" />
            ) : (
              <AlertCircle className="w-3 h-3 text-slate-400" />
            )}
            {status.toUpperCase()}
          </span>
        </div>
        {description && <p className="text-[11px] text-slate-500 leading-tight">{description}</p>}
      </div>

      <div>
        {isConnected && onDisconnect ? (
          <button
            type="button"
            onClick={onDisconnect}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition"
          >
            Disconnect
          </button>
        ) : onConnect && !isUnavailable ? (
          <button
            type="button"
            onClick={onConnect}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-[#00BAF2] text-white hover:bg-[#00a3d4] text-xs font-semibold transition shadow-sm"
          >
            Connect
          </button>
        ) : null}
      </div>
    </div>
  );
}
