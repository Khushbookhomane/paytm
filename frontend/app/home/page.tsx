"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { apiRequest, authStorage } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Package,
  Send,
  BarChart3,
  MessageSquare,
  QrCode,
  CreditCard,
  Banknote,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flame,
  UserMinus,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [activeRecIdx, setActiveRecIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedLang = authStorage.getLanguage();
    setLang(savedLang);

    fetchData(savedLang);
  }, []);

  const fetchData = async (targetLang: Language) => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, recsRes] = await Promise.all([
        apiRequest<DashboardData>("/dashboard"),
        apiRequest<RecommendationCard[]>(`/recommendations/today?language=${targetLang}`),
      ]);
      setData(dashRes);
      setRecommendations(recsRes);
    } catch (err: any) {
      setError(err.message || "Failed to load store dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    authStorage.setLanguage(newLang);
    fetchData(newLang);
  };

  const t = translations[lang];

  // Greeting by time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t.home.greetingMorning
      : hour < 17
      ? t.home.greetingAfternoon
      : t.home.greetingEvening;

  const nextRec = () => {
    setActiveRecIdx((prev) => (prev + 1) % recommendations.length);
  };
  const prevRec = () => {
    setActiveRecIdx((prev) => (prev - 1 + recommendations.length) % recommendations.length);
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} />

      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar pb-8">
        {/* Welcome greeting banner */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {greeting},
            </p>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sharma Ji 👋
            </h2>
          </div>
          <button
            onClick={() => router.push("/copilot")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F8FE] text-[#002E6E] text-xs font-bold border border-[#00BAF2]/30 shadow-sm active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00BAF2]" />
            <span>AI Copilot</span>
          </button>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="h-36 rounded-2xl bg-white animate-pulse p-4" />
            <div className="h-44 rounded-2xl bg-white animate-pulse p-4" />
            <div className="h-32 rounded-2xl bg-white animate-pulse p-4" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-red-800">{error}</p>
            <button
              onClick={() => fetchData(lang)}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl shadow"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loaded Data */}
        {!loading && data && (
          <>
            {/* Primary Today's Sales Card */}
            <div className="paytm-card p-5 relative overflow-hidden bg-gradient-to-br from-white to-[#f0f8ff] border border-[#00BAF2]/20">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t.home.todaySales}
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                    ₹{data.today_sales.toLocaleString("en-IN")}
                  </div>
                </div>

                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                    data.vs_yesterday_pct >= 0
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {data.vs_yesterday_pct >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {data.vs_yesterday_pct >= 0 ? "+" : ""}
                    {data.vs_yesterday_pct}% {t.home.vsYesterday}
                  </span>
                </div>
              </div>

              {/* Profit & Margin row */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">{t.home.profitEst}</span>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">
                    ₹{data.estimated_profit.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">{t.home.margin}</span>
                  <p className="text-sm font-bold text-[#002E6E] mt-0.5">
                    {data.margin_pct}%
                  </p>
                </div>
              </div>
            </div>

            {/* HERO CAROUSEL: "Today's Recommendations" (The star of the demo) */}
            {recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#00BAF2]" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {t.home.recommendationsHero}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500 mr-1">
                      {activeRecIdx + 1} / {recommendations.length}
                    </span>
                    <button
                      onClick={prevRec}
                      className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition"
                      aria-label="Previous recommendation"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={nextRec}
                      className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition"
                      aria-label="Next recommendation"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Active Carousel Card */}
                {(() => {
                  const card = recommendations[activeRecIdx];
                  const isLow = card.type === "low_stock";
                  const isSpike = card.type === "weekend_spike";
                  const isChurn = card.type === "churn_winback";

                  return (
                    <div className="paytm-card p-4 border border-[#00BAF2]/30 bg-gradient-to-br from-white via-white to-[#f0f9ff] shadow-lg relative overflow-hidden transition-all duration-300">
                      {/* Top Type Pill */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isLow
                              ? "bg-rose-100 text-rose-800"
                              : isSpike
                              ? "bg-orange-100 text-orange-800"
                              : isChurn
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-[#002E6E]"
                          }`}
                        >
                          {isLow ? (
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                          ) : isSpike ? (
                            <Flame className="w-3 h-3 text-orange-600" />
                          ) : isChurn ? (
                            <UserMinus className="w-3 h-3 text-purple-600" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-[#00BAF2]" />
                          )}
                          <span className="uppercase tracking-wider">
                            {card.type.replace("_", " ")}
                          </span>
                        </span>
                        <span className="w-2 h-2 rounded-full bg-[#00BAF2] animate-ping" />
                      </div>

                      {/* Card Title */}
                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {card.title}
                      </h4>

                      {/* Why with computed numbers */}
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                        {card.why}
                      </p>

                      {/* Suggested Action Bar with 1-Tap Execution Button */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500 line-clamp-1 pr-2">
                          💡 {card.suggested_action}
                        </span>

                        <button
                          onClick={() => router.push(card.button_target)}
                          className="px-3.5 py-2 rounded-xl bg-[#00BAF2] hover:bg-[#00a3d4] active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 shrink-0 transition"
                        >
                          <span>{card.button_text}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Carousel Pagination Dots */}
                <div className="flex justify-center gap-1.5 pt-1">
                  {recommendations.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveRecIdx(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === activeRecIdx
                          ? "w-6 bg-[#002E6E]"
                          : "w-1.5 bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                {t.home.quickActions}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => router.push("/inventory")}
                  className="paytm-card p-2.5 flex flex-col items-center text-center paytm-card-hover"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">
                    {t.home.restockAction}
                  </span>
                </button>

                <button
                  onClick={() => router.push("/marketing")}
                  className="paytm-card p-2.5 flex flex-col items-center text-center paytm-card-hover"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-1.5">
                    <Send className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">
                    {t.home.sendOfferAction}
                  </span>
                </button>

                <button
                  onClick={() => router.push("/finance")}
                  className="paytm-card p-2.5 flex flex-col items-center text-center paytm-card-hover"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">
                    {t.home.viewReportAction}
                  </span>
                </button>

                <button
                  onClick={() => router.push("/copilot")}
                  className="paytm-card p-2.5 flex flex-col items-center text-center paytm-card-hover"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#E8F8FE] text-[#00BAF2] flex items-center justify-center mb-1.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">
                    {t.home.askCopilotAction}
                  </span>
                </button>
              </div>
            </div>

            {/* 7-Day Mini Trend Chart */}
            <div className="paytm-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t.home.sevenDayTrend}
                </h3>
                <button
                  onClick={() => router.push("/sales")}
                  className="text-[11px] font-bold text-[#00BAF2] flex items-center gap-0.5 hover:underline"
                >
                  <span>{t.sales.title}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.seven_day_trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }}
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
                    <Bar
                      dataKey="sales"
                      fill="#00BAF2"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Mode Split */}
            <div className="paytm-card p-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                {t.home.upiShare} & Modes (30 Days)
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {data.payment_mode_split.map((item) => {
                  const isUpi = item.mode.toUpperCase() === "UPI";
                  const isCash = item.mode.toLowerCase() === "cash";
                  return (
                    <div
                      key={item.mode}
                      className={`p-3 rounded-xl border ${
                        isUpi
                          ? "bg-[#E8F8FE] border-[#00BAF2]/30 text-[#002E6E]"
                          : "bg-white border-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase">{item.mode}</span>
                        {isUpi ? (
                          <QrCode className="w-3.5 h-3.5 text-[#00BAF2]" />
                        ) : isCash ? (
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                      </div>
                      <div className="text-sm font-extrabold">{item.percentage}%</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        ₹{(item.amount / 1000).toFixed(1)}k
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 5 Products */}
            <div className="paytm-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t.home.topProducts}
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {data.top_5_products.map((item, idx) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">
                          {item.name}
                        </p>
                        <span className="text-[10px] text-slate-500">{item.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-900">
                        ₹{item.revenue.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {item.qty_sold} units
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <Navigation currentLang={lang} />
    </div>
  );
}
