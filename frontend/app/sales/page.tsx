"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { apiRequest, authStorage } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  Award,
  AlertCircle,
  Calendar,
  Clock,
  PieChart as PieIcon,
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
} from "recharts";

interface SalesData {
  range: string;
  total_sales: number;
  total_transactions: number;
  average_order_value: number;
  sales_series: Array<{ date: string; raw_date: string; day: string; sales: number; transactions: number }>;
  category_breakdown: Array<{ category: string; revenue: number; units: number; percentage: number }>;
  peak_hours: Array<{ hour: string; sales: number; transactions: number }>;
  best_day: { date: string; day: string; sales: number };
  worst_day: { date: string; day: string; sales: number };
}

export default function SalesPage() {
  const [lang, setLang] = useState<Language>("hi");
  const [range, setRange] = useState<"week" | "month">("week");
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLang(authStorage.getLanguage());
  }, []);

  useEffect(() => {
    fetchSales();
  }, [range]);

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<SalesData>(`/sales?range=${range}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    authStorage.setLanguage(newLang);
  };

  const t = translations[lang];

  return (
    <div className="flex-1 flex flex-col justify-between">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} />

      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar pb-8">
        {/* Header & Range Filter Tabs */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {t.sales.title}
          </h2>

          <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setRange("week")}
              className={`px-3 py-1.5 rounded-lg transition ${
                range === "week"
                  ? "bg-white text-[#002E6E] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.sales.week}
            </button>
            <button
              onClick={() => setRange("month")}
              className={`px-3 py-1.5 rounded-lg transition ${
                range === "month"
                  ? "bg-white text-[#002E6E] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.sales.month}
            </button>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="h-28 rounded-2xl bg-white animate-pulse" />
            <div className="h-56 rounded-2xl bg-white animate-pulse" />
            <div className="h-44 rounded-2xl bg-white animate-pulse" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-red-800">{error}</p>
            <button
              onClick={fetchSales}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && data && (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="paytm-card p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {t.sales.totalRevenue}
                </span>
                <p className="text-base font-black text-slate-900 mt-1">
                  ₹{(data.total_sales / 1000).toFixed(1)}k
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>Gross</span>
                </div>
              </div>

              <div className="paytm-card p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {t.sales.transactions}
                </span>
                <p className="text-base font-black text-slate-900 mt-1">
                  {data.total_transactions}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-[#00BAF2] font-semibold mt-0.5">
                  <Receipt className="w-3 h-3" />
                  <span>Bills</span>
                </div>
              </div>

              <div className="paytm-card p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {t.sales.avgOrder}
                </span>
                <p className="text-base font-black text-slate-900 mt-1">
                  ₹{Math.round(data.average_order_value)}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-semibold mt-0.5">
                  <ShoppingBag className="w-3 h-3" />
                  <span>/ basket</span>
                </div>
              </div>
            </div>

            {/* Best vs Worst Days */}
            <div className="grid grid-cols-2 gap-2">
              <div className="paytm-card p-3 border-l-4 border-emerald-500">
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase">
                  <Award className="w-3.5 h-3.5" />
                  <span>{t.sales.bestDay}</span>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {data.best_day.date} ({data.best_day.day})
                </p>
                <p className="text-sm font-extrabold text-emerald-700">
                  ₹{data.best_day.sales.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="paytm-card p-3 border-l-4 border-amber-500">
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 uppercase">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t.sales.worstDay}</span>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {data.worst_day.date} ({data.worst_day.day})
                </p>
                <p className="text-sm font-extrabold text-slate-800">
                  ₹{data.worst_day.sales.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Sales Trend Chart (Area Chart) */}
            <div className="paytm-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t.sales.salesTrend}
                </h3>
                <span className="text-[10px] font-semibold text-slate-500">
                  Daily figures
                </span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.sales_series} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00BAF2" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00BAF2" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey={range === "week" ? "day" : "date"}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 9, fontWeight: 600 }}
                      interval={range === "week" ? 0 : 4}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 9 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, "Sales"]}
                      contentStyle={{
                        borderRadius: "0.75rem",
                        fontSize: "11px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#00BAF2"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peak Hours Footfall Chart */}
            <div className="paytm-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#002E6E]" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {t.sales.peakHours}
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">
                  8-11 AM & 6-9 PM Peak
                </span>
              </div>

              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.peak_hours} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 8, fontWeight: 600 }}
                      interval={1}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 8 }}
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip
                      formatter={(val: number, name: string) => [
                        name === "transactions" ? `${val} Customers` : `₹${val}`,
                        name === "transactions" ? "Footfall" : "Revenue",
                      ]}
                      contentStyle={{
                        borderRadius: "0.75rem",
                        fontSize: "11px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Bar
                      dataKey="transactions"
                      fill="#002E6E"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="paytm-card p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <PieIcon className="w-3.5 h-3.5 text-[#00BAF2]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t.sales.categories}
                </h3>
              </div>

              <div className="space-y-3">
                {data.category_breakdown.map((cat, idx) => {
                  const colors = [
                    "bg-[#00BAF2]",
                    "bg-[#002E6E]",
                    "bg-emerald-500",
                    "bg-amber-500",
                    "bg-purple-500",
                    "bg-rose-500",
                  ];
                  const barColor = colors[idx % colors.length];

                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px]">{cat.units} units</span>
                          <span className="font-extrabold text-slate-900">
                            ₹{cat.revenue.toLocaleString("en-IN")} ({cat.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${Math.min(100, cat.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      <Navigation currentLang={lang} />
    </div>
  );
}
