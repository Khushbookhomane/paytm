"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { apiRequest, authStorage } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  PackageCheck,
  AlertTriangle,
  TrendingUp,
  Search,
  Plus,
  Filter,
  Truck,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Calendar,
  X,
} from "lucide-react";

interface ProductItem {
  id: number;
  name: string;
  category: string;
  cost_price: number;
  sell_price: number;
  stock_qty: number;
  reorder_level: number;
  status: "ok" | "low" | "out";
  days_of_stock_left?: number;
}

interface InventoryForecastItem {
  product_id: number;
  product_name: string;
  category: string;
  current_stock: number;
  predicted_demand_7d: number;
  suggested_reorder_qty: number;
  urgency: "urgent" | "normal";
  weekend_spike_flag: boolean;
  weekend_uplift_pct: number;
}

interface SupplierOrderOut {
  id: number;
  product_id: number;
  product_name: string;
  supplier_name: string;
  quantity: number;
  order_status: string;
  expected_delivery_date?: string;
  notes?: string;
  created_at: string;
}

export default function InventoryPage() {
  const [lang, setLang] = useState<Language>("hi");
  const [activeTab, setActiveTab] = useState<"catalog" | "forecast" | "orders">("catalog");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [forecasts, setForecasts] = useState<InventoryForecastItem[]>([]);
  const [orders, setOrders] = useState<SupplierOrderOut[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Add Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Kirana & Grocery");
  const [newProdCostPrice, setNewProdCostPrice] = useState("");
  const [newProdSellPrice, setNewProdSellPrice] = useState("");
  const [newProdStockQty, setNewProdStockQty] = useState("");
  const [newProdReorderLevel, setNewProdReorderLevel] = useState("10");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Quick Restock Modal
  const [restockModalProd, setRestockModalProd] = useState<ProductItem | null>(null);
  const [restockQty, setRestockQty] = useState("30");
  const [supplierName, setSupplierName] = useState("Standard Wholesale Co.");
  const [restockSubmitting, setRestockSubmitting] = useState(false);

  useEffect(() => {
    setLang(authStorage.getLanguage());
    loadAllInventoryData();
  }, []);

  const loadAllInventoryData = async () => {
    setLoading(true);
    try {
      const [pRes, fRes, oRes] = await Promise.all([
        apiRequest<ProductItem[]>("/inventory"),
        apiRequest<InventoryForecastItem[]>("/inventory/forecast?days=7"),
        apiRequest<SupplierOrderOut[]>("/inventory/reorders"),
      ]);
      setProducts(pRes || []);
      setForecasts(fRes || []);
      setOrders(oRes || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdCostPrice || !newProdSellPrice) return;
    setFormSubmitting(true);
    try {
      await apiRequest("/inventory/products", {
        method: "POST",
        body: JSON.stringify({
          name: newProdName.trim(),
          category: newProdCategory,
          cost_price: parseFloat(newProdCostPrice),
          sell_price: parseFloat(newProdSellPrice),
          stock_qty: parseInt(newProdStockQty) || 0,
          reorder_level: parseInt(newProdReorderLevel) || 10,
        }),
      });
      setShowAddModal(false);
      setNewProdName("");
      setNewProdCostPrice("");
      setNewProdSellPrice("");
      setNewProdStockQty("");
      loadAllInventoryData();
    } catch (err: any) {
      alert(err.message || "Failed to add product");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCreateReorder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalProd) return;
    setRestockSubmitting(true);
    try {
      await apiRequest("/inventory/reorders", {
        method: "POST",
        body: JSON.stringify({
          product_id: restockModalProd.id,
          supplier_name: supplierName,
          quantity: parseInt(restockQty) || 20,
          notes: "Auto-reorder initiated from Paytm VentureAI",
        }),
      });
      setRestockModalProd(null);
      loadAllInventoryData();
      alert("Supplier reorder created successfully! Tracked in Orders tab.");
    } catch (err: any) {
      alert(err.message || "Failed to place reorder");
    } finally {
      setRestockSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prodId: number, name: string) => {
    if (!confirm(`Are you sure you want to delete '${name}' from inventory?`)) return;
    try {
      await apiRequest(`/inventory/products/${prodId}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== prodId));
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "low" && (p.status === "low" || p.status === "out")) ||
      (statusFilter === "out" && p.status === "out") ||
      (statusFilter === "ok" && p.status === "ok");
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const lowCount = products.filter((p) => p.status === "low" || p.status === "out").length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock_qty, 0);

  return (
    <AppLayout activePageTitle="AI Inventory Intelligence">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              AI Inventory Management & Demand Forecasting
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Smart reorder thresholds, burn-rate telemetry, and supplier order tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00BAF2] hover:bg-[#0099cc] text-white text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* 4 Inventory Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Total Tracked SKUs</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {products.length} Items
            </p>
            <p className="text-[10px] text-slate-400 mt-1">{categories.length} Categories active</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Critical Stockouts / Low</span>
            <p className="text-xl lg:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight mt-1">
              {lowCount} SKUs
            </p>
            <p className="text-[10px] text-rose-500 font-semibold mt-1">
              Restock required before weekend
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Total Stock on Hand</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {totalStockUnits.toLocaleString("en-IN")} Units
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">
              Healthy overall shelf presence
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400">Supplier Orders</span>
            <p className="text-xl lg:text-2xl font-black text-[#00BAF2] tracking-tight mt-1">
              {orders.length} Logged
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              {orders.filter((o) => o.order_status === "pending").length} pending deliveries
            </p>
          </div>
        </div>

        {/* Tab Switcher: Product Catalog vs 7-Day Forecast vs Orders */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`pb-3 flex items-center gap-1.5 transition ${
              activeTab === "catalog"
                ? "text-[#00BAF2] border-b-2 border-[#00BAF2]"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Product Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("forecast")}
            className={`pb-3 flex items-center gap-1.5 transition ${
              activeTab === "forecast"
                ? "text-[#00BAF2] border-b-2 border-[#00BAF2]"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#00BAF2]" />
            <span>AI Demand Forecast (7 Days)</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 flex items-center gap-1.5 transition ${
              activeTab === "orders"
                ? "text-[#00BAF2] border-b-2 border-[#00BAF2]"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Supplier Orders History ({orders.length})</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: PRODUCT CATALOG                                       */}
        {/* ============================================================ */}
        {activeTab === "catalog" && (
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Filters bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search catalog by product name or brand..."
                  className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#00BAF2]/30"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white dark:bg-slate-900 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white dark:bg-slate-900 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="low">Low & Out of Stock</option>
                  <option value="out">Out of Stock Only</option>
                  <option value="ok">In Stock (Adequate)</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Cost Price</th>
                    <th className="py-3 px-4">Sell Price</th>
                    <th className="py-3 px-4">Gross Margin</th>
                    <th className="py-3 px-4">Stock on Hand</th>
                    <th className="py-3 px-4">Reorder At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((p) => {
                    const margin = Math.round(((p.sell_price - p.cost_price) / (p.sell_price || 1)) * 100);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {p.name}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{p.category}</td>
                        <td className="py-3 px-4 font-mono">₹{p.cost_price}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          ₹{p.sell_price}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600">
                          {margin}%
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold">
                          <span
                            className={
                              p.stock_qty <= 0
                                ? "text-rose-600"
                                : p.stock_qty <= p.reorder_level
                                ? "text-amber-600"
                                : "text-slate-900 dark:text-white"
                            }
                          >
                            {p.stock_qty} units
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{p.reorder_level} units</td>
                        <td className="py-3 px-4">
                          {p.stock_qty <= 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                              Out of Stock
                            </span>
                          ) : p.stock_qty <= p.reorder_level ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              Low Stock ({p.days_of_stock_left || 1.5}d left)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(p.stock_qty <= p.reorder_level || p.stock_qty <= 0) && (
                              <button
                                onClick={() => setRestockModalProd(p)}
                                className="px-2.5 py-1 rounded-lg bg-[#00BAF2] hover:bg-[#0099cc] text-white text-[11px] font-bold transition shadow-sm"
                              >
                                Restock Now
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: AI DEMAND FORECAST & PREDICTIVE RESTOCKING            */}
        {/* ============================================================ */}
        {activeTab === "forecast" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#00BAF2] text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Day-of-Week Seasonal Moving Average Forecasting
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Calculated using 90-day store sales patterns with weekend rush uplift multipliers
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#00BAF2] bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                Next 7-Day Window
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forecasts.map((f) => (
                <div
                  key={f.product_id}
                  className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {f.category}
                      </span>
                      {f.weekend_spike_flag && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                          🔥 Weekend Surge (+{f.weekend_uplift_pct}%)
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white mb-2">
                      {f.product_name}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-slate-100 dark:border-slate-800 mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Stock</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {f.current_stock} units
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Predicted 7d Demand</span>
                        <span className="font-extrabold text-sky-600">
                          {f.predicted_demand_7d} units
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">AI Suggestion</span>
                      <span className="text-xs font-bold text-emerald-600">
                        +{f.suggested_reorder_qty} units
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const targetProd = products.find((p) => p.id === f.product_id);
                        if (targetProd) {
                          setRestockModalProd(targetProd);
                          setRestockQty(String(f.suggested_reorder_qty));
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#002E6E] hover:bg-[#003d8f] text-white text-xs font-bold transition shadow-sm"
                    >
                      Restock Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: SUPPLIER ORDERS HISTORY                               */}
        {/* ============================================================ */}
        {activeTab === "orders" && (
          <div className="rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Supplier Purchase Orders & Deliveries
                </h3>
                <p className="text-xs text-slate-500">
                  Track pending and confirmed reorders for inventory restock
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Date Placed</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.length > 0 ? (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-mono font-bold text-[#00BAF2]">
                          #SO-{o.id}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {o.product_name}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{o.supplier_name}</td>
                        <td className="py-3 px-4 font-bold font-mono">+{o.quantity} units</td>
                        <td className="py-3 px-4 text-slate-400">{o.created_at?.slice(0, 10)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.order_status === "delivered"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {o.order_status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                        No supplier orders placed yet. Tap &apos;Restock Now&apos; on any low-stock product.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ADD PRODUCT MODAL                                            */}
        {/* ============================================================ */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0c1324] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Add New Product to Store
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Parle-G Biscuits 250g"
                    className="w-full bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    placeholder="e.g. Biscuits & Snacks"
                    className="w-full bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Cost Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={newProdCostPrice}
                      onChange={(e) => setNewProdCostPrice(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Sell Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={newProdSellPrice}
                      onChange={(e) => setNewProdSellPrice(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Initial Stock (Units)
                    </label>
                    <input
                      type="number"
                      value={newProdStockQty}
                      onChange={(e) => setNewProdStockQty(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Reorder Alert Level
                    </label>
                    <input
                      type="number"
                      value={newProdReorderLevel}
                      onChange={(e) => setNewProdReorderLevel(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#00BAF2] hover:bg-[#0099cc] text-white font-bold"
                  >
                    {formSubmitting ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ONE-CLICK SUPPLIER RESTOCK MODAL                             */}
        {/* ============================================================ */}
        {restockModalProd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0c1324] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Place Supplier Reorder
                </h3>
                <button
                  onClick={() => setRestockModalProd(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{restockModalProd.name}</p>
                <p className="text-slate-400">
                  Current Stock: {restockModalProd.stock_qty} · Threshold: {restockModalProd.reorder_level}
                </p>
              </div>

              <form onSubmit={handleCreateReorder} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Reorder Quantity (Units)
                  </label>
                  <input
                    type="number"
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRestockModalProd(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={restockSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#002E6E] text-white font-bold"
                  >
                    {restockSubmitting ? "Placing..." : "Confirm Reorder"}
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
