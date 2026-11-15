"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { apiRequest, authStorage } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  Award,
  AlertCircle,
  Calendar,
  Clock,
  PieChart as PieIcon,
  Search,
  Filter,
  Download,
  QrCode,
  Volume2,
  CreditCard,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
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

interface TransactionDetail {
  id: number;
  ts: string;
  amount: number;
  payment_mode: string;
  customer_id: number | null;
  customer_name: string;
  customer_phone: string | null;
  items_count: number;
  items: Array<{ name: string; qty: number; price: number; category: string }>;
  status: string;
}

interface TransactionsResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  transactions: TransactionDetail[];
}

export default function SalesPage() {
  const [lang, setLang] = useState<Language>("hi");
  const [range, setRange] = useState<"week" | "month">("week");
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transactions table state
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    setLang(authStorage.getLanguage());
  }, []);

  useEffect(() => {
    fetchSales();
  }, [range]);

  useEffect(() => {
    fetchTransactions();
  }, [page, paymentModeFilter, searchQuery]);

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<SalesData>(`/sales?range=${range}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load sales data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      let url = `/sales/transactions?page=${page}&limit=25`;
      if (paymentModeFilter !== "all") url += `&payment_mode=${encodeURIComponent(paymentModeFilter)}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      const res = await apiRequest<TransactionsResponse>(url);
      setTransactions(res.transactions || []);
      setTxTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch {
      // fallback
    } finally {
      setTxLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!transactions.length) return;
    const headers = ["Transaction ID", "Date Time (IST)", "Customer", "Amount (INR)", "Payment Mode", "Status", "Items Count"];
    const rows = transactions.map((t) => [
      t.id,
      new Date(t.ts).toLocaleString("en-IN"),
      `"${t.customer_name}"`,
      t.amount,
      `"${t.payment_mode}"`,
      t.status,
      t.items_count,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VentureAI_Transactions_${range}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentIcon = (mode: string) => {
    const m = mode.toLowerCase();
    if (m.includes("soundbox")) return <Volume2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (m.includes("qr") || m.includes("upi")) return <QrCode className="w-3.5 h-3.5 text-[#00BAF2]" />;
    if (m.includes("card")) return <CreditCard className="w-3.5 h-3.5 text-indigo-500" />;
    if (m.includes("wallet")) return <Wallet className="w-3.5 h-3.5 text-amber-500" />;
    return <Receipt className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <AppLayout activePageTitle="Sales & Transactions">
      <div className="space-y-6">
        {/* Top Header & Range Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Sales Performance & Reconciled Transactions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero-leakage checkout stream powered by Paytm Soundbox and UPI
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
                Past 7 Days
              </button>
              <button
                onClick={() => setRange("month")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  range === "month"
                    ? "bg-[#00BAF2] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Past 30 Days
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
              title="Download CSV of Transactions"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Performance Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Total Sales Turnover</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              ₹{data ? data.total_sales.toLocaleString("en-IN") : "—"}
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">
              100% Paytm verified
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Total Checkouts</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {data ? data.total_transactions.toLocaleString("en-IN") : "—"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Recorded in counter ledger
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Average Basket (ATV)</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              ₹{data ? data.average_order_value.toFixed(0) : "—"}
            </p>
            <p className="text-[10px] text-sky-600 font-semibold mt-1">
              Per customer receipt
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Best Performing Day</span>
            <p className="text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {data?.best_day.date} ({data?.best_day.day})
            </p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">
              ₹{data?.best_day.sales.toLocaleString("en-IN")} generated
            </p>
          </div>
        </div>

        {/* Visual Charts: Sales Trajectory & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area Chart (2 Cols) */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
              Daily Revenue Trend ({range === "week" ? "7 Days" : "30 Days"})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Real-time checkout volume graph with daily totals
            </p>

            <div className="h-64 w-full">
              {data?.sales_series ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.sales_series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00BAF2" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00BAF2" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
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
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#00BAF2"
                      strokeWidth={2.5}
                      fill="url(#salesGrad2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading sales graph...
                </div>
              )}
            </div>
          </div>

          {/* Category Revenue Breakdown */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
                Category Revenue Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Share of grocery and counter staples
              </p>

              <div className="space-y-3">
                {data?.category_breakdown?.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cat.category}</span>
                      <span className="font-mono text-slate-500">
                        ₹{cat.revenue.toLocaleString("en-IN")} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00BAF2] to-[#00E0D6] rounded-full"
                        style={{ width: `${Math.min(100, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              💡 Staples & Dairy represent the strongest daily cash-flow drivers.
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COMPREHENSIVE TRANSACTION HISTORY TABLE                      */}
        {/* ============================================================ */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Table Controls (Search & Filter) */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Detailed Transaction History ({txTotal.toLocaleString("en-IN")} records)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited Paytm Soundbox and QR digital records
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search customer, ID..."
                  className="w-48 sm:w-56 bg-white dark:bg-slate-900 text-xs px-3 py-1.5 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#00BAF2]/30"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Payment Mode Filter */}
              <select
                value={paymentModeFilter}
                onChange={(e) => {
                  setPaymentModeFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-white dark:bg-slate-900 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Modes</option>
                <option value="Soundbox">Paytm Soundbox</option>
                <option value="QR">Paytm QR Code</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Wallet">Paytm Wallet</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tx ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#00BAF2]">
                        #TX-{tx.id}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {new Date(tx.ts).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {tx.customer_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {tx.items.length > 0
                          ? tx.items.map((i) => `${i.name} (x${i.qty})`).join(", ")
                          : "General Store Items"}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white font-mono">
                        ₹{tx.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950 text-[#00BAF2] border border-sky-100 dark:border-sky-900">
                          {getPaymentIcon(tx.payment_mode)}
                          <span>{tx.payment_mode}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{tx.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                      {txLoading ? "Loading transactions..." : "No matching transactions found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {page} of {totalPages} ({txTotal} total transactions)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
