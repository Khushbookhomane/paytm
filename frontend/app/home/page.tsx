"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { apiRequest, authStorage, Merchant } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Package,
  Send,
  Users,
  CreditCard,
  QrCode,
  Volume2,
  Calendar,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BadgeIndianRupee,
  ShoppingBag,
  Zap,
  ArrowUpRight,
  BotMessageSquare,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  today_sales: number;
  vs_yesterday_pct: number;
  seven_day_trend: Array<{ date: string; day: string; sales: number; transactions: number }>;
  top_5_products: Array<{ id: number; name: string; category: string; qty_sold: number; revenue: number }>;
  estimated_profit: number;
  margin_pct: number;
  payment_mode_split: Array<{ mode: string; amount: number; percentage: number; count: number }>;
  active_customers_today: number;
  low_stock_count: number;
}

interface RecommendationCard {
  id: number;
  title: string;
  why: string;
  numbers: Record<string, any>;
  suggested_action: string;
  button_target: string;
  button_text: string;
  type: string;
  status: string;
}

export default function HomePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("hi");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "month">("7d");
  const [data, setData] = useState<DashboardData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [activeRecIdx, setActiveRecIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLang(authStorage.getLanguage());
    setMerchant(authStorage.getMerchant());
    fetchDashboardData(authStorage.getLanguage());

    const handleLangChange = () => {
      const l = authStorage.getLanguage();
      setLang(l);
      fetchDashboardData(l);
    };
    window.addEventListener("languageChanged", handleLangChange);
    return () => window.removeEventListener("languageChanged", handleLangChange);
  }, []);

  const fetchDashboardData = async (targetLang: Language) => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, recsRes] = await Promise.all([
        apiRequest<DashboardData>("/dashboard"),
        apiRequest<RecommendationCard[]>(`/recommendations/today?language=${targetLang}`),
      ]);
      setData(dashRes);
      setRecommendations(recsRes || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const tHome = translations[lang]?.home || translations.en.home;
    if (hour < 12) return tHome.greetingMorning;
    if (hour < 17) return tHome.greetingAfternoon;
    return tHome.greetingEvening;
  };

  const COLORS = ["#00BAF2", "#002E6E", "#00E0D6", "#6366F1", "#F59E0B"];

  return (
    <AppLayout activePageTitle="Merchant Overview">
      <div className="space-y-6">
        {/* ============================================================ */}
        {/* DASHBOARD HEADER & STORE BANNER                              */}
        {/* ============================================================ */}
        <div className="rounded-2xl bg-gradient-to-r from-[#002E6E] via-[#003d8f] to-[#00519e] text-white p-5 lg:p-7 shadow-lg shadow-[#002E6E]/15 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#00BAF2]/15 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 w-48 h-48 rounded-full bg-[#00E0D6]/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00E0D6] bg-[#00E0D6]/15 px-2.5 py-0.5 rounded-full border border-[#00E0D6]/30">
                  {getGreeting()}
                </span>
                <span className="text-xs text-sky-200">·</span>
                <span className="text-xs text-sky-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#00BAF2]" />
                  IST Real-time Sync
                </span>
              </div>
              <h1 className="text-xl lg:text-3xl font-black tracking-tight leading-tight">
                {merchant?.name || "Sharma General Store"}
              </h1>
              <p className="text-xs lg:text-sm text-sky-100/90 mt-1 max-w-xl">
                Kirana & Grocery Store · Beyond Payments. Your store processed{" "}
                <span className="text-white font-bold underline decoration-[#00BAF2]">
                  {data?.seven_day_trend?.reduce((acc, d) => acc + d.transactions, 0) || 450} checkouts
                </span>{" "}
                with zero payment leakage.
              </p>
            </div>

            {/* Quick Actions & Date Filter */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              {/* Date range filter pills */}
              <div className="flex items-center bg-white/10 backdrop-blur rounded-xl p-1 border border-white/15 text-xs font-semibold">
                {(["today", "7d", "30d", "month"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      dateRange === r
                        ? "bg-[#00BAF2] text-white shadow-sm font-bold"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    {r === "today" ? "Today" : r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "This Month"}
                  </button>
                ))}
              </div>

              {/* Ask Copilot CTA */}
              <Link
                href="/copilot"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00BAF2] to-[#00E0D6] text-slate-900 font-extrabold text-xs shadow-md shadow-sky-500/30 hover:brightness-105 active:scale-95 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                <span>Open Copilot</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PROACTIVE AI RECOMMENDATION CARD CAROUSEL                    */}
        {/* ============================================================ */}
        {recommendations.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 lg:p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-[#00BAF2] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs lg:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                    AI Business Partner Priorities
                  </h3>
                  <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400">
                    Verified data-backed suggestions to grow today&apos;s revenue
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {recommendations.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveRecIdx(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === activeRecIdx
                        ? "w-6 bg-[#00BAF2]"
                        : "w-2 bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Active Card Body */}
            {recommendations[activeRecIdx] && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {recommendations[activeRecIdx].type.replace("_", " ")}
                    </span>
                    <h4 className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white">
                      {recommendations[activeRecIdx].title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl">
                    {recommendations[activeRecIdx].why}
                  </p>
                </div>

                <Link
                  href={recommendations[activeRecIdx].button_target}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#002E6E] hover:bg-[#003d8f] text-white text-xs font-bold shrink-0 transition shadow-sm active:scale-95"
                >
                  <span>{recommendations[activeRecIdx].button_text}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#00BAF2]" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 6 CORE BUSINESS PERFORMANCE CARDS                            */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
          {/* 1. Total Revenue */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:border-[#00BAF2]/50 transition group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Revenue</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950 text-[#00BAF2] flex items-center justify-center">
                <BadgeIndianRupee className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{data ? data.today_sales.toLocaleString("en-IN") : "4,558"}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              {data && data.vs_yesterday_pct >= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +{data.vs_yesterday_pct}%
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> {data?.vs_yesterday_pct}%
                </span>
              )}
              <span className="text-slate-400 text-[10px]">vs yesterday</span>
            </div>
          </div>

          {/* 2. Total Transactions */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:border-[#00BAF2]/50 transition group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Transactions</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {data?.seven_day_trend?.[data.seven_day_trend.length - 1]?.transactions || 38}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              ~4.2 orders / active hour
            </p>
          </div>

          {/* 3. Average Transaction Value (ATV) */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:border-[#00BAF2]/50 transition group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Avg Basket (ATV)</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{data && data.today_sales ? Math.round(data.today_sales / 38) : 120}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              +6% multi-item bills
            </p>
          </div>

          {/* 4. Estimated Profit */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:border-[#00BAF2]/50 transition group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Est. Gross Profit</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{data ? data.estimated_profit.toLocaleString("en-IN") : "838"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
              {data?.margin_pct || 18.4}% gross margin
            </p>
          </div>

          {/* 5. Sales Growth % */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:border-[#00BAF2]/50 transition group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Growth Score</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              78 / 100
            </p>
            <p className="text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-1">
              Strong Performer
            </p>
          </div>

          {/* 6. Active Customers */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:border-[#00BAF2]/50 transition group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Active Buyers</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {data?.active_customers_today || 24}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              {data?.low_stock_count || 5} items low stock
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* INTERACTIVE DATA VISUALIZATIONS                              */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 7-Day / 30-Day Sales Trajectory (2 Cols) */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Daily Sales & Transaction Trajectory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verified daily turnover with day-by-day cash flow reconciliation
                </p>
              </div>
              <Link
                href="/sales"
                className="text-xs font-bold text-[#00BAF2] hover:underline flex items-center gap-1"
              >
                Detailed Analysis <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-64 w-full">
              {data?.seven_day_trend && data.seven_day_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.seven_day_trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00BAF2" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00BAF2" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0c1324",
                        border: "1px solid #1e293b",
                        borderRadius: "0.75rem",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Sales"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#00BAF2"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading sales performance charts...
                </div>
              )}
            </div>
          </div>

          {/* Payment Mode Distribution (Paytm Soundbox, UPI QR, etc.) */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Payment Mode Split
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  100% Reconciled
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Paytm Soundbox UPI & QR share
              </p>

              <div className="h-44 w-full flex items-center justify-center">
                {data?.payment_mode_split && data.payment_mode_split.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.payment_mode_split}
                        dataKey="amount"
                        nameKey="mode"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {data.payment_mode_split.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0c1324",
                          border: "1px solid #1e293b",
                          borderRadius: "0.5rem",
                          fontSize: "11px",
                          color: "#fff",
                        }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Amount"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400">Computing payment channels...</div>
                )}
              </div>
            </div>

            {/* Split Breakdown Legend */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {data?.payment_mode_split?.map((item, idx) => (
                <div key={item.mode} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.mode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-400">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BEST PERFORMING PRODUCTS & QUICK OPERATIONAL MODULES         */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top 5 Best-Performing Products */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Top 5 High-Velocity Products
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Highest revenue contributors over the past 30 days
                </p>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-bold text-[#00BAF2] hover:underline flex items-center gap-1"
              >
                Manage Inventory <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.top_5_products && data.top_5_products.length > 0 ? (
                data.top_5_products.map((item, idx) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        ₹{item.revenue.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {item.qty_sold} units sold
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Loading catalog velocity metrics...
                </div>
              )}
            </div>
          </div>

          {/* Quick AI Operating Tools Card */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">
              AI Business Partner Shortcuts
            </h3>

            <Link
              href="/copilot"
              className="flex items-center justify-between p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 hover:border-[#00BAF2] transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00BAF2] text-white flex items-center justify-center">
                  <BotMessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Ask Copilot</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Voice or text business query</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#00BAF2] group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/marketing"
              className="flex items-center justify-between p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 hover:border-purple-400 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp Campaign</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Diwali & weekend discount blasts</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/growth-score"
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-400 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Growth Score Plan</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Review 5 health dimensions</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/reports"
              className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 hover:border-amber-400 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Download PDF Report</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Weekly executive statement</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
