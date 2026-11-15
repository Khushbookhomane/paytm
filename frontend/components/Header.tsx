"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStorage, Merchant, apiRequest } from "@/lib/api";
import { Language } from "@/lib/translations";
import { Globe, Settings as SettingsIcon, LogOut, ChevronDown } from "lucide-react";

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Header({ currentLang, onLanguageChange }: HeaderProps) {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    setMerchant(authStorage.getMerchant());
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    authStorage.clear();
    router.replace("/sign-in");
  };

  return (
    <header className="sticky top-0 z-40 shadow-md" style={{ background: "linear-gradient(135deg, #002E6E 0%, #003d8f 60%, #00519e 100%)" }}>
      {/* Top bar: Paytm logo + controls */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        {/* Paytm Wordmark Logo */}
        <div className="flex items-center gap-2">
          {/* Paytm "P" badge */}
          <div className="w-8 h-8 rounded-lg bg-[#00BAF2] flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-base leading-none">P</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-white font-black text-lg tracking-tight leading-none">
                paytm
              </span>
              <span className="text-[9px] font-bold text-[#00BAF2] uppercase tracking-widest leading-none">
                for business
              </span>
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Language selector */}
          <div className="flex items-center bg-white/10 rounded-lg px-2 py-1 border border-white/15 gap-1">
            <Globe className="w-3 h-3 text-[#00BAF2]" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-transparent text-[11px] font-semibold text-white outline-none cursor-pointer pr-1"
            >
              <option value="hi" className="text-slate-900">हिन्दी</option>
              <option value="en" className="text-slate-900">English</option>
              <option value="mr" className="text-slate-900">मराठी</option>
            </select>
          </div>

          <button
            onClick={() => router.push("/settings")}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 active:scale-95 transition border border-white/10"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-white/10 text-white/80 hover:text-red-300 hover:bg-white/20 active:scale-95 transition border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Store identity sub-bar */}
      <div className="flex items-center justify-between px-4 pb-2.5 pt-1">
        <div className="flex items-center gap-2">
          {/* Store avatar */}
          <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
            <span className="text-white font-bold text-xs">
              {(merchant?.name || "S").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white font-semibold text-xs leading-tight line-clamp-1">
              {merchant?.name || "Sharma General Store"}
            </p>
            <p className="text-sky-300 text-[10px] leading-tight">Kirana · Mumbai</p>
          </div>
        </div>

        {/* Plan badge */}
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            merchant?.plan === "pro"
              ? "bg-[#00E0D6]/20 text-[#00E0D6] border border-[#00E0D6]/40"
              : "bg-white/15 text-white/80 border border-white/20"
          }`}
        >
          {merchant?.plan === "pro" ? "⚡ Pro" : "Free"}
        </span>
      </div>

      {/* Paytm blue accent line at bottom */}
      <div className="h-0.5 bg-gradient-to-r from-[#00BAF2] via-[#00E0D6] to-transparent" />
    </header>
  );
}
