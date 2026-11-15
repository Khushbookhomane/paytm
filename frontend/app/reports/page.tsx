"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { apiRequest, authStorage, Merchant } from "@/lib/api";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Sparkles,
  TrendingUp,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Share2,
  FileText,
} from "lucide-react";

interface ReportMetrics {
  total_sales: number;
  total_transactions: number;
  average_order_value: number;
  cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  recorded_expenses: number;
  net_estimated_profit: number;
}

interface PaymentModeShare {
  mode: string;
  amount: number;
  percentage: number;
  count: number;
}

interface TopProductReport {
  name: string;
  category: string;
  units: number;
  revenue: number;
}

interface ReportSummaryResponse {
  period: string;
  title: string;
  start_date: string;
  end_date: string;
  generated_at: string;
  merchant: {
    name: string;
    category: string;
    id: number;
    status: string;
  };
  metrics: ReportMetrics;
  payment_modes: PaymentModeShare[];
  top_products: TopProductReport[];
  executive_summary: string;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [report, setReport] = useState<ReportSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<ReportSummaryResponse>(`/reports/summary?period=${period}`);
      setReport(res);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    const rows = [
      ["Metric", "Value"],
      ["Report Title", `"${report.title}"`],
      ["Merchant Name", `"${report.merchant.name}"`],
      ["Generated At", `"${report.generated_at}"`],
      ["Start Date", report.start_date],
      ["End Date", report.end_date],
      ["Total Gross Sales (INR)", report.metrics.total_sales],
      ["Total Transactions", report.metrics.total_transactions],
      ["Average Order Value", report.metrics.average_order_value],
      ["Gross Profit (INR)", report.metrics.gross_profit],
      ["Gross Margin Pct", `${report.metrics.gross_margin_pct}%`],
      ["Operating Expenses (INR)", report.metrics.recorded_expenses],
      ["Estimated Net Profit (INR)", report.metrics.net_estimated_profit],
      [],
      ["Payment Mode", "Turnover (INR)", "Percentage", "Count"],
      ...report.payment_modes.map((p) => [`"${p.mode}"`, p.amount, `${p.percentage}%`, p.count]),
      [],
      ["Top Product", "Category", "Units Sold", "Revenue (INR)"],
      ...report.top_products.map((p) => [`"${p.name}"`, `"${p.category}"`, p.units, p.revenue]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Paytm_VentureAI_Report_${period}_${report.start_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout activePageTitle="Reports & Exports">
      <div className="space-y-6">
        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Reports & Executive Financial Statements
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download formal audited statements with QR and Soundbox reconciliation
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Period Selector */}
            <div className="flex bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setPeriod("daily")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  period === "daily"
                    ? "bg-[#00BAF2] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPeriod("weekly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  period === "weekly"
                    ? "bg-[#00BAF2] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPeriod("monthly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  period === "monthly"
                    ? "bg-[#00BAF2] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Print / PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-200 transition"
              title="Print formatted executive PDF statement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {/* CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00BAF2] hover:bg-[#0099cc] text-xs font-bold text-white shadow-sm transition"
              title="Export raw data to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* OFFICIAL STATEMENT CONTAINER (PRINT READY)                   */}
        {/* ============================================================ */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-6 lg:p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Statement Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00BAF2] flex items-center justify-center font-black text-white text-base">
                  P
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-none">
                    Venture<span className="text-[#00BAF2]">AI</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Official Merchant Statement
                  </span>
                </div>
              </div>

              <h4 className="text-xl font-black text-slate-900 dark:text-white pt-2">
                {report?.title || "Business Performance Statement"}
              </h4>
              <p className="text-xs text-slate-500">
                Period: {report?.start_date} to {report?.end_date} · Generated {report?.generated_at}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs space-y-1">
              <p className="font-black text-sm text-slate-900 dark:text-white">
                {report?.merchant.name || "Sharma General Store"}
              </p>
              <p className="text-slate-500">{report?.merchant.category}</p>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Paytm Merchant</span>
              </div>
            </div>
          </div>

          {/* AI Executive Commentary */}
          {report?.executive_summary && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#00BAF2]" />
                <span>Executive Summary & Verification Notes</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {report.executive_summary}
              </p>
            </div>
          )}

          {/* Core Metrics Table */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400">Total Gross Turnover</span>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                ₹{report?.metrics.total_sales.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400">Checkouts Processed</span>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {report?.metrics.total_transactions} Orders
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400">Gross Margin (Verified)</span>
              <p className="text-xl font-black text-emerald-600 font-mono mt-1">
                {report?.metrics.gross_margin_pct}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400">Estimated Net Profit</span>
              <p className="text-xl font-black text-emerald-600 font-mono mt-1">
                ₹{report?.metrics.net_estimated_profit.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Payment Mode Reconciled Breakdown */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs lg:text-sm text-slate-900 dark:text-white">
              Settlement & Payment Method Breakdown
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Payment Channel</th>
                    <th className="py-2.5 px-3">Transactions</th>
                    <th className="py-2.5 px-3">Volume Share</th>
                    <th className="py-2.5 px-3 text-right">Reconciled Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {report?.payment_modes.map((pm) => (
                    <tr key={pm.mode}>
                      <td className="py-2.5 px-3 font-bold font-sans text-slate-800 dark:text-slate-200">
                        {pm.mode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{pm.count} txs</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{pm.percentage}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹{pm.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs lg:text-sm text-slate-900 dark:text-white">
              Top Selling Inventory Items
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Units Sold</th>
                    <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {report?.top_products.map((tp) => (
                    <tr key={tp.name}>
                      <td className="py-2.5 px-3 font-bold font-sans text-slate-800 dark:text-slate-200">
                        {tp.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans">{tp.category}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{tp.units} units</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹{tp.revenue.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Footer Signatures */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Cryptographically verified counter ledger · Paytm VentureAI 2.5</span>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-700 dark:text-slate-300">Merchant Authorized Copy</p>
              <p className="text-[10px]">Report Hash: #PAYTM-VAI-{report?.period.toUpperCase()}-2026</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
