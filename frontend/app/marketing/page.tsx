"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { apiRequest, authStorage, Merchant } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  Megaphone,
  Sparkles,
  Send,
  Copy,
  Check,
  Calendar,
  Users,
  Tag,
  Share2,
  Smartphone,
  Eye,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ShoppingBag,
} from "lucide-react";

interface CampaignItem {
  id: number;
  title: string;
  target_segment: string;
  channel: string;
  content: string;
  offer_code?: string;
  discount_pct?: number;
  status: "draft" | "approved" | "sent";
  sent_at?: string;
  metrics?: { delivered?: number; read?: number; redeemed?: number; revenue_generated?: number };
}

function MarketingContent() {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Language>("hi");
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  // Form State
  const [targetSegment, setTargetSegment] = useState<string>("at_risk");
  const [campaignGoal, setCampaignGoal] = useState<string>("win_back");
  const [campaignLang, setCampaignLang] = useState<string>("hi");
  const [discountPct, setDiscountPct] = useState<number>(10);
  const [productFocus, setProductFocus] = useState<string>("Basmati Rice & Cooking Oil");

  // Output State
  const [generatedDraft, setGeneratedDraft] = useState<string>("");
  const [generatedTitle, setGeneratedTitle] = useState<string>("");
  const [offerCode, setOfferCode] = useState<string>("WELCOME10");
  const [socialCaption, setSocialCaption] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [campaignsList, setCampaignsList] = useState<CampaignItem[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<"draft" | "approved" | "sent">("draft");

  useEffect(() => {
    const l = authStorage.getLanguage();
    setLang(l);
    setCampaignLang(l);
    const m = authStorage.getMerchant();
    setMerchant(m);

    // Initial check for URL query params (e.g. from customer click)
    const segParam = searchParams.get("segment");
    const goalParam = searchParams.get("goal");
    if (segParam) setTargetSegment(segParam);
    if (goalParam) setCampaignGoal(goalParam);

    loadCampaigns();
    handleGenerateDraft();
  }, []);

  const loadCampaigns = async () => {
    try {
      const res = await apiRequest<CampaignItem[]>("/marketing/campaigns");
      setCampaignsList(res || []);
    } catch {
      // fallback
    }
  };

  const handleGenerateDraft = async () => {
    setGenerating(true);
    setApprovalStatus("draft");
    try {
      const storeName = merchant?.name || "Sharma General Store";
      const res = await apiRequest<{ variants: Array<{ title: string; text: string }>; segment: string }>(
        "/marketing/generate",
        {
          method: "POST",
          body: JSON.stringify({
            segment: targetSegment,
            goal: campaignGoal,
            language: campaignLang,
            discount_pct: discountPct,
            product: productFocus,
          }),
        }
      );

      const topVariant = res.variants?.[0];
      const code = `PAYTM${discountPct}`;
      setOfferCode(code);

      if (topVariant) {
        setGeneratedTitle(topVariant.title || "Special Store Savings");
        setGeneratedDraft(topVariant.text);
      } else {
        // Fallback generator
        const msg =
          campaignLang === "hi"
            ? `🙏 नमस्ते! ${storeName} की ओर से आपके लिए विशेष बचत! इस सप्ताहांत ${productFocus} पर पाइए फ्लैट ${discountPct}% की सीधी छूट। काउंटर पर पेटीएम साउंडबॉक्स से पेमेंट करते समय कोड ${code} बताएं। आज ही पधारें!`
            : campaignLang === "mr"
            ? `🙏 नमस्कार! ${storeName} कडून तुमच्यासाठी खास ऑफर! या वीकेंडला ${productFocus} खरेदीवर मिळवा फ्लॅट ${discountPct}% सूट. पेटीएम साउंडबॉक्सने पेमेंट करताना कोड ${code} वापरा.`
            : `🙏 Hello! Special offer from ${storeName}! Get flat ${discountPct}% OFF on ${productFocus} this weekend. Mention code ${code} and pay via Paytm UPI at the counter. Visit today!`;
        setGeneratedTitle("Special Customer Privilege Offer");
        setGeneratedDraft(msg);
      }

      setSocialCaption(
        `🛒 Exclusive savings at ${storeName}! Flat ${discountPct}% off on daily essentials. Pay via #PaytmSoundbox. #KiranaSavings #PaytmForBusiness`
      );
    } catch {
      // fallback message
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveAndSave = async (statusToSet: "approved" | "sent") => {
    try {
      const res = await apiRequest<CampaignItem>("/marketing/campaigns", {
        method: "POST",
        body: JSON.stringify({
          title: generatedTitle,
          target_segment: targetSegment === "at_risk" ? "Inactive / Churning Customers (20)" : "Regular Shoppers",
          channel: "WhatsApp",
          content: generatedDraft,
          offer_code: offerCode,
          discount_pct: discountPct,
          status: statusToSet,
        }),
      });
      setApprovalStatus(statusToSet);
      setCampaignsList((prev) => [res, ...prev]);
      alert(
        statusToSet === "sent"
          ? "Campaign approved and dispatched successfully via WhatsApp Business gateway!"
          : "Campaign approved and saved to scheduled drafts!"
      );
    } catch (err: any) {
      alert(err.message || "Failed to approve campaign");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout activePageTitle="AI Marketing Assistant">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              AI Marketing Automation & WhatsApp Campaigns
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Draft, customize, preview, and approve customer-specific marketing blasts
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 self-start">
            Verified WhatsApp API Gateway Ready
          </span>
        </div>

        {/* 2-Column Workspace: Left Configurator / Right Mobile Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ============================================================ */}
          {/* LEFT: CAMPAIGN CONFIGURATION (7 Cols)                        */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Sparkles className="w-5 h-5 text-[#00BAF2]" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Campaign Generator Parameters
                </h3>
              </div>

              {/* Target Segment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#00BAF2]" />
                  Target Customer Segment
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "at_risk", label: "At-Risk Churn (20)", desc: "Absent for 21+ days" },
                    { id: "regular", label: "Regular VIPs (84)", desc: "Frequent shoppers" },
                    { id: "all", label: "All Customers (150+)", desc: "Full broadcast" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTargetSegment(s.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition ${
                        targetSegment === s.id
                          ? "bg-sky-50 dark:bg-sky-950 border-[#00BAF2] ring-1 ring-[#00BAF2]"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <p className="font-bold text-slate-900 dark:text-white">{s.label}</p>
                      <p className="text-[10px] text-slate-400">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Campaign Objective */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#00BAF2]" />
                  Campaign Objective / Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "win_back", label: "Win-Back Churn" },
                    { id: "weekend", label: "Weekend Surge" },
                    { id: "festival", label: "Festival Special (Diwali)" },
                    { id: "clearance", label: "Dead-Stock Clearance" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setCampaignGoal(g.id)}
                      className={`p-2 rounded-xl border text-xs font-semibold text-center transition ${
                        campaignGoal === g.id
                          ? "bg-[#002E6E] text-white border-[#002E6E] font-bold"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount / Offer & Product Focus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Discount Incentive
                  </label>
                  <select
                    value={discountPct}
                    onChange={(e) => setDiscountPct(parseInt(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                  >
                    <option value={5}>Flat 5% OFF</option>
                    <option value={10}>Flat 10% OFF (Recommended)</option>
                    <option value={15}>Flat 15% OFF</option>
                    <option value={20}>Flat 20% Mega Clearance</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Featured Product Category
                  </label>
                  <input
                    type="text"
                    value={productFocus}
                    onChange={(e) => setProductFocus(e.target.value)}
                    placeholder="e.g. Basmati Rice, Cold Drinks"
                    className="w-full bg-slate-50 dark:bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* Language selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Drafting Language
                </label>
                <div className="flex gap-2">
                  {[
                    { id: "hi", label: "हिन्दी (Hindi)" },
                    { id: "en", label: "English" },
                    { id: "mr", label: "मराठी (Marathi)" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setCampaignLang(l.id)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition border ${
                        campaignLang === l.id
                          ? "bg-[#00BAF2] text-white border-[#00BAF2]"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate CTA */}
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={generating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00BAF2] to-[#0099cc] hover:brightness-105 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{generating ? "AI Generating Variants..." : "Generate AI Marketing Draft"}</span>
              </button>
            </div>

            {/* Editable Campaign Text Area */}
            <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Editable Campaign Copy
                </h3>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#00BAF2] hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Text"}</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={generatedDraft}
                onChange={(e) => setGeneratedDraft(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 text-xs lg:text-sm text-slate-900 dark:text-slate-100 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none leading-relaxed"
              />

              {/* Explicit Approval Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Merchant Approval Required before Sending</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveAndSave("approved")}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => handleApproveAndSave("sent")}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve & Dispatch via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT: LIVE MOBILE PREVIEW & CAMPAIGN LOG (5 Cols)          */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-5">
            {/* WhatsApp Phone Mockup Preview */}
            <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#00BAF2]" />
                  Live WhatsApp Message Preview
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  WhatsApp Business
                </span>
              </div>

              {/* Phone Frame */}
              <div className="rounded-2xl bg-[#ECE5DD] dark:bg-[#121b22] p-3 shadow-inner border border-slate-300 dark:border-slate-700 space-y-2">
                {/* Chat Bubble */}
                <div className="rounded-2xl rounded-tl-none bg-white dark:bg-[#1f2c34] p-3 text-xs text-slate-900 dark:text-slate-100 shadow-sm max-w-sm space-y-2">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-700">
                    <div className="w-5 h-5 rounded-full bg-[#00BAF2] text-white flex items-center justify-center font-bold text-[10px]">
                      P
                    </div>
                    <span className="font-bold text-[11px] text-[#002E6E] dark:text-[#00BAF2]">
                      {merchant?.name || "Sharma General Store"}
                    </span>
                    <span className="text-[9px] text-slate-400">· Official</span>
                  </div>

                  <p className="whitespace-pre-line leading-relaxed text-[11px]">
                    {generatedDraft || "Your AI generated message will appear here..."}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400">
                    <span className="font-mono">Code: {offerCode}</span>
                    <span>10:30 AM · Delivered</span>
                  </div>
                </div>
              </div>

              {/* Social Media Caption Box */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Share2 className="w-3 h-3 text-[#00BAF2]" />
                  Social Media Caption (Instagram / WhatsApp Status)
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">{socialCaption}</p>
              </div>
            </div>

            {/* Campaign History Log */}
            <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                Dispatched Campaigns History
              </h3>

              <div className="space-y-2.5">
                {campaignsList.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{c.title}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          c.status === "sent"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Channel: {c.channel} · {c.target_segment}
                    </p>
                    {c.metrics?.delivered && (
                      <p className="text-[10px] text-emerald-600 font-semibold pt-1">
                        ✓ {c.metrics.delivered} delivered · {c.metrics.read} read · ₹{c.metrics.revenue_generated} estimated revenue
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function MarketingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Marketing Assistant...</div>}>
      <MarketingContent />
    </Suspense>
  );
}
