"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import ProGateCard from "@/components/ProGateCard";
import { apiRequest, authStorage, Merchant } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import {
  Wallet,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Building2,
  Zap,
  Users,
  Package,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface FinanceSummary {
  range: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  expenses_total: number;
  expenses_by_category: Record<string, number>;
  net_profit: number;
  net_margin_pct: number;
  cash_flow_series: Array<{
    date: string;
    raw_date: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
}

interface FinanceExplainResponse {
  summary_text: string;
  sentences: string[];
  language: string;
}

export default function FinancePage() {
  const [lang, setLang] = useState<Language>("hi");
  const [range, setRange] = useState<"week" | "month">("month");
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [explainData, setExplainData] = useState<FinanceExplainResponse | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    setLang(authStorage.getLanguage());
    setMerchant(authStorage.getMerchant());
  }, []);

  const isPro = merchant?.plan?.toLowerCase() === "pro";

  useEffect(() => {
    loadFinance();
  }, [range]);

  const loadFinance = async () => {
    setLoading(true);
    setError(null);
    setExplainData(null);
    try {
      const res = await apiRequest<FinanceSummary>(`/finance/summary?range=${range}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load financial records");
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const res = await apiRequest<FinanceExplainResponse>("/finance/explain", {
        method: "POST",
        body: JSON.stringify({ range, language: lang }),
      });
      setExplainData(res);
    } catch (err: any) {
      alert("Failed to generate finance explanation: " + err.message);
    } finally {
      setExplaining(false);
    }
  };

  const handleSpeech = () => {
    if (!explainData || typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = explainData.summary_text;
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
    utterance.lang = langCode;
    utterance.rate = 0.95;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(langCode.slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const t = translations[lang];

  return (
    <div className="flex-1 flex flex-col justify-between">
      <Header currentLang={lang} onLanguageChange={(l) => { setLang(l); authStorage.setLanguage(l); }} />

      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar pb-8">
        {/* Title & Range Switcher */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {t.finance.title}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === "en" ? "Cash-flow, expenses & net margin" : "नकद प्रवाह, खर्चे व शुद्ध मुनाफा"}
            </p>
          </div>

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
          <div className="space-y-3">
            <div className="h-32 rounded-2xl bg-white animate-pulse" />
            <div className="h-44 rounded-2xl bg-white animate-pulse" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-red-800">{error}</p>
            <button
              onClick={loadFinance}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Net Profit Star Card */}
            <div className="paytm-card p-5 bg-gradient-to-br from-[#002E6E] to-[#041c42] text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                  {t.finance.netProfit}
                </span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-[#00E0D6]/20 text-[#00E0D6]">
                  {data.net_margin_pct}% Net Margin
                </span>
              </div>

              <div className="text-3xl font-black mt-2 tracking-tight text-white">
                ₹{data.net_profit.toLocaleString("en-IN")}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-sky-200/80">{t.finance.revenue}</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    ₹{data.revenue.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-sky-200/80">{t.finance.cogs}</span>
                  <p className="text-sm font-bold text-rose-300 mt-0.5">
                    -₹{data.cogs.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Plain-Language Explainer Trigger or Pro Gate */}
            {!isPro ? (
              <ProGateCard
                featureTitle={lang === "en" ? "AI Plain-Language Finance Explainer" : "एआई वित्तीय सलाहकार व ऑडियो रिपोर्ट"}
                featureDesc={lang === "en" ? "Unlock 3-5 sentence plain-language breakdown of revenue, product cost, overhead, and vernacular voice playback." : "दुकान की कुल कमाई, माल लागत, overhead और मुनाफे का आसान हिंदी/मराठी में विश्लेषण व ऑडियो रिपोर्ट।"}
                benefits={[
                  "Code-computed exact financials with zero hallucination",
                  "Plain-language 3 to 5 sentence business diagnosis",
                  "Vernacular voice read-aloud via Web Speech API"
                ]}
                lang={lang}
                onUnlocked={() => {
                  const m = authStorage.getMerchant();
                  setMerchant(m);
                  loadFinance();
                }}
              />
            ) : (
              <div className="paytm-card p-4 border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-sky-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-purple-950">
                        {lang === "en" ? "AI Financial Advisor" : "AI वित्तीय सारांश"}
                      </h3>
                      <p className="text-[10px] text-purple-700">
                        {lang === "en" ? "Plain-language walkthrough in your mother tongue" : "सरल आम बोलचाल की भाषा में व्याख्या"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleExplain}
                    disabled={explaining}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow transition flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {explaining ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t.finance.explainBtn}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Explainer Box */}
                {explainData && (
                  <div className="mt-3 pt-3 border-t border-purple-100 space-y-2">
                    <div className="space-y-1.5">
                      {explainData.sentences.map((sentence, idx) => (
                        <p key={idx} className="text-xs text-slate-800 leading-relaxed font-medium">
                          • {sentence}
                        </p>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSpeech}
                        className="px-3 py-1 rounded-lg bg-white border border-purple-200 text-purple-800 text-[11px] font-bold flex items-center gap-1.5 hover:bg-purple-50 active:scale-95 transition"
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                            <span>Stop Voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                            <span>{t.finance.readAloud}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Operating Expenses Breakdown */}
            <div className="paytm-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {t.finance.expenses}
                  </h3>
                </div>
                <span className="text-xs font-black text-rose-600">
                  ₹{data.expenses_total.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.expenses_by_category).map(([cat, amt]) => {
                  return (
                    <div
                      key={cat}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {cat}
                        </span>
                        <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                          ₹{amt.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                        {cat.toLowerCase().includes("rent") ? (
                          <Building2 className="w-3.5 h-3.5" />
                        ) : cat.toLowerCase().includes("elec") ? (
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                        ) : cat.toLowerCase().includes("sal") ? (
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-[#00BAF2]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Cash Flow Inflow vs Outflow Chart */}
            <div className="paytm-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Cash Flow (Sales Inflow vs Expenses Outflow)
                </h3>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.cash_flow_series}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 8, fontWeight: 600 }}
                      interval={range === "week" ? 0 : 4}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 8 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: number, name: string) => [
                        `₹${val.toLocaleString("en-IN")}`,
                        name === "inflow" ? "Sales Inflow" : "Outflow",
                      ]}
                      contentStyle={{
                        borderRadius: "0.75rem",
                        fontSize: "11px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Bar dataKey="inflow" fill="#00BAF2" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="outflow" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </main>

      <Navigation currentLang={lang} />
    </div>
  );
}
