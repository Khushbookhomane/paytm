"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authStorage, Merchant, apiRequest } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import {
  LayoutDashboard,
  BotMessageSquare,
  TrendingUp,
  PackageCheck,
  Users,
  Megaphone,
  WalletCards,
  Award,
  Bell,
  FileSpreadsheet,
  Settings as SettingsIcon,
  LineChart,
  LogOut,
  Moon,
  Sun,
  Globe,
  Menu,
  X,
  Volume2,
  ChevronRight,
  ShieldCheck,
  Search,
  Sparkles,
  Store,
  Layers,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  activePageTitle?: string;
}

export default function AppLayout({ children, activePageTitle }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [lang, setLang] = useState<Language>("hi");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [quickSearch, setQuickSearch] = useState("");

  useEffect(() => {
    // Sync storage
    const m = authStorage.getMerchant();
    setMerchant(m);
    const l = authStorage.getLanguage();
    setLang(l);
    const t = authStorage.getTheme();
    setTheme(t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setDemoMode(authStorage.getDemoMode());

    // Fetch unread notifications count silently
    apiRequest<{ unread_count: number }>("/notifications?unread_only=true")
      .then((res) => {
        if (typeof res?.unread_count === "number") setUnreadCount(res.unread_count);
      })
      .catch(() => { /* fallback */ });
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    authStorage.setLanguage(newLang);
    // Trigger custom event or reload state if needed
    window.dispatchEvent(new Event("languageChanged"));
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    authStorage.setTheme(nextTheme);
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    authStorage.clear();
    router.replace("/sign-in");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    router.push(`/copilot?q=${encodeURIComponent(quickSearch.trim())}`);
  };

  const t = translations[lang]?.tabs || translations.en.tabs;

  // 12 core navigation items
  const navItems = [
    {
      name: t.overview || "Overview",
      path: "/home",
      aliases: ["/dashboard", "/"],
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: t.copilot || "AI Business Copilot",
      path: "/copilot",
      icon: BotMessageSquare,
      badge: "AI 2.0",
      highlight: true,
    },
    {
      name: t.intelligence || "Business Intelligence",
      path: "/intelligence",
      icon: LineChart,
      badge: "Deep Analytics",
    },
    {
      name: t.sales || "Sales & Transactions",
      path: "/sales",
      icon: TrendingUp,
      badge: null,
    },
    {
      name: t.inventory || "Inventory Management",
      path: "/inventory",
      aliases: ["/stock"],
      icon: PackageCheck,
      badge: null,
    },
    {
      name: t.customers || "Customer Intelligence",
      path: "/customers",
      icon: Users,
      badge: null,
    },
    {
      name: t.marketing || "Marketing Assistant",
      path: "/marketing",
      icon: Megaphone,
      badge: "WhatsApp",
    },
    {
      name: t.finance || "Financial Assistant",
      path: "/finance",
      icon: WalletCards,
      badge: null,
    },
    {
      name: t.growthScore || "Merchant Growth Score",
      path: "/growth-score",
      icon: Award,
      badge: "78 / 100",
    },
    {
      name: t.notifications || "Alerts & Notifications",
      path: "/notifications",
      icon: Bell,
      badge: unreadCount > 0 ? String(unreadCount) : null,
      badgeColor: "bg-rose-500 text-white",
    },
    {
      name: t.reports || "Reports & Exports",
      path: "/reports",
      icon: FileSpreadsheet,
      badge: "PDF / CSV",
    },
    {
      name: t.settings || "Settings",
      path: "/settings",
      icon: SettingsIcon,
      badge: null,
    },
  ];

  const isNavActive = (item: (typeof navItems)[0]) => {
    if (pathname === item.path) return true;
    if (item.aliases?.includes(pathname)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR (>= md)                                      */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-[#0c1324] border-r border-slate-200/80 dark:border-slate-800/80 fixed inset-y-0 left-0 z-30 shadow-sm transition-colors">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-r from-slate-50 to-white dark:from-[#0c1324] dark:to-[#0f182f]">
          <Link href="/home" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00BAF2] via-[#0099cc] to-[#002E6E] flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl leading-none tracking-tight">P</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                  Venture<span className="text-[#00BAF2]">AI</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-[#002E6E] text-[#00BAF2] border border-[#00BAF2]/30">
                  PAYTM
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 mt-0.5 tracking-tight">
                Your AI Business Partner
              </span>
            </div>
          </Link>
        </div>

        {/* Merchant Profile Bar */}
        <div className="px-4 py-3 mx-3 my-2.5 rounded-xl bg-gradient-to-r from-sky-50/70 to-indigo-50/40 dark:from-slate-900 dark:to-slate-800/60 border border-sky-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#002E6E] text-[#00BAF2] flex items-center justify-center font-bold text-sm shrink-0 border border-sky-400/20">
              {(merchant?.name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {merchant?.name || "Sharma General Store"}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span className="truncate">Paytm Verified</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
            {demoMode ? "DEMO" : "LIVE"}
          </span>
        </div>

        {/* 12 Navigation Items Scrollable List */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <div className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Business Operating OS
          </div>
          {navItems.map((item) => {
            const active = isNavActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                  active
                    ? "bg-[#00BAF2] text-white shadow-sm shadow-[#00BAF2]/30 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`p-1 rounded-lg transition-colors ${
                      active
                        ? "bg-white/20 text-white"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-[#00BAF2]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 transition-colors ${
                      active
                        ? "bg-white/20 text-white"
                        : item.badgeColor ||
                          "bg-sky-50 dark:bg-sky-950/60 text-[#00BAF2] dark:text-[#00BAF2] border border-sky-100 dark:border-sky-900/50"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Paytm Hardware Live Connectivity Indicator */}
        <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">Paytm Soundbox</p>
                <p className="text-[10px] text-slate-400">Audio Confirmations Active</p>
              </div>
            </div>
            <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>

        {/* Bottom Preferences (Theme, Language, Logout) */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-white dark:bg-[#0c1324]">
          <div className="flex items-center gap-1">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Globe className="w-3 h-3 mr-1 text-[#00BAF2]" />
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="bg-transparent text-[11px] font-bold outline-none cursor-pointer"
              >
                <option value="hi" className="text-slate-900 dark:text-slate-100 dark:bg-slate-900">हिन्दी</option>
                <option value="en" className="text-slate-900 dark:text-slate-100 dark:bg-slate-900">English</option>
                <option value="mr" className="text-slate-900 dark:text-slate-100 dark:bg-slate-900">मराठी</option>
              </select>
            </div>

            {/* Dark/Light Mode Switcher */}
            <button
              onClick={handleThemeToggle}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA & TOP APP BAR                              */}
      {/* ============================================================ */}
      <div className="flex-1 md:ml-64 lg:ml-72 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-[#0c1324]/95 backdrop-blur border-b border-slate-200/80 dark:border-slate-800/80 px-4 lg:px-8 py-2.5 flex items-center justify-between transition-colors">
          {/* Left: Mobile hamburger & breadcrumb / page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-400">
                <span className="font-semibold text-[#002E6E] dark:text-[#00BAF2]">Paytm VentureAI</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="capitalize">{activePageTitle || "Business Operating System"}</span>
              </div>
              <h1 className="text-base lg:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {activePageTitle || "Merchant Intelligence Dashboard"}
              </h1>
            </div>
          </div>

          {/* Right: Search, Notifications, AI Ask, User Badge */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Quick Copilot query input */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative">
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Ask Copilot anything..."
                className="w-56 xl:w-72 bg-slate-100 dark:bg-slate-800/90 text-xs text-slate-900 dark:text-slate-100 pl-8 pr-16 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00BAF2]/30 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
              <button
                type="submit"
                className="absolute right-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#00BAF2] text-white hover:bg-[#0099cc] transition flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Ask AI
              </button>
            </form>

            {/* Quick Ask AI button on smaller screens */}
            <button
              onClick={() => router.push("/copilot")}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00BAF2] to-[#0099cc] text-white text-xs font-bold shadow-sm shadow-sky-500/20 active:scale-95 transition"
            >
              <BotMessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copilot</span>
            </button>

            {/* Notifications Bell */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Notifications & Proactive Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
              )}
            </Link>

            {/* Language toggle for mobile/header */}
            <div className="md:hidden flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs">
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="bg-transparent text-[10px] font-bold outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="hi" className="dark:bg-slate-900">हिन्दी</option>
                <option value="en" className="dark:bg-slate-900">EN</option>
                <option value="mr" className="dark:bg-slate-900">मराठी</option>
              </select>
            </div>

            {/* Theme switcher */}
            <button
              onClick={handleThemeToggle}
              className="md:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Merchant Avatar */}
            <Link
              href="/settings"
              className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800"
            >
              <div className="w-8 h-8 rounded-full bg-[#002E6E] text-[#00BAF2] border-2 border-[#00BAF2]/30 flex items-center justify-center font-bold text-xs shadow-sm">
                {(merchant?.name || "S").charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {children}
        </main>
      </div>

      {/* ============================================================ */}
      {/* MOBILE SLIDE-OVER DRAWER (12 Navigation modules)            */}
      {/* ============================================================ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Canvas */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-[#0c1324] h-full shadow-2xl flex flex-col z-10">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00BAF2] flex items-center justify-center font-black text-white text-base">
                  P
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white leading-none">
                    Venture<span className="text-[#00BAF2]">AI</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">by Paytm · for business</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Merchant Identity */}
            <div className="p-3 mx-3 my-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#002E6E] text-[#00BAF2] flex items-center justify-center font-bold text-xs shrink-0">
                {(merchant?.name || "S").charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {merchant?.name || "Sharma General Store"}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ Verified Merchant</p>
              </div>
            </div>

            {/* 12 Nav Items */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {navItems.map((item) => {
                const active = isNavActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      active
                        ? "bg-[#00BAF2] text-white font-bold shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          active ? "bg-white/20 text-white" : "bg-sky-100 dark:bg-sky-950 text-[#00BAF2]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={handleThemeToggle}
                className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                <span>{theme === "dark" ? "Light" : "Dark"}</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-rose-500 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MOBILE BOTTOM QUICK NAVIGATION (< md)                         */}
      {/* ============================================================ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0c1324]/95 backdrop-blur border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1 shadow-lg flex items-center justify-around">
        <Link
          href="/home"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold transition-colors ${
            pathname === "/home" || pathname === "/dashboard"
              ? "text-[#00BAF2]"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Overview</span>
        </Link>

        <Link
          href="/sales"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold transition-colors ${
            pathname === "/sales" ? "text-[#00BAF2]" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          <TrendingUp className="w-4 h-4 mb-0.5" />
          <span>Sales</span>
        </Link>

        {/* Center Raised Copilot Button */}
        <Link
          href="/copilot"
          className="flex flex-col items-center -mt-5"
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
              pathname === "/copilot"
                ? "bg-[#002E6E] ring-2 ring-[#00BAF2] ring-offset-2"
                : "bg-gradient-to-tr from-[#00BAF2] to-[#0099cc]"
            }`}
            style={{ boxShadow: "0 4px 14px rgba(0, 186, 242, 0.45)" }}
          >
            <BotMessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="text-[10px] font-bold mt-1 text-[#002E6E] dark:text-[#00BAF2]">
            Copilot
          </span>
        </Link>

        <Link
          href="/inventory"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold transition-colors ${
            pathname === "/inventory" || pathname === "/stock"
              ? "text-[#00BAF2]"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          <PackageCheck className="w-4 h-4 mb-0.5" />
          <span>Stock</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
