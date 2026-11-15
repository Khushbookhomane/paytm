"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { apiRequest, authStorage, Merchant } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  Settings as SettingsIcon,
  Store,
  ShieldCheck,
  CreditCard,
  QrCode,
  Volume2,
  Globe,
  Moon,
  Sun,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  Sliders,
  Database,
  Radio,
  Building,
  MapPin,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [lang, setLang] = useState<Language>("hi");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [demoMode, setDemoMode] = useState<boolean>(true);

  // Form Profile State
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("Kirana & Grocery");
  const [businessLocation, setBusinessLocation] = useState("Mumbai, Maharashtra");
  const [businessSize, setBusinessSize] = useState("Small & Medium Enterprise (SME)");
  const [gstin, setGstin] = useState("27AAAAA0000A1Z5");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const m = authStorage.getMerchant();
    setMerchant(m);
    if (m?.name) setBusinessName(m.name);
    if (m?.category) setBusinessCategory(m.category);

    const l = authStorage.getLanguage();
    setLang(l);
    const t = authStorage.getTheme();
    setTheme(t);
    setDemoMode(authStorage.getDemoMode());
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;
    const updated: Merchant = {
      id: merchant?.id || 1,
      name: businessName.trim(),
      email: merchant?.email || "demo@venture.ai",
      category: businessCategory,
      language: lang,
      plan: merchant?.plan || "pro",
    };
    authStorage.setMerchant(updated);
    setMerchant(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    authStorage.setLanguage(newLang);
    window.dispatchEvent(new Event("languageChanged"));
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    authStorage.setTheme(newTheme);
  };

  const handleDemoToggle = () => {
    const nextVal = !demoMode;
    setDemoMode(nextVal);
    authStorage.setDemoMode(nextVal);
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    authStorage.clear();
    router.replace("/sign-in");
  };

  return (
    <AppLayout activePageTitle="Merchant Settings">
      <div className="space-y-6 max-w-4xl">
        {/* Top Header */}
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Settings & Business Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your store identity, connected Paytm Point-of-Sale hardware, and language preferences
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Store profile and operating settings saved successfully!</span>
          </div>
        )}

        {/* 1. Business Profile Section */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950 text-[#00BAF2] flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                  Business Identity & KYB Profile
                </h3>
                <p className="text-[10px] text-slate-400">Official merchant registration details</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Paytm Merchant</span>
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Business / Store Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Business Category
                </label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-semibold cursor-pointer"
                >
                  <option value="Kirana & Grocery">Kirana & Grocery Store</option>
                  <option value="Dairy & Sweets">Dairy & Confectionery</option>
                  <option value="Pharmacy & Healthcare">Pharmacy & Healthcare</option>
                  <option value="Fashion & Retail">Fashion & Garments</option>
                  <option value="Restaurant & Cafe">Restaurant & Food Joint</option>
                  <option value="Electronics & Hardware">Electronics & Mobile Care</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Store Location / City
                </label>
                <input
                  type="text"
                  value={businessLocation}
                  onChange={(e) => setBusinessLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  GSTIN / Registration ID (Optional)
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00BAF2] hover:bg-[#0099cc] text-white text-xs font-bold transition shadow-sm active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. Connected Paytm Hardware & Point-of-Sale Integration */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Connected Paytm Point-of-Sale Hardware
            </h3>
            <p className="text-xs text-slate-400">
              Live hardware telemetry and automatic audio payment confirmations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <Volume2 className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  Online
                </span>
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">Paytm Soundbox 4G</p>
                <p className="text-[10px] text-slate-400">Device ID: PSB-882194</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <QrCode className="w-5 h-5 text-[#00BAF2]" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  Active
                </span>
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">All-in-One QR Code</p>
                <p className="text-[10px] text-slate-400">UPI, Wallet, Rupay</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <CreditCard className="w-5 h-5 text-indigo-500" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  Connected
                </span>
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">Bank Settlement</p>
                <p className="text-[10px] text-slate-400">HDFC Bank ··· 4921</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Demo Data vs Live Mode Toggle */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#00BAF2]" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Demo Data Mode
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
              When Demo Mode is enabled, VentureAI showcases realistic 90-day kirana transaction telemetry. Disable this once production Paytm API credentials are authenticated.
            </p>
          </div>

          <button
            onClick={handleDemoToggle}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              demoMode
                ? "bg-[#00BAF2] text-white shadow-sm"
                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            {demoMode ? "Demo Mode Active" : "Live Paytm Mode"}
          </button>
        </div>

        {/* 4. Display, Language & Session Controls */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Display & Session Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Language */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Default Language</label>
              <div className="flex gap-2">
                {[
                  { id: "hi", label: "हिन्दी" },
                  { id: "en", label: "English" },
                  { id: "mr", label: "मराठी" },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleLanguageChange(l.id as Language)}
                    className={`flex-1 py-2 rounded-xl font-bold border transition ${
                      lang === l.id
                        ? "bg-[#00BAF2] text-white border-[#00BAF2]"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Interface Theme</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`flex-1 py-2 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition ${
                    theme === "light"
                      ? "bg-[#002E6E] text-white border-[#002E6E]"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`flex-1 py-2 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition ${
                    theme === "dark"
                      ? "bg-[#00BAF2] text-white border-[#00BAF2]"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">Session ID: #PAYTM-MERCHANT-001</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Account</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
