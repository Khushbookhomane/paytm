"use client";

import React, { useState } from "react";
import { ArrowRight, Building2, Store, MapPin, Mail, Globe, Users, Clock } from "lucide-react";

export interface BusinessFormData {
  legal_name: string;
  trading_name: string;
  business_type: string;
  category: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  country: string;
  business_email: string;
  preferred_language: string;
  currency: string;
  operating_hours: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  website?: string;
  branches_count?: number;
  employees_count?: number;
}

interface BusinessProfileFormProps {
  initialData?: Partial<BusinessFormData>;
  onSubmit: (data: BusinessFormData) => Promise<void>;
  loading?: boolean;
}

const inputClass =
  "w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00BAF2] focus:ring-2 focus:ring-[#00BAF2]/20 transition font-medium text-slate-800";
const labelClass = "block text-[11px] font-semibold text-slate-600 mb-1";

export default function BusinessProfileForm({
  initialData,
  onSubmit,
  loading = false,
}: BusinessProfileFormProps) {
  const [form, setForm] = useState<BusinessFormData>({
    legal_name: initialData?.legal_name || "",
    trading_name: initialData?.trading_name || "",
    business_type: initialData?.business_type || "sole_proprietorship",
    category: initialData?.category || "kirana",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    pin_code: initialData?.pin_code || "",
    country: initialData?.country || "India",
    business_email: initialData?.business_email || "",
    preferred_language: initialData?.preferred_language || "hi",
    currency: initialData?.currency || "INR",
    operating_hours: initialData?.operating_hours || "09:00 AM - 10:00 PM",
    gstin: initialData?.gstin || "",
    pan: initialData?.pan || "",
    cin: initialData?.cin || "",
    website: initialData?.website || "",
    branches_count: initialData?.branches_count || 1,
    employees_count: initialData?.employees_count || 2,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelClass}>Legal Business Name *</label>
          <input
            type="text"
            required
            className={inputClass}
            placeholder="e.g. Ramesh Kumar Sharma Enterprises"
            value={form.legal_name}
            onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>Trading / Store Display Name</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Sharma Super Kirana Store"
            value={form.trading_name}
            onChange={(e) => setForm({ ...form, trading_name: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelClass}>Business Type *</label>
          <select
            className={inputClass}
            value={form.business_type}
            onChange={(e) => setForm({ ...form, business_type: e.target.value })}
          >
            <option value="sole_proprietorship">Sole Proprietorship</option>
            <option value="partnership">Partnership</option>
            <option value="llp">Limited Liability Partnership (LLP)</option>
            <option value="pvt_ltd">Private Limited Company</option>
            <option value="pub_ltd">Public Limited Company</option>
            <option value="other">Other Business Structure</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Category *</label>
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="kirana">Kirana / Grocery Store</option>
            <option value="pharmacy">Pharmacy / Healthcare</option>
            <option value="clothing">Clothing & Apparel</option>
            <option value="restaurant">Restaurant / Eatery / Cafe</option>
            <option value="electronics">Electronics & Mobile</option>
            <option value="general">General Retail & Services</option>
          </select>
        </div>
      </div>

      {/* Address */}
      <div>
        <label className={labelClass}>Business Address *</label>
        <textarea
          rows={2}
          required
          className={inputClass}
          placeholder="Shop / Unit number, Street, Landmark"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>City *</label>
          <input
            type="text"
            required
            className={inputClass}
            placeholder="Mumbai / Delhi"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>State *</label>
          <input
            type="text"
            required
            className={inputClass}
            placeholder="Maharashtra"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>PIN Code *</label>
          <input
            type="text"
            required
            maxLength={6}
            className={inputClass}
            placeholder="400001"
            value={form.pin_code}
            onChange={(e) => setForm({ ...form, pin_code: e.target.value })}
          />
        </div>
      </div>

      {/* Contact & Operating Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelClass}>Business Email</label>
          <input
            type="email"
            className={inputClass}
            placeholder="store@domain.com"
            value={form.business_email}
            onChange={(e) => setForm({ ...form, business_email: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>Preferred Language</label>
          <select
            className={inputClass}
            value={form.preferred_language}
            onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
          </select>
        </div>
      </div>

      {/* Optional Identifiers Accordion / Fields */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
        <p className="text-[11px] font-bold text-slate-700">
          Optional Regulatory Identifiers (Not mandatory for all business structures)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>GSTIN (If registered)</label>
            <input
              type="text"
              maxLength={15}
              className={inputClass + " uppercase"}
              placeholder="27AAPFU0939F1ZV"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
            />
          </div>

          <div>
            <label className={labelClass}>Business / Proprietor PAN</label>
            <input
              type="text"
              maxLength={10}
              className={inputClass + " uppercase"}
              placeholder="ABCDE1234F"
              value={form.pan}
              onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
            />
          </div>

          <div>
            <label className={labelClass}>CIN / LLPIN (For companies)</label>
            <input
              type="text"
              maxLength={21}
              className={inputClass + " uppercase"}
              placeholder="U12345MH2020PTC123456"
              value={form.cin}
              onChange={(e) => setForm({ ...form, cin: e.target.value.toUpperCase() })}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60 mt-4"
        style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Save & Continue to Verification</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
