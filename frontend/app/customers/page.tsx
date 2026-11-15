"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import ProGateCard from "@/components/ProGateCard";
import { apiRequest, authStorage, Merchant } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import {
  Users,
  Search,
  AlertCircle,
  PhoneCall,
  Calendar,
  IndianRupee,
  ShoppingBag,
  Send,
  UserCheck,
  UserMinus,
  Sparkles,
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
  churn_risk: boolean;
  reason: string;
}

interface SegmentSummary {
  segment: string;
  count: number;
  percentage: number;
  description: string;
}

interface CustomerResponse {
  summary: SegmentSummary[];
  customers: CustomerItem[];
}

export default function CustomersPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("hi");
  const [data, setData] = useState<CustomerResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>("At-risk");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    setLang(authStorage.getLanguage());
    setMerchant(authStorage.getMerchant());
    loadCustomers();
  }, []);

  const isPro = merchant?.plan?.toLowerCase() === "pro";

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<CustomerResponse>("/customers/segments");
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load customer segments");
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    authStorage.setLanguage(newLang);
  };

  const t = translations[lang];

  const handleSendOffer = (segment: string, customerName?: string) => {
    const goal = segment === "At-risk" ? "win_back" : "weekend_special";
    router.push(`/marketing?segment=${encodeURIComponent(segment)}&goal=${goal}`);
  };

  const filteredCustomers = (data?.customers || []).filter((c) => {
    const matchesTab = c.segment === activeTab;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone_masked.includes(search);
    return matchesTab && matchesSearch;
  });

  const getSegmentLabel = (seg: string) => {
    if (seg === "Regular") return t.customers.regular;
    if (seg === "Occasional") return t.customers.occasional;
    return t.customers.atRisk;
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} />

      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar pb-8">
        {/* Title & Headline */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {t.customers.title}
            </h2>
            <p className="text-xs text-slate-500">
              {data ? `${data.customers.length} total shoppers analyzed` : "Loading..."}
            </p>
          </div>
          <button
            onClick={() => handleSendOffer(activeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold active:scale-95 shadow transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.customers.sendOffer}</span>
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            <div className="h-20 rounded-2xl bg-white animate-pulse" />
            <div className="h-44 rounded-2xl bg-white animate-pulse" />
            <div className="h-44 rounded-2xl bg-white animate-pulse" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-red-800">{error}</p>
            <button
              onClick={loadCustomers}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && data && (
          <>
            {!isPro ? (
              <ProGateCard
                featureTitle={lang === "en" ? "AI Customer Segmentation (RFM)" : "स्मार्ट ग्राहक वर्गीकरण (RFM)"}
                featureDesc={lang === "en" ? "Unlock Machine Learning RFM analysis to identify churned regulars, high-value repeat shoppers, and automate WhatsApp win-back vouchers." : "मशीन लर्निंग से ग्राहकों का विश्लेषण करें। 21+ दिनों से न आने वाले पक्के ग्राहकों को पहचानें और डिस्काउंट वाउचर भेजें।"}
                benefits={[
                  "RFM Recency, Frequency & Monetary segmentation",
                  "Identify churn-risk shoppers before they switch stores",
                  "1-Click automated WhatsApp win-back campaign generator"
                ]}
                lang={lang}
                onUnlocked={() => {
                  setMerchant(authStorage.getMerchant());
                  loadCustomers();
                }}
              />
            ) : (
              <>
                {/* Segment Tab Cards */}
                <div className="grid grid-cols-3 gap-2">
                  {data.summary.map((sum) => {
                    const isActive = activeTab === sum.segment;
                    const isAtRisk = sum.segment === "At-risk";
                    const isRegular = sum.segment === "Regular";

                    return (
                      <button
                        key={sum.segment}
                        onClick={() => setActiveTab(sum.segment)}
                        className={`paytm-card p-3 text-left transition border ${
                          isActive
                            ? isAtRisk
                              ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/40"
                              : "border-[#00BAF2] ring-2 ring-sky-200 bg-sky-50/40"
                            : "border-transparent hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-extrabold uppercase text-slate-500">
                            {getSegmentLabel(sum.segment)}
                          </span>
                          {isAtRisk ? (
                            <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-[#00BAF2]" />
                          )}
                        </div>
                        <p className="text-base font-black text-slate-900">
                          {sum.count}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          {sum.percentage}% of store
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Segment Description Banner */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {data.summary.find((s) => s.segment === activeTab)?.description}
                    </p>
                    {activeTab === "At-risk" && (
                      <p className="text-[10px] text-rose-700 font-semibold mt-0.5">
                        💡 20 regulars have churned in the last 3 weeks. Send a 10% win-back coupon.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === "en" ? "Search customer name or phone..." : "ग्राहक का नाम खोजें..."}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#00BAF2]"
              />
            </div>

            {/* Customers List */}
            <div className="paytm-card divide-y divide-slate-100 overflow-hidden">
              {filteredCustomers.map((c) => {
                const isChurn = c.churn_risk;

                return (
                  <div key={c.id} className="p-3.5 hover:bg-slate-50 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900">
                            {c.name}
                          </h4>
                          {isChurn && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                              {t.customers.churnRiskTag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {c.phone_masked}
                        </p>
                      </div>

                      <button
                        onClick={() => handleSendOffer(c.segment, c.name)}
                        className="px-2.5 py-1 rounded-lg bg-[#E8F8FE] text-[#002E6E] text-[11px] font-bold hover:bg-[#00BAF2] hover:text-white transition flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Offer</span>
                      </button>
                    </div>

                    {/* Reason Badge */}
                    <div className="mt-2 text-[10px] bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
                      {c.reason}
                    </div>

                    {/* Stats pills */}
                    <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-500">
                      <div className="flex items-center gap-1 font-semibold">
                        <ShoppingBag className="w-3 h-3 text-[#00BAF2]" />
                        <span>{c.visit_count} {t.customers.visits}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold">
                        <IndianRupee className="w-3 h-3 text-emerald-600" />
                        <span>₹{Math.round(c.total_spend).toLocaleString("en-IN")} total</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{c.recency_days}d ago</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredCustomers.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  {lang === "en" ? "No customers found in this segment." : "इस वर्ग में कोई ग्राहक नहीं मिला।"}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Navigation currentLang={lang} />
    </div>
  );
}
