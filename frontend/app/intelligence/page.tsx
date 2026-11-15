"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { apiRequest, authStorage } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Zap,
  Globe,
  Share2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface IntelligenceSummary {
  period: string;
  revenue: { current: number; previous: number; growth_pct: number };
  transactions: { current: number; previous: number; growth_pct: number };
  aov: { current: number; previous: number; growth_pct: number };
  hourly_distribution: Array<{ hour: string; sales: number; transactions: number }>;
  peak_hour: { hour: string; sales: number };
  evening_vs_morning_ratio: number;
  top_performing_products: Array<{
    id: number;
    name: string;
    category: string;
    units_sold: number;
    revenue: number;
    margin_pct: number;
    stock_qty: number;
  }>;
  dead_stock_candidates: Array<{
    id: number;
    name: string;
    category: string;
    stock_qty: number;
    tied_capital: number;
    days_idle: number;
  }>;
  anomalies: Array<{
    type: string;
    title: string;
    severity: string;
    detail: string;
    action: string;
  }>;
  ai_summaries: { en: string; hi: string; mr: string };
}

export default function IntelligencePage() {
  const [lang, setLang] = useState<Language>("hi");
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<IntelligenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLang(authStorage.getLanguage());
    fetchIntelligence(range);
  }, [range]);

  const fetchIntelligence = async (selectedRange: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<IntelligenceSummary>(`/intelligence/summary?range=${selectedRange}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load business intelligence");
    } finally {
      setLoading(false);
    }
  };

  const getAnomalyBadge = (severity: string) => {
    switch (severity) {
      case "positive":
        return "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "warning":
        return "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      default:
        return "bg-sky-100 dark:bg-sky-950 text-[#00BAF2] border-sky-200 dark:border-sky-800";
    }
  };

  return (
    <AppLayout activePageTitle="AI Business Intelligence">
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Business Intelligence & Anomaly Engine
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deep trend diagnostics, peak-hour rush patterns, and product margin velocity
            </p>
          </div>

          {/* Time range selector */}
          <div className="flex items-center bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  range === r
                    ? "bg-[#00BAF2] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {r === "7d" ? "Past 7 Days" : r === "30d" ? "Past 30 Days" : "Past 90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* AI Business Executive Summary Card */}
        {data?.ai_summaries && (
          <div className="rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50/50 dark:from-slate-900 dark:to-[#0c1324] border border-sky-100 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#00BAF2] text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                AI Executive Summary · {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </h3>
            </div>
            <p className="text-xs lg:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {lang === "hi"
                ? data.ai_summaries.hi
                : lang === "mr"
                ? data.ai_summaries.mr
                : data.ai_summaries.en}
            </p>
          </div>
        )}

        {/* Period-over-Period Performance Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Total Period Revenue</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{data?.revenue.current.toLocaleString("en-IN") || "—"}
              </span>
              <span
                className={`text-xs font-bold flex items-center ${
                  (data?.revenue.growth_pct || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {(data?.revenue.growth_pct || 0) >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {data?.revenue.growth_pct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Prior period: ₹{data?.revenue.previous.toLocaleString("en-IN") || "—"}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Total Transactions</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {data?.transactions.current.toLocaleString("en-IN") || "—"}
              </span>
              <span
                className={`text-xs font-bold flex items-center ${
                  (data?.transactions.growth_pct || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {(data?.transactions.growth_pct || 0) >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {data?.transactions.growth_pct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Prior period: {data?.transactions.previous.toLocaleString("en-IN") || "—"} checkouts
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Average Transaction Value (ATV)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{data?.aov.current.toFixed(0) || "—"}
              </span>
              <span
                className={`text-xs font-bold flex items-center ${
                  (data?.aov.growth_pct || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {(data?.aov.growth_pct || 0) >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {data?.aov.growth_pct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Prior period average: ₹{data?.aov.previous.toFixed(0) || "—"}
            </p>
          </div>
        </div>

        {/* Peak Rush Hours Breakdown */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00BAF2]" />
                Peak Business Rush Hours (7:00 AM – 10:00 PM)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evening sales peak at {data?.peak_hour.hour} and generate {data?.evening_vs_morning_ratio}x more revenue than morning slots
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950 text-[#00BAF2] border border-sky-100 dark:border-sky-800 self-start">
              Peak: {data?.peak_hour.hour} (₹{data?.peak_hour.sales.toLocaleString("en-IN")})
            </span>
          </div>

          <div className="h-60 w-full">
            {data?.hourly_distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourly_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0c1324",
                      border: "1px solid #1e293b",
                      borderRadius: "0.5rem",
                      fontSize: "11px",
                      color: "#fff",
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Sales"]}
                  />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                    {data.hourly_distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.hour === data?.peak_hour.hour ? "#00BAF2" : "#6366F1"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading rush hours data...
              </div>
            )}
          </div>
        </div>

        {/* Automated Anomaly Detection Feed */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Automated Sales Anomaly Detections
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                System flagged anomalies requiring merchant attention or growth action
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data?.anomalies.map((anom, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getAnomalyBadge(anom.severity)}`}>
                      {anom.severity.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    {anom.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {anom.detail}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[11px] font-semibold text-[#00BAF2]">
                  💡 Action: {anom.action}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Performance Deep-Dive & Dead Stock Warnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* High Velocity Products */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
              Top Margin & Velocity Star Products
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Items delivering the highest profit margin and turnover
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.top_performing_products.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.category} · {p.units_sold} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">
                      ₹{p.revenue.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                      {p.margin_pct}% Margin
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dead Stock Candidates */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Dead-Stock Candidates (Zero Sales)
              </h3>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full">
                Capital Tied Up
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Items with no transactions over the selected period
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.dead_stock_candidates && data.dead_stock_candidates.length > 0 ? (
                data.dead_stock_candidates.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{p.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {p.stock_qty} units unsold for {p.days_idle}+ days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-600 dark:text-rose-400">
                        ₹{p.tied_capital.toLocaleString("en-IN")}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Recommend 15% clearance
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No dead stock detected. Excellent catalog turnover!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
