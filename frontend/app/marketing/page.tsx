"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import ProGateCard from "@/components/ProGateCard";
import { apiRequest, authStorage, Merchant } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import {
  Send,
  Sparkles,
  Copy,
  Check,
  Share2,
  AlertCircle,
  Tag,
  Target,
  Globe,
  Percent,
} from "lucide-react";

interface Variant {
  id: number;
  text: string;
  character_count: number;
  suggested_channel: string;
}

interface MarketingResponse {
  variants: Variant[];
  language: string;
  segment: string;
  goal: string;
}

function MarketingContent() {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Language>("hi");

  const [segment, setSegment] = useState("At-risk");
  const [goal, setGoal] = useState("win_back");
  const [msgLang, setMsgLang] = useState<Language>("hi");
  const [product, setProduct] = useState("");
  const [discount, setDiscount] = useState(10);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    const savedLang = authStorage.getLanguage();
    setLang(savedLang);
    setMsgLang(savedLang);
    setMerchant(authStorage.getMerchant());

    const segParam = searchParams.get("segment");
    const goalParam = searchParams.get("goal");
    if (segParam) setSegment(segParam);
    if (goalParam) setGoal(goalParam);

    // Auto-generate initial variants
    generateCampaign(segParam || "At-risk", goalParam || "win_back", savedLang);
  }, [searchParams]);

  const isPro = merchant?.plan?.toLowerCase() === "pro";

  const generateCampaign = async (
    targetSeg = segment,
    targetGoal = goal,
    targetLang = msgLang
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<MarketingResponse>("/marketing/generate", {
        method: "POST",
        body: JSON.stringify({
          segment: targetSeg,
          goal: targetGoal,
          language: targetLang,
          product: product.trim() || undefined,
          discount_pct: discount,
        }),
      });
      setVariants(res.variants);
    } catch (err: any) {
      setError(err.message || "Failed to generate marketing messages");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsAppShare = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const t = translations[lang];

  return (
    <div className="flex-1 flex flex-col justify-between">
      <Header currentLang={lang} onLanguageChange={(l) => { setLang(l); authStorage.setLanguage(l); }} />

      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar pb-8">
        {/* Header banner */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Campaign Studio</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {t.marketing.title}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === "en"
              ? "Generate high-converting WhatsApp & SMS messages under 300 characters"
              : "300 अक्षरों से कम के प्रभावी व्हाट्सएप व SMS संदेश बनाएं"}
          </p>
        </div>

        {/* Campaign Studio Content or Pro Gate */}
        {!isPro ? (
          <ProGateCard
            featureTitle={lang === "en" ? "AI WhatsApp Campaign Studio" : "एआई व्हाट्सएप कैंपेन स्टूडियो"}
            featureDesc={lang === "en" ? "Unlock regional multilingual WhatsApp & SMS campaign generator with under 300 characters high-converting copy." : "300 अक्षरों में हिंदी, मराठी और अंग्रेजी में व्हाट्सएप ऑफर्स और वाउचर तैयार करें।"}
            benefits={[
              "Instant 1-Click WhatsApp share link (wa.me)",
              "Vernacular campaign generation in Hindi, Marathi & English",
              "Optimized copy under 300 chars to maximize SMS & WhatsApp response"
            ]}
            lang={lang}
            onUnlocked={() => {
              const m = authStorage.getMerchant();
              setMerchant(m);
              generateCampaign();
            }}
          />
        ) : (
          <>
            {/* Campaign Parameters Form Card */}
            <div className="paytm-card p-4 space-y-3.5 border border-slate-200">
          {/* Segment Picker */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Target className="w-3.5 h-3.5 text-purple-600" />
              <span>{t.marketing.selectSegment}</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {["At-risk", "Regular", "Occasional"].map((seg) => (
                <button
                  key={seg}
                  type="button"
                  onClick={() => setSegment(seg)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition ${
                    segment === seg
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {seg === "At-risk"
                    ? t.customers.atRisk
                    : seg === "Regular"
                    ? t.customers.regular
                    : t.customers.occasional}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Picker */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-600" />
              <span>{t.marketing.selectGoal}</span>
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="win_back">
                {lang === "en" ? "Win-Back Churned Customers" : "छूटे हुए ग्राहकों को वापस लाएं"}
              </option>
              <option value="weekend_special">
                {lang === "en" ? "Weekend Rush Offer" : "वीकेंड स्पेशल ऑफर (कोल्ड ड्रिंक्स/स्नैक्स)"}
              </option>
              <option value="clear_stock">
                {lang === "en" ? "Clear Slow Stock" : "धीमी गति का स्टॉक निकालें"}
              </option>
              <option value="festive">
                {lang === "en" ? "Festive Grocery Offer" : "त्योहारी किराना ऑफर"}
              </option>
              <option value="new_product">
                {lang === "en" ? "New Product Arrival" : "नया सामान आगमन सूचना"}
              </option>
            </select>
          </div>

          {/* Language & Discount row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mb-1">
                <Globe className="w-3 h-3 text-slate-400" />
                <span>{t.marketing.selectLanguage}</span>
              </label>
              <select
                value={msgLang}
                onChange={(e) => setMsgLang(e.target.value as Language)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200"
              >
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="en">English</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mb-1">
                <Percent className="w-3 h-3 text-slate-400" />
                <span>Discount / Offer</span>
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                min={5}
                max={50}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200"
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => generateCampaign()}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.marketing.generateBtn}</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3 Generated Variants */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            {lang === "en" ? "Ready-to-Send WhatsApp Copies" : "तैयार व्हाट्सएप संदेश"}
          </h3>

          {variants.map((v) => (
            <div
              key={v.id}
              className="paytm-card p-4 space-y-3 border border-slate-200 bg-white"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Variant #{v.id}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {v.character_count} / 300 chars
                </span>
              </div>

              {/* Message text bubble styled like WhatsApp chat bubble */}
              <div className="p-3 rounded-2xl bg-[#E8F8FE]/60 border border-[#00BAF2]/20 text-xs text-slate-800 leading-relaxed font-medium">
                {v.text}
              </div>

              {/* Actions row: Copy and WhatsApp Share */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleCopy(v.id, v.text)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition"
                >
                  {copiedId === v.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">{t.marketing.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t.marketing.copyBtn}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleWhatsAppShare(v.text)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t.marketing.sendWhatsapp}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </main>

      <Navigation currentLang={lang} />
    </div>
  );
}

export default function MarketingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading campaign studio...</div>}>
      <MarketingContent />
    </Suspense>
  );
}
