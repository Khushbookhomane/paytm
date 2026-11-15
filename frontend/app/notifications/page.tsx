"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { apiRequest } from "@/lib/api";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Award,
  CheckCircle2,
  Check,
  ArrowRight,
  Filter,
  Trash2,
  Clock,
  Layers,
} from "lucide-react";

interface AlertItem {
  id: string;
  title: string;
  severity: "critical" | "warning" | "opportunity" | "milestone";
  category: string;
  explanation: string;
  recommended_action: string;
  action_url: string;
  action_label: string;
  date: string;
  read: boolean;
  metric?: string;
}

interface NotificationsResponse {
  unread_count: number;
  total_count: number;
  alerts: AlertItem[];
}

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, unreadOnly]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let url = `/notifications?unread_only=${unreadOnly}`;
      if (severityFilter !== "all") url += `&severity=${severityFilter}`;
      const res = await apiRequest<NotificationsResponse>(url);
      setAlerts(res.alerts || []);
      setUnreadCount(res.unread_count || 0);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await apiRequest(`/notifications/${alertId}/read`, { method: "POST" });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // fallback
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest("/notifications/read-all", { method: "POST" });
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      setUnreadCount(0);
    } catch {
      // fallback
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
          icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
          label: "Critical Alert",
        };
      case "warning":
        return {
          bg: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
          icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
          label: "Warning",
        };
      case "opportunity":
        return {
          bg: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
          icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
          label: "Growth Opportunity",
        };
      case "milestone":
        return {
          bg: "bg-sky-100 dark:bg-sky-950 text-[#00BAF2] border-sky-200 dark:border-sky-800",
          icon: <Award className="w-4 h-4 text-[#00BAF2]" />,
          label: "Store Milestone",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-700",
          icon: <Bell className="w-4 h-4 text-slate-500" />,
          label: "Notification",
        };
    }
  };

  return (
    <AppLayout activePageTitle="Proactive AI Alerts">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Intelligent Proactive Alerts Center
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Autonomous background alerts monitoring inventory stockouts, revenue anomalies, and customer churn
            </p>
          </div>

          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition self-start sm:self-auto"
          >
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Mark All as Read</span>
          </button>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Alerts" },
            { id: "critical", label: "Critical" },
            { id: "warning", label: "Warnings" },
            { id: "opportunity", label: "Opportunities" },
            { id: "milestone", label: "Milestones" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSeverityFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                severityFilter === f.id
                  ? "bg-[#00BAF2] text-white shadow-sm"
                  : "bg-white dark:bg-[#0c1324] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              unreadOnly
                ? "bg-[#002E6E] text-white border-[#002E6E]"
                : "bg-white dark:bg-[#0c1324] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
            }`}
          >
            {unreadOnly ? "Showing Unread Only" : "Filter Unread Only"}
          </button>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const badge = getSeverityBadge(alert.severity);
              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl p-4 lg:p-5 border transition-all ${
                    alert.read
                      ? "bg-white dark:bg-[#0c1324] border-slate-200/80 dark:border-slate-800 opacity-80 hover:opacity-100"
                      : "bg-slate-50/80 dark:bg-slate-900/90 border-[#00BAF2]/40 ring-1 ring-[#00BAF2]/20 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700 shrink-0 mt-0.5">
                        {badge.icon}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          {!alert.read && (
                            <span className="w-2 h-2 rounded-full bg-[#00BAF2]"></span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {alert.date}
                          </span>
                          {alert.metric && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                              {alert.metric}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {alert.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                          {alert.explanation}
                        </p>

                        <div className="pt-2 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="text-[#00BAF2]">💡 Recommended Step:</span>
                          <span>{alert.recommended_action}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 self-end sm:self-auto">
                      <Link
                        href={alert.action_url}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00BAF2] hover:bg-[#0099cc] text-white text-xs font-bold shadow-sm transition active:scale-95"
                      >
                        <span>{alert.action_label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {!alert.read && (
                        <button
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                All Clear! Zero Unresolved Alerts
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your store operations are running smoothly. VentureAI will proactively notify you if low stock or sales anomalies are detected.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
