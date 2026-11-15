"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { apiRequest, authStorage } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  Users,
  UserCheck,
  UserX,
  Sparkles,
  Search,
  Send,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  BadgeIndianRupee,
  ShoppingBag,
  Calendar,
  Lock,
  Phone,
  Filter,
} from "lucide-react";

interface CustomerItem {
  id: number;
  name: string;
  phone_masked: string;
  first_seen: string;
  recency_days: number;
  visit_count: number;
  total_spend: number;
  avg_bill: number;
  segment: "Regular" | "Occasional" | "At-risk";
}

interface SegmentSummary {
  segment: string;
  count: number;
  percentage: number;
}

interface CustomerSegmentsResponse {
  summary: SegmentSummary[];
  customers: CustomerItem[];
}

export default function CustomersPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("hi");
  const [data, setData] = useState<CustomerSegmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSegment, setActiveSegment] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLang(authStorage.getLanguage());
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<CustomerSegmentsResponse>("/customers/segments");
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load customer profiles");
    } finally {
      setLoading(false);
    }
  };

  const customersList = data?.customers || [];
  const totalCustomers = customersList.length;

  const regularCount = customersList.filter((c) => c.segment === "Regular").length;
  const occasionalCount = customersList.filter((c) => c.segment === "Occasional").length;
  const atRiskCount = customersList.filter((c) => c.segment === "At-risk").length;
  const repeatRate = totalCustomers > 0 ? Math.round((regularCount / totalCustomers) * 100) : 0;
  const avgCLV = totalCustomers > 0 ? Math.round(customersList.reduce((acc, c) => acc + c.total_spend, 0) / totalCustomers) : 0;

  const filteredCustomers = customersList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone_masked.includes(search);
    const matchesSeg = activeSegment === "all" || c.segment === activeSegment;
    return matchesSearch && matchesSeg;
  });

  const getSegmentBadge = (seg: string) => {
    switch (seg) {
      case "Regular":
        return "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "At-risk":
        return "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800";
      default:
        return "bg-sky-100 dark:bg-sky-950 text-[#00BAF2] border-sky-200 dark:border-sky-800";
    }
  };

  return (
    <AppLayout activePageTitle="Customer Intelligence">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Customer RFM Intelligence & Retention
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Privacy-safe customer habit analytics derived from daily counter checkouts
            </p>
          </div>

          <Link
            href="/marketing"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00BAF2] hover:bg-[#0099cc] text-white text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition self-start sm:self-auto"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Launch WhatsApp Campaign</span>
          </Link>
        </div>

        {/* AI Retention Opportunity Banner */}
        {atRiskCount > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 dark:from-slate-900 dark:to-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  ⚠️
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Customer Retention Alert: {atRiskCount} Inactive Regular Shoppers Detected
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl">
                Your repeat customer rate has decreased this month. {atRiskCount} customers who used to visit 4+ times monthly haven&apos;t visited in over 21 days.
              </p>
            </div>

            <Link
              href="/marketing?segment=at_risk&goal=win_back"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition shadow-sm active:scale-95"
            >
              <span>Draft Win-Back Offer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* 4 Customer Intelligence Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Total Tracked Customers</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {totalCustomers} Profiles
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Encrypted phone identities</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Repeat Shopper Ratio</span>
            <p className="text-xl lg:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
              {repeatRate}%
            </p>
            <p className="text-[10px] text-slate-400 mt-1">{regularCount} loyal recurring families</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Customer Lifetime Value (CLV)</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              ₹{avgCLV.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-sky-600 font-semibold mt-1">Average cumulative spend</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">At-Risk Churn Count</span>
            <p className="text-xl lg:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight mt-1">
              {atRiskCount} Shoppers
            </p>
            <p className="text-[10px] text-rose-500 font-semibold mt-1">Paused visits for 21+ days</p>
          </div>
        </div>

        {/* RFM Segmentation Pills Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSegment("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSegment === "all"
                ? "bg-[#00BAF2] text-white shadow-sm"
                : "bg-white dark:bg-[#0c1324] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            }`}
          >
            All Customers ({totalCustomers})
          </button>
          <button
            onClick={() => setActiveSegment("Regular")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSegment === "Regular"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white dark:bg-[#0c1324] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            }`}
          >
            Regular Loyalists ({regularCount})
          </button>
          <button
            onClick={() => setActiveSegment("Occasional")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSegment === "Occasional"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-white dark:bg-[#0c1324] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            }`}
          >
            Occasional Buyers ({occasionalCount})
          </button>
          <button
            onClick={() => setActiveSegment("At-risk")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSegment === "At-risk"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-white dark:bg-[#0c1324] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            }`}
          >
            At-Risk Churn ({atRiskCount})
          </button>
        </div>

        {/* Customer Directory Table */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name or phone suffix..."
                className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#00BAF2]/30"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Customer phone privacy protected (Masked KYC Standard)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Masked Mobile</th>
                  <th className="py-3 px-4">Total Visits</th>
                  <th className="py-3 px-4">Lifetime Spend</th>
                  <th className="py-3 px-4">Average Bill</th>
                  <th className="py-3 px-4">Last Visit</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{c.phone_masked}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">{c.visit_count} checkouts</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      ₹{c.total_spend.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-mono">₹{c.avg_bill.toFixed(0)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={
                          c.recency_days >= 21
                            ? "text-rose-600 font-bold"
                            : "text-slate-600 dark:text-slate-300"
                        }
                      >
                        {c.recency_days === 0
                          ? "Today"
                          : c.recency_days === 1
                          ? "Yesterday"
                          : `${c.recency_days} days ago`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSegmentBadge(
                          c.segment
                        )}`}
                      >
                        {c.segment}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/marketing?segment=${c.segment.toLowerCase()}&customer=${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-[#00BAF2] hover:bg-[#00BAF2] hover:text-white font-bold text-[11px] transition"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Offer</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
