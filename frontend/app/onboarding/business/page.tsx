"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, authStorage } from "@/lib/api";
import { ArrowRight, AlertCircle, Building2, CheckCircle2 } from "lucide-react";

const inputClass =
  "w-full px-3 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00BAF2] focus:ring-2 focus:ring-[#00BAF2]/20 transition font-medium";

const BUSINESS_TYPES = [
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "llp", label: "LLP" },
  { value: "pvt_ltd", label: "Private Limited Company" },
  { value: "pub_ltd", label: "Public Limited Company" },
  { value: "other", label: "Other" },
];

const CATEGORIES = [
  { value: "kirana", label: "Kirana / Grocery" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "clothing", label: "Clothing & Apparel" },
  { value: "restaurant", label: "Restaurant / Food" },
  { value: "electronics", label: "Electronics" },
  { value: "general", label: "General Retail" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

const STEPS = ["Account", "Business Info", "Verification", "Bank", "Complete"];

export default function BusinessRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    legal_name: "",
    trading_name: "",
    business_type: "sole_proprietorship",
    category: "kirana",
    address: "",
    city: "",
    state: "",
    pin_code: "",
    country: "India",
    business_email: "",
    gstin: "",
    pan: "",
    cin: "",
    website: "",
    language: "en",
    currency: "INR",
  });

  const [hasExistingOrg, setHasExistingOrg] = useState(false);

  useEffect(() => {
    if (!authStorage.getToken()) {
      router.replace("/sign-in");
      return;
    }

    apiRequest<any>("/organizations/current")
      .then((org) => {
        if (org && org.legal_name) {
          setHasExistingOrg(true);
          setForm({
            legal_name: org.legal_name || "",
            trading_name: org.trading_name || "",
            business_type: org.business_type || "sole_proprietorship",
            category: org.category || "kirana",
            address: org.address || "",
            city: org.city || "",
            state: org.state || "",
            pin_code: org.pin_code || "",
            country: org.country || "India",
            business_email: org.business_email || "",
            gstin: org.gstin || "",
            pan: org.pan || "",
            cin: org.cin || "",
            website: org.website || "",
            language: org.language || "en",
            currency: org.currency || "INR",
          });
        }
      })
      .catch(() => {
        // No existing organization yet
      });
  }, [router]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.legal_name.trim()) {
      setError("Legal business name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (hasExistingOrg) {
        await apiRequest("/organizations/current", {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      } else {
        try {
          await apiRequest("/organizations", {
            method: "POST",
            body: JSON.stringify(form),
          });
        } catch (postErr: any) {
          if (
            postErr.message?.includes("already have an organisation") ||
            postErr.message?.includes("PATCH")
          ) {
            await apiRequest("/organizations/current", {
              method: "PATCH",
              body: JSON.stringify(form),
            });
          } else {
            throw postErr;
          }
        }
      }
      router.replace("/onboarding");
    } catch (err: any) {
      setError(err.message || "Failed to save business information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9]">
      {/* Header */}
      <div
        className="px-5 pt-8 pb-5"
        style={{ background: "linear-gradient(135deg, #002E6E 0%, #003d8f 100%)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#00BAF2] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm">Business Registration</p>
            <p className="text-sky-300 text-[10px]">Step 2 of 5</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${i <= 1 ? "bg-[#00BAF2]" : "bg-white/20"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Legal name */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Business Identity</p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Legal Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.legal_name}
                onChange={(e) => set("legal_name", e.target.value)}
                required
                className={inputClass}
                placeholder="As registered with authorities"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Trading / Display Name
              </label>
              <input
                type="text"
                value={form.trading_name}
                onChange={(e) => set("trading_name", e.target.value)}
                className={inputClass}
                placeholder="Name shown to customers"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Business Type</label>
                <select value={form.business_type} onChange={(e) => set("business_type", e.target.value)} className={inputClass}>
                  {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Business Address</p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Street Address</label>
              <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} className={inputClass} placeholder="Shop / Office address" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
                <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputClass} placeholder="Mumbai" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">PIN Code</label>
                <input type="text" value={form.pin_code} onChange={(e) => set("pin_code", e.target.value)} className={inputClass} placeholder="400001" maxLength={6} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">State</label>
              <input type="text" value={form.state} onChange={(e) => set("state", e.target.value)} className={inputClass} placeholder="Maharashtra" />
            </div>
          </div>

          {/* Optional identifiers */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Business Identifiers <span className="text-slate-400 font-normal normal-case">(optional)</span>
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">GSTIN</label>
              <input type="text" value={form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} className={inputClass} placeholder="22AAAAA0000A1Z5" maxLength={15} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">PAN</label>
                <input type="text" value={form.pan} onChange={(e) => set("pan", e.target.value.toUpperCase())} className={inputClass} placeholder="AAAAA0000A" maxLength={10} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">CIN / LLPIN</label>
                <input type="text" value={form.cin} onChange={(e) => set("cin", e.target.value.toUpperCase())} className={inputClass} placeholder="U12345MH2020" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Business Website</label>
              <input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} className={inputClass} placeholder="https://yourbusiness.com" />
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Preferences</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Language</label>
                <select value={form.language} onChange={(e) => set("language", e.target.value)} className={inputClass}>
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="mr">मराठी</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Currency</label>
                <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inputClass}>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><span>Save & Continue</span><ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
