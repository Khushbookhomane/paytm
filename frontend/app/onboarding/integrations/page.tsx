"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, authStorage } from "@/lib/api";
import OnboardingProgress from "@/components/OnboardingProgress";
import ProviderConnectionStatus from "@/components/ProviderConnectionStatus";
import StatementUpload from "@/components/StatementUpload";
import {
  Link2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

interface IntegrationItem {
  provider: string;
  is_active: boolean;
  connected_at?: string;
  metadata?: Record<string, any>;
}

export default function IntegrationsOnboardingPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mid, setMid] = useState("");
  const [merchantKey, setMerchantKey] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (!authStorage.getToken()) {
      router.replace("/sign-in");
      return;
    }
    fetchIntegrations();
  }, [router]);

  const fetchIntegrations = async () => {
    setLoading(false);
    try {
      const data = await apiRequest<IntegrationItem[]>("/integrations");
      setIntegrations(data);
    } catch {
      // ignore
    }
  };

  const isPaytmConnected = integrations.some(
    (i) => i.provider.toLowerCase() === "paytm" && i.is_active
  );

  const handleConnectPaytm = async (sandboxQuickConnect = false) => {
    setConnecting(true);
    setError(null);
    try {
      const payload = sandboxQuickConnect
        ? {
            merchant_id: "VENTURE_DEMO_MID_001",
            merchant_key: "TEST_SECRET_KEY_SANDBOX",
            environment: "sandbox",
          }
        : {
            merchant_id: mid || "VENTURE_DEMO_MID_001",
            merchant_key: merchantKey || "TEST_SECRET_KEY_SANDBOX",
            environment,
          };

      await apiRequest("/integrations/paytm/connect", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await fetchIntegrations();
      setShowManualForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to connect Paytm merchant credentials");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectPaytm = async () => {
    setConnecting(true);
    setError(null);
    try {
      await apiRequest("/integrations/paytm", { method: "DELETE" });
      await fetchIntegrations();
    } catch (err: any) {
      setError(err.message || "Failed to disconnect Paytm");
    } finally {
      setConnecting(false);
    }
  };

  const handleProceed = async (skip = false) => {
    try {
      await apiRequest("/onboarding/progress", {
        method: "PATCH",
        body: JSON.stringify({
          current_step: "PREFERENCES",
          completed_steps: skip
            ? ["ACCOUNT_CREATED", "ORGANIZATION_CREATED"]
            : ["ACCOUNT_CREATED", "ORGANIZATION_CREATED", "BUSINESS_DATA_SETUP"],
        }),
      });
    } catch {
      // Continue anyway
    }
    router.push("/onboarding/preferences");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen">
      {/* Top Header */}
      <div
        className="px-6 pt-10 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #002E6E 0%, #003d8f 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="font-black text-2xl tracking-tight">Connect Business Data</h1>
          <p className="text-sky-200 text-xs mt-1">
            Step 6 of 8 · Authorise your Paytm Merchant account or upload statements to sync sales data.
          </p>

          <div className="mt-4 bg-white/10 rounded-2xl p-2 backdrop-blur-sm">
            <OnboardingProgress
              currentStepId="BUSINESS_DATA_SETUP"
              completedStepIds={["ACCOUNT_CREATED", "ORGANIZATION_CREATED"]}
              onStepClick={(step) => step.route && router.push(step.route)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-5 py-6 space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Paytm Merchant Integration Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00BAF2]/10 text-[#002E6E] flex items-center justify-center font-black text-lg">
                P
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Paytm Merchant Integration</h3>
                <p className="text-xs text-slate-500">
                  Sync daily QR, EDC soundbox, and online payments securely
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isPaytmConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isPaytmConnected ? "Connected" : "Not Linked"}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Paytm Partner Adapter</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Transactions are fetched securely via webhook notifications and encrypted API sync. No customer card or credential details are ever stored.
            </p>
          </div>

          {isPaytmConnected ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Paytm Merchant Adapter is active and synchronizing data</span>
              </div>
              <button
                type="button"
                onClick={handleDisconnectPaytm}
                disabled={connecting}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {!showManualForm ? (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleConnectPaytm(true)}
                    disabled={connecting}
                    className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition active:scale-95"
                    style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
                  >
                    {connecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        <span>Connect Paytm Sandbox (1-Click)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowManualForm(true)}
                    className="py-3 px-4 rounded-xl border border-slate-300 hover:border-[#00BAF2] text-slate-700 text-xs font-bold transition active:scale-95"
                  >
                    Enter Live Paytm MID
                  </button>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Custom Paytm Credentials</span>
                    <button
                      type="button"
                      onClick={() => setShowManualForm(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Merchant ID (MID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. YOUR_PAYTM_MID_2026"
                      value={mid}
                      onChange={(e) => setMid(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#00BAF2]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Merchant Key / Secret
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={merchantKey}
                      onChange={(e) => setMerchantKey(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#00BAF2]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Environment
                    </label>
                    <div className="flex gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="env"
                          value="sandbox"
                          checked={environment === "sandbox"}
                          onChange={() => setEnvironment("sandbox")}
                        />
                        <span>Sandbox</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="env"
                          value="production"
                          checked={environment === "production"}
                          onChange={() => setEnvironment("production")}
                        />
                        <span>Production</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConnectPaytm(false)}
                    disabled={connecting}
                    className="w-full py-2.5 rounded-lg text-white font-bold text-xs shadow active:scale-95 transition"
                    style={{ background: "linear-gradient(135deg, #002E6E 0%, #003d8f 100%)" }}
                  >
                    {connecting ? "Connecting..." : "Verify & Connect"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fallback Statement Upload Card */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Alternative / Offline Data Import
            </h4>
          </div>
          <StatementUpload />
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => handleProceed(false)}
            className="flex-1 py-3.5 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
          >
            <span>Save & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleProceed(true)}
            className="py-3.5 px-6 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-600 font-semibold text-xs transition"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
}
