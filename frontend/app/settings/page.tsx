"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { apiRequest, authStorage, Merchant } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import {
  ShieldCheck,
  Zap,
  Check,
  UploadCloud,
  FileSpreadsheet,
  Lock,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Landmark,
  Users,
  ArrowRight,
  Building2,
  LogOut,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("hi");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [togglingPlan, setTogglingPlan] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLang(authStorage.getLanguage());
    setMerchant(authStorage.getMerchant());
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiRequest<Merchant>("/auth/me");
      setMerchant(res);
      authStorage.setMerchant(res);
    } catch {
      // ignore
    }
  };

  const handleTogglePlan = async () => {
    setTogglingPlan(true);
    try {
      const res = await apiRequest<Merchant>("/auth/toggle-plan", { method: "POST" });
      setMerchant(res);
      authStorage.setMerchant(res);
    } catch (err: any) {
      alert("Failed to toggle plan: " + err.message);
    } finally {
      setTogglingPlan(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    authStorage.clear();
    router.replace("/sign-in");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = authStorage.getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/upload/csv`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("CSV Upload failed");
      }

      const data = await res.json();
      setUploadResult(`✓ ${data.message}`);
    } catch (err: any) {
      setUploadResult(`❌ Error uploading CSV: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const t = translations[lang];
  const isPro = merchant?.plan?.toLowerCase() === "pro";

  return (
    <div className="flex-1 flex flex-col justify-between">
      <Header currentLang={lang} onLanguageChange={(l) => { setLang(l); authStorage.setLanguage(l); }} />

      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {t.settings.title}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === "en" ? "Manage plan tiers, CSV uploads & privacy" : "सब्सक्रिप्शन प्लान, डेटा व प्राइवेसी"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title={lang === "hi" ? "लॉग आउट" : lang === "mr" ? "लॉग आउट" : "Log Out"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition active:scale-95 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === "hi" ? "लॉग आउट" : lang === "mr" ? "लॉग आउट" : "Log Out"}</span>
          </button>
        </div>

        {/* Plan Cards & Feature Gating */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t.settings.plan}
          </h3>

          {/* Current Active Plan Card */}
          <div className="paytm-card p-4 border border-[#00BAF2]/30 bg-gradient-to-br from-white to-[#f0f9ff]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E8F8FE] text-[#002E6E]">
                  Current Plan
                </span>
                <h4 className="text-base font-black text-slate-900 mt-1 capitalize">
                  {merchant?.plan || "Free"} Plan
                </h4>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-[#002E6E]">
                  {isPro ? "₹149/mo" : "₹0/mo"}
                </span>
                <p className="text-[10px] text-slate-500">Billed monthly</p>
              </div>
            </div>

            {/* Feature comparison list */}
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Today's Sales & 7-Day Trend Chart</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Inventory Catalog & Stock Status</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                {isPro ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={isPro ? "font-bold text-slate-900" : "text-slate-400"}>
                  Pro: 7-Day Demand Forecasting & Weekend Spikes
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                {isPro ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={isPro ? "font-bold text-slate-900" : "text-slate-400"}>
                  Pro: Churn Risk Customer Segmentation (RFM)
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                {isPro ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={isPro ? "font-bold text-slate-900" : "text-slate-400"}>
                  Pro: Multilingual WhatsApp Campaign Generator & Voice Explainer
                </span>
              </div>
            </div>

            {/* Mock Upgrade / Downgrade Toggle Button */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                Demo Mode Toggle
              </span>

              <button
                onClick={handleTogglePlan}
                disabled={togglingPlan}
                className="px-4 py-2 rounded-xl bg-[#002E6E] hover:bg-[#002252] text-white text-xs font-bold shadow active:scale-95 transition"
              >
                {togglingPlan ? "Updating..." : isPro ? "Switch to Free Plan" : "Upgrade to Pro (Demo)"}
              </button>
            </div>
          </div>
        </div>

        {/* Data Source Selector & CSV Ingestion */}
        <div className="paytm-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#00BAF2]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t.settings.dataSource}
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active: Seeded Demo Data (90 Days)
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {lang === "en"
              ? "Running in zero-credential evaluation mode. You can also upload your store transaction CSV."
              : "यह डेमो बिना किसी असली पेटीएम चाबी के चलता है। आप अपनी दुकान का CSV डेटा भी अपलोड कर सकते हैं।"}
          </p>

          {/* CSV File Upload Section */}
          <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
            <FileSpreadsheet className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-700">Upload Store Transactions CSV</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Columns: date, product_name, category, qty, price, payment_mode
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-[#00BAF2] text-xs font-bold text-slate-700 shadow-2xs active:scale-95 transition"
            >
              {uploading ? "Ingesting Rows..." : "Select CSV File"}
            </button>

            {uploadResult && (
              <p className="text-xs font-bold mt-2 text-slate-800">
                {uploadResult}
              </p>
            )}
          </div>
        </div>

        {/* Merchant & Business Management Links */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Business Administration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => router.push("/bank-connections")}
              className="paytm-card p-3 flex items-center justify-between text-left hover:border-[#00BAF2] transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#002E6E] flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-[#00BAF2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Bank Connections</p>
                  <span className="text-[10px] text-slate-500">Accounts & Statements</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => router.push("/team")}
              className="paytm-card p-3 flex items-center justify-between text-left hover:border-[#00BAF2] transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Team Members</p>
                  <span className="text-[10px] text-slate-500">Roles & Access Control</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => router.push("/onboarding")}
              className="paytm-card p-3 flex items-center justify-between text-left hover:border-[#00BAF2] transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Business Verification</p>
                  <span className="text-[10px] text-slate-500">Onboarding Checklist</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Account & Session / Sign Out Card */}
        <div className="paytm-card p-4 space-y-3 border border-slate-200">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {lang === "hi" ? "अकाउंट व सेशन" : lang === "mr" ? "खाते आणि सत्र" : "Account & Session"}
          </h3>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#002E6E] text-white font-black text-sm flex items-center justify-center">
                {(merchant?.name || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{merchant?.name || "Sharma General Store"}</p>
                <p className="text-[10px] text-slate-500">{merchant?.email || "demo@venture.ai"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition active:scale-95 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === "hi" ? "लॉग आउट" : lang === "mr" ? "लॉग आउट" : "Log Out"}</span>
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="paytm-card p-4 space-y-2 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              {t.settings.privacy}
            </h3>
          </div>

          <ul className="text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
            <li>• <strong>PII Masking:</strong> Customer phone numbers are strictly stored masked (e.g. 98XXXXXX21) to protect customer privacy.</li>
            <li>• <strong>No Cross-Merchant Sharing:</strong> Your store sales, revenue, and margins are isolated to your merchant account.</li>
            <li>• <strong>Zero LLM Hallucinations:</strong> Every number displayed is computed by verified Python code; AI only explains.</li>
          </ul>
        </div>
      </main>

      <Navigation currentLang={lang} />
    </div>
  );
}
