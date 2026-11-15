"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { apiRequest, authStorage } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  WalletCards,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Info,
  BadgeIndianRupee,
  X,
} from "lucide-react";

interface FinanceSummary {
  range: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  expenses_total: number;
  net_profit: number;
  net_margin_pct: number;
}

interface ExpenseItem {
  id: number;
  category: string;
  amount: number;
  date: string;
}

interface FinanceExplainResponse {
  summary_text: string;
  sentences: string[];
  language: string;
  key_metrics: Record<string, any>;
}

export default function FinancePage() {
  const [lang, setLang] = useState<Language>("hi");
  const [range, setRange] = useState<"week" | "month">("month");
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [explanation, setExplanation] = useState<FinanceExplainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReadingAloud, setIsReadingAloud] = useState(false);

  // Add Expense Modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expCategory, setExpCategory] = useState("Shop Rent");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expSubmitting, setExpSubmitting] = useState(false);

  useEffect(() => {
    setLang(authStorage.getLanguage());
    loadFinanceData(range);
  }, [range]);

  const loadFinanceData = async (selectedRange: string) => {
    setLoading(true);
    try {
      const [sumRes, expRes, explainRes] = await Promise.all([
        apiRequest<FinanceSummary>(`/finance/summary?range=${selectedRange}`),
        apiRequest<ExpenseItem[]>("/finance/expenses"),
        apiRequest<FinanceExplainResponse>("/finance/explain", {
          method: "POST",
          body: JSON.stringify({ range: selectedRange, language: authStorage.getLanguage() }),
        }),
      ]);
      setSummary(sumRes);
      setExpenses(expRes || []);
      setExplanation(explainRes);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || parseFloat(expAmount) <= 0) return;
    setExpSubmitting(true);
    try {
      await apiRequest("/finance/expenses", {
        method: "POST",
        body: JSON.stringify({
          category: expCategory,
          amount: parseFloat(expAmount),
          date: expDate,
        }),
      });
      setShowAddExpense(false);
      setExpAmount("");
      loadFinanceData(range);
    } catch (err: any) {
      alert(err.message || "Failed to record expense");
    } finally {
      setExpSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm("Remove this recorded operating expense?")) return;
    try {
      await apiRequest(`/finance/expenses/${id}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      loadFinanceData(range);
    } catch (err: any) {
      alert(err.message || "Failed to delete expense");
    }
  };

  const toggleVoiceBrief = () => {
    if (!explanation?.summary_text) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech not supported in this browser.");
      return;
    }

    if (isReadingAloud) {
      window.speechSynthesis.cancel();
      setIsReadingAloud(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(explanation.summary_text);
      utterance.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
      utterance.onend = () => setIsReadingAloud(false);
      utterance.onerror = () => setIsReadingAloud(false);
      window.speechSynthesis.speak(utterance);
      setIsReadingAloud(true);
    }
  };

  return (
    <AppLayout activePageTitle="AI Financial Assistant">
      <div className="space-y-6">
        {/* Top Header & Range Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Financial Intelligence & Cash-Flow Telemetry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified sales turnover minus cost of goods and logged operating overheads
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setRange("week")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  range === "week"
                    ? "bg-[#00BAF2] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Weekly P&L
              </button>
              <button
                onClick={() => setRange("month")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  range === "month"
                    ? "bg-[#00BAF2] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Monthly P&L
              </button>
            </div>

            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#002E6E] hover:bg-[#003d8f] text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {/* Regulatory Governance & Transparency Disclaimer */}
        <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#00BAF2] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-900 dark:text-white">Financial Transparency Note:</strong> Gross Revenue and Cost of Goods Sold (COGS) are verified directly from audited counter transactions. Net profit figures incorporate merchant-logged expenses and standard utility estimates. Paytm VentureAI never initiates payments, transfers, or credit actions without explicit authorization.
          </p>
        </div>

        {/* High-Level P&L Financial Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Gross Turnover (Verified)</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 font-mono">
              ₹{summary ? summary.revenue.toLocaleString("en-IN") : "—"}
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">From daily counter sales</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Cost of Goods (COGS)</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 font-mono">
              ₹{summary ? summary.cogs.toLocaleString("en-IN") : "—"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Wholesale supplier costs</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Operating Expenses</span>
            <p className="text-xl lg:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight mt-1 font-mono">
              ₹{summary ? summary.expenses_total.toLocaleString("en-IN") : "—"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Rent, electricity, wages</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Estimated Net Profit</span>
            <p className="text-xl lg:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 font-mono">
              ₹{summary ? summary.net_profit.toLocaleString("en-IN") : "—"}
            </p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">
              {summary?.net_margin_pct || 18.5}% net margin
            </p>
          </div>
        </div>

        {/* AI Financial Voice Explanation Box */}
        {explanation && (
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#00BAF2] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  AI Financial Analysis Brief
                </h3>
              </div>

              <button
                onClick={toggleVoiceBrief}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-200 transition"
              >
                {isReadingAloud ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#00BAF2]" />
                    <span>Read Voice Brief</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs lg:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {explanation.summary_text}
            </p>
          </div>
        )}

        {/* Operating Expenses Log & Upcoming Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Expenses Log (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <h3 className="font-extrabold text-xs lg:text-sm text-slate-900 dark:text-white">
                  Logged Store Expenses
                </h3>
                <p className="text-[10px] text-slate-400">Actual operating overheads deducted from gross margins</p>
              </div>
              <button
                onClick={() => setShowAddExpense(true)}
                className="text-xs font-bold text-[#00BAF2] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Expense
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.length > 0 ? (
                expenses.map((exp) => (
                  <div key={exp.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{exp.category}</p>
                      <p className="text-[10px] text-slate-400">{exp.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ₹{exp.amount.toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No expenses recorded yet. Tap &apos;Record Expense&apos; to log rent, electricity, etc.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Fixed Expense Reminders (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs lg:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Upcoming Fixed Expense Reminders
              </h3>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Commercial Store Lease (Rent)</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">₹18,000</span>
                </div>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                  Due in 5 days · Ensure cash buffer
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Commercial Electricity Bill</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">₹3,400</span>
                </div>
                <p className="text-[10px] text-slate-400">Due on 20th of this month</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">FMCG Supplier Invoice Settlement</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">₹12,500</span>
                </div>
                <p className="text-[10px] text-slate-400">Due next Monday</p>
              </div>
            </div>
          </div>
        </div>

        {/* Record Expense Modal */}
        {showAddExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0c1324] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Record Store Operating Expense
                </h3>
                <button onClick={() => setShowAddExpense(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Expense Category
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
                  >
                    <option value="Shop Rent">Shop Rent</option>
                    <option value="Electricity / Utilities">Electricity / Utilities</option>
                    <option value="Staff Wages">Staff Wages</option>
                    <option value="Transportation / Logistics">Transportation / Logistics</option>
                    <option value="Packaging & Bags">Packaging & Bags</option>
                    <option value="Maintenance / Repairs">Maintenance / Repairs</option>
                    <option value="Miscellaneous Overhead">Miscellaneous Overhead</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={expSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#00BAF2] text-white font-bold"
                  >
                    {expSubmitting ? "Saving..." : "Save Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
