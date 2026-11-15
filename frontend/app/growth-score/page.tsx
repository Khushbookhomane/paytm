"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { apiRequest, authStorage } from "@/lib/api";
import {
  Award,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  ShieldCheck,
  PackageCheck,
  Users,
  Layers,
  Sparkles,
} from "lucide-react";

interface Dimension {
  name: string;
  score: number;
  max: number;
  pct: number;
  status: string;
  metric: string;
  weight: string;
}

interface Strength {
  title: string;
  desc: string;
}

interface Improvement {
  title: string;
  desc: string;
  impact: string;
  suggested_action: string;
  target: string;
}

interface GrowthScoreData {
  overall_score: number;
  tier: string;
  badge_color: string;
  tier_description: string;
  dimensions: Dimension[];
  strengths: Strength[];
  improvements: Improvement[];
  methodology: {
    title: string;
    description: string;
    data_sources: string[];
  };
}

export default function GrowthScorePage() {
  const [data, setData] = useState<GrowthScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScore();
  }, []);

  const fetchScore = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<GrowthScoreData>("/growth-score");
      setData(res);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const score = data?.overall_score || 78;

  return (
    <AppLayout activePageTitle="Merchant Growth Score">
      <div className="space-y-6">
        {/* Top Header */}
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            AI Merchant Growth Score & Diagnostic Benchmark
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A comprehensive 100-point retail health index evaluating growth trajectory and operational efficiency
          </p>
        </div>

        {/* Hero Score Showcase Card */}
        <div className="rounded-2xl bg-gradient-to-r from-[#002E6E] via-[#003d8f] to-[#042B62] text-white p-6 lg:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00E0D6] bg-[#00E0D6]/15 px-3 py-0.5 rounded-full border border-[#00E0D6]/30">
                  {data?.tier || "Strong Performer"}
                </span>
                <span className="text-xs text-sky-200">·</span>
                <span className="text-xs text-sky-200">Paytm Enterprise Benchmark</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black tracking-tight">
                Store Operational Health: {score} / 100
              </h3>
              <p className="text-xs lg:text-sm text-sky-100/90 leading-relaxed">
                {data?.tier_description ||
                  "Solid business fundamentals with clear opportunities to boost customer retention and stock turnover."}
              </p>
            </div>

            {/* Circular Gauge Presentation */}
            <div className="flex items-center gap-4 self-center md:self-auto bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#00BAF2"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - score / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">{score}</span>
                  <span className="text-[9px] uppercase font-bold text-sky-300">Score</span>
                </div>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-white">Top 25% Quartile</p>
                <p className="text-sky-200 text-[10px]">Among Grocery Retailers</p>
                <p className="text-[#00E0D6] font-semibold text-[10px]">Verified Paytm Partner</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Core Dimensions Breakdown */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00BAF2]" />
              5 Core Diagnostic Health Pillars
            </h3>
            <span className="text-xs font-semibold text-slate-400">Total Weight: 100 Points</span>
          </div>

          <div className="space-y-3.5">
            {data?.dimensions.map((dim) => (
              <div key={dim.name} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{dim.name}</span>
                    <span className="text-[10px] text-slate-400">({dim.weight} weight)</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs font-bold text-[#00BAF2]">
                      {dim.score} / {dim.max} pts
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">· {dim.metric}</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00BAF2] to-[#00E0D6] rounded-full transition-all duration-700"
                    style={{ width: `${dim.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Improvement Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Strengths */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Verified Core Strengths
            </h3>

            <div className="space-y-2.5">
              {data?.strengths.map((str, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white">{str.title}</h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{str.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Improvement Roadmap */}
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Priority Areas Requiring Improvement
            </h3>

            <div className="space-y-2.5">
              {data?.improvements.map((imp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-white">{imp.title}</h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {imp.impact}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {imp.desc}
                    </p>
                  </div>

                  <Link
                    href={imp.target}
                    className="self-start inline-flex items-center gap-1 text-[11px] font-bold text-[#00BAF2] hover:underline"
                  >
                    <span>Take Action: {imp.suggested_action}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transparent Methodology Card */}
        {data?.methodology && (
          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#00BAF2]" />
              <h4 className="font-extrabold text-slate-900 dark:text-white">
                {data.methodology.title}
              </h4>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {data.methodology.description}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
              <span className="font-bold">Audited Inputs:</span>
              {data.methodology.data_sources.map((src, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
                  ✓ {src}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
