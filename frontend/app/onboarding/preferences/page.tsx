"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, authStorage } from "@/lib/api";
import OnboardingProgress from "@/components/OnboardingProgress";
import PasskeyButton from "@/components/PasskeyButton";
import {
  Sliders,
  Globe,
  Bell,
  Fingerprint,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function PreferencesOnboardingPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<string>("en");
  const [currency, setCurrency] = useState<string>("INR");
  const [notifyDailySummary, setNotifyDailySummary] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyChurnAlerts, setNotifyChurnAlerts] = useState(true);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authStorage.getToken()) {
      router.replace("/sign-in");
      return;
    }
    const savedLang = authStorage.getLanguage();
    if (savedLang) setLanguage(savedLang);
  }, [router]);

  const handleSaveAndContinue = async () => {
    setSaving(true);
    setError(null);
    try {
      // 1. Save preferences to current organization
      await apiRequest("/organizations/current", {
        method: "PATCH",
        body: JSON.stringify({
          language,
        }),
      });

      // 2. Update local language storage
      authStorage.setLanguage(language as any);

      // 3. Update onboarding progress
      await apiRequest("/onboarding/progress", {
        method: "PATCH",
        body: JSON.stringify({
          current_step: "MERCHANT_ACTIVE",
          completed_steps: [
            "ACCOUNT_CREATED",
            "ORGANIZATION_CREATED",
            "PREFERENCES",
          ],
        }),
      });

      router.push("/onboarding/complete");
    } catch (err: any) {
      setError(err.message || "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen">
      {/* Top Header */}
      <div
        className="px-6 pt-10 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #002E6E 0%, #003d8f 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="font-black text-2xl tracking-tight">Preferences & Security</h1>
          <p className="text-sky-200 text-xs mt-1">
            Step 7 of 8 · Customise your language, notifications, and biometric passkey login.
          </p>

          <div className="mt-4 bg-white/10 rounded-2xl p-2 backdrop-blur-sm">
            <OnboardingProgress
              currentStepId="PREFERENCES"
              completedStepIds={["ACCOUNT_CREATED", "ORGANIZATION_CREATED"]}
              onStepClick={(step) => step.route && router.push(step.route)}
            />
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-5 py-6 space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Language & Regional Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#002E6E] flex items-center justify-center">
              <Globe className="w-4 h-4 text-[#00BAF2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Language & Currency</h3>
              <p className="text-xs text-slate-500">Configure dashboard display and currency format</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Preferred Display Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00BAF2] bg-white"
              >
                <option value="en">English (Default)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Business Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00BAF2] bg-white"
              >
                <option value="INR">₹ INR - Indian Rupee</option>
              </select>
            </div>
          </div>
        </div>

        {/* Business Notification Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Smart Alert Preferences</h3>
              <p className="text-xs text-slate-500">Receive actionable AI alerts on your business performance</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Daily Morning Sales Brief</span>
                <span className="text-[11px] text-slate-500">
                  AI summary of yesterday's sales and estimated profit at 8:00 AM
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyDailySummary}
                onChange={(e) => setNotifyDailySummary(e.target.checked)}
                className="w-4 h-4 text-[#00BAF2] rounded focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Low Stock & Restock Warnings</span>
                <span className="text-[11px] text-slate-500">
                  Get notified when key products drop below 2-day demand threshold
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyLowStock}
                onChange={(e) => setNotifyLowStock(e.target.checked)}
                className="w-4 h-4 text-[#00BAF2] rounded focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Customer Churn Risk Signals</span>
                <span className="text-[11px] text-slate-500">
                  Suggestions to win back high-value customers who haven't visited in 30+ days
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyChurnAlerts}
                onChange={(e) => setNotifyChurnAlerts(e.target.checked)}
                className="w-4 h-4 text-[#00BAF2] rounded focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Passkey Setup (Optional) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Passkey / Biometric Setup (Optional)</h3>
                <p className="text-xs text-slate-500">
                  Log in instantly with Touch ID, Face ID, or Windows Hello
                </p>
              </div>
            </div>

            {passkeyRegistered && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Passkey Added</span>
              </span>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed">
            Register this device to sign in seamlessly without waiting for email magic links. Your biometrics never leave your device.
          </div>

          <div className="pt-1">
            <PasskeyButton
              mode="register"
              text={passkeyRegistered ? "Add Another Passkey" : "Register Passkey for this Device"}
              onSuccess={() => setPasskeyRegistered(true)}
            />
          </div>
        </div>

        {/* Continue Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSaveAndContinue}
            disabled={saving}
            className="w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Complete Setup & Activate Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
