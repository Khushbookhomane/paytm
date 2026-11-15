"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import ProGateCard from "@/components/ProGateCard";
import { apiRequest, authStorage, Merchant } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import {
  Package,
  Search,
  AlertTriangle,
  Flame,
  Calendar,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface ProductItem {
  id: number;
  name: string;
  category: string;
  cost_price: number;
  sell_price: number;
  stock_qty: number;
  reorder_level: number;
  status: "ok" | "low" | "out";
  days_of_stock_left: number;
}

interface ForecastItem {
  product_id: number;
  product_name: string;
  category: string;
  current_stock: number;
  predicted_demand_7d: number;
  daily_forecast: Array<{
    day: string;
    date: string;
    pred: number;
    lower: number;
    upper: number;
    is_weekend: boolean;
  }>;
  weekend_spike_flag: boolean;
  weekend_uplift_pct: number;
  suggested_reorder_qty: number;
  urgency: "urgent" | "moderate" | "normal";
}

export default function InventoryPage() {
  const [lang, setLang] = useState<Language>("hi");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [forecasts, setForecasts] = useState<Record<number, ForecastItem>>({});
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "ok">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reorderedMap, setReorderedMap] = useState<Record<number, boolean>>({});
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    setLang(authStorage.getLanguage());
    setMerchant(authStorage.getMerchant());
    loadData();
  }, []);

  const isPro = merchant?.plan?.toLowerCase() === "pro";

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, forecastRes] = await Promise.all([
        apiRequest<ProductItem[]>("/inventory"),
        apiRequest<ForecastItem[]>("/inventory/forecast?days=7"),
      ]);
      setProducts(prodRes);

      const fMap: Record<number, ForecastItem> = {};
      forecastRes.forEach((f) => {
        fMap[f.product_id] = f;
      });
      setForecasts(fMap);

      // Select first low stock item by default for rich preview
      const firstLow = prodRes.find((p) => p.status === "low");
      if (firstLow) {
        setSelectedProductId(firstLow.id);
      } else if (prodRes.length > 0) {
        setSelectedProductId(prodRes[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    authStorage.setLanguage(newLang);
  };

  const t = translations[lang];

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "low") return p.status === "low" || p.status === "out";
    if (filter === "ok") return p.status === "ok";
    return true;
  });

  const lowStockCount = products.filter((p) => p.status === "low" || p.status === "out").length;
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedForecast = selectedProductId ? forecasts[selectedProductId] : null;

  const handleMarkReordered = (id: number) => {
    setReorderedMap((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} />

      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar pb-8">
        {/* Title & Low Stock Alert Banner */}
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {t.stock.title}
          </h2>
          <p className="text-xs text-slate-500">
            {products.length} {lang === "en" ? "catalog items tracked" : "दुकान के सामान"}
          </p>
        </div>

        {lowStockCount > 0 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">
                  {lowStockCount} {t.stock.urgentBanner}
                </p>
                <p className="text-[10px] text-amber-800">
                  {lang === "en" ? "Includes high-velocity staple & beverage items" : "दूध व कोल्ड ड्रिंक्स शामिल हैं"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilter("low")}
              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-bold shadow-sm"
            >
              {lang === "en" ? "View Low" : "देखें"}
            </button>
          </div>
        )}

        {/* Selected Product Forecast Modal / Star Section */}
        {selectedProduct && selectedForecast && (
          <div className="paytm-card p-4 border border-[#00BAF2]/30 bg-gradient-to-br from-white to-[#f0f9ff]">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00BAF2] bg-[#E8F8FE] px-2 py-0.5 rounded-md">
                    {selectedProduct.category}
                  </span>
                  {selectedForecast.weekend_spike_flag && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md">
                      <Flame className="w-3 h-3" />
                      <span>+{selectedForecast.weekend_uplift_pct}% Weekend Spike</span>
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                  {selectedProduct.name}
                </h3>
              </div>

              <div className="text-right">
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    selectedProduct.status === "low"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {selectedProduct.status === "low" ? t.stock.lowStock : t.stock.okStock}
                </span>
                <p className="text-xs font-black text-slate-800 mt-1">
                  {selectedProduct.stock_qty} {lang === "en" ? "in stock" : "बाकी"}
                </p>
              </div>
            </div>

            {/* 7-Day Forecast Chart / Pro Gating */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              {!isPro ? (
                <ProGateCard
                  featureTitle={lang === "en" ? "7-Day AI Demand Forecasting" : "7-दिवसीय एआई मांग पूर्वानुमान"}
                  featureDesc={lang === "en" ? "Unlock Prophet & Moving Average forecasts to know exact reorder units before stock runs out." : "दुकान में माल खत्म होने से पहले 7 दिनों की सटीक मांग का पूर्वानुमान पाएं।"}
                  benefits={[
                    "Day-of-week adjusted moving average / Prophet forecasting",
                    "Automated reorder buffer & urgency alerts",
                    "Weekend demand spike detection for cold drinks & snacks"
                  ]}
                  lang={lang}
                  onUnlocked={() => {
                    const m = authStorage.getMerchant();
                    setMerchant(m);
                    loadData();
                  }}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>{t.stock.forecast7d}</span>
                    <span className="text-[#002E6E]">
                      ~{selectedForecast.predicted_demand_7d} {lang === "en" ? "units needed" : "यूनिट मांग"}
                    </span>
                  </div>

                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={selectedForecast.daily_forecast}
                        margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 9, fontWeight: 700 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 8 }}
                        />
                        <Tooltip
                          formatter={(val: number, name: string) => [
                            `${val} units`,
                            name === "pred" ? "Predicted" : name === "upper" ? "Upper Bound" : "Lower Bound",
                          ]}
                          contentStyle={{
                            borderRadius: "0.75rem",
                            fontSize: "11px",
                            border: "1px solid #e2e8f0",
                          }}
                        />
                        <Bar
                          dataKey="pred"
                          fill="#00BAF2"
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          type="monotone"
                          dataKey="upper"
                          stroke="#002E6E"
                          strokeWidth={1.5}
                          dot={false}
                          strokeDasharray="3 3"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {/* Reorder Recommendation Card Row */}
              <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    {t.stock.suggestedReorder}
                  </span>
                  <p className="text-sm font-black text-[#002E6E]">
                    +{selectedForecast.suggested_reorder_qty} units
                  </p>
                </div>

                <button
                  onClick={() => handleMarkReordered(selectedProduct.id)}
                  disabled={reorderedMap[selectedProduct.id]}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    reorderedMap[selectedProduct.id]
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#00BAF2] text-white hover:bg-[#00a3d4] active:scale-95 shadow"
                  }`}
                >
                  {reorderedMap[selectedProduct.id] ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === "en" ? "Ordered" : "ऑर्डर किया"}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{lang === "en" ? "Restock Now" : "स्टॉक ऑर्डर"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search & Status Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.stock.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2]"
            />
          </div>

          <div className="flex gap-1.5 text-xs font-bold">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg transition ${
                filter === "all"
                  ? "bg-[#002E6E] text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {t.stock.all} ({products.length})
            </button>
            <button
              onClick={() => setFilter("low")}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                filter === "low"
                  ? "bg-rose-600 text-white"
                  : "bg-white text-rose-700 border border-slate-200"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{t.stock.lowStock} ({lowStockCount})</span>
            </button>
            <button
              onClick={() => setFilter("ok")}
              className={`px-3 py-1 rounded-lg transition ${
                filter === "ok"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {t.stock.okStock}
            </button>
          </div>
        </div>

        {/* Products Stock List */}
        <div className="paytm-card divide-y divide-slate-100 overflow-hidden">
          {filteredProducts.map((p) => {
            const isSelected = p.id === selectedProductId;
            const f = forecasts[p.id];
            const isLow = p.status === "low" || p.status === "out";

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                  isSelected ? "bg-sky-50/70" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isLow ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span>{p.category}</span>
                      <span>·</span>
                      <span>₹{p.sell_price}</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-600">
                        {p.days_of_stock_left} {lang === "en" ? "days left" : "दिन का स्टॉक"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span
                      className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isLow ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {p.stock_qty} / {p.reorder_level}
                    </span>
                    {f && f.suggested_reorder_qty > 0 && (
                      <p className="text-[10px] text-[#00BAF2] font-bold mt-0.5">
                        +{f.suggested_reorder_qty} rec
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isSelected ? "rotate-90 text-[#00BAF2]" : ""
                    }`}
                  />
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              {lang === "en" ? "No matching products found." : "कोई सामान नहीं मिला।"}
            </div>
          )}
        </div>
      </main>

      <Navigation currentLang={lang} />
    </div>
  );
}
