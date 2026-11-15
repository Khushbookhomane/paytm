"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { authStorage } from "@/lib/api";

interface StatementUploadProps {
  bankAccountId?: number;
  onSuccess?: (result: any) => void;
}

export default function StatementUpload({ bankAccountId, onSuccess }: StatementUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (bankAccountId) formData.append("bank_account_id", bankAccountId.toString());

    try {
      const token = authStorage.getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/imports/statements`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Upload failed." }));
        throw new Error(errData.detail || "Statement processing failed.");
      }

      const data = await res.json();
      setResult(data);
      if (onSuccess) onSuccess(data);
    } catch (err: any) {
      setError(err.message || "Failed to upload statement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900">Upload Bank Statement (CSV or PDF)</h4>
        <p className="text-xs text-slate-500 mt-0.5">
          If Account Aggregator is unavailable, you can upload bank statements directly.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-800">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{result.message}</span>
          </div>
          <p className="text-[11px] text-emerald-700">
            File: <strong>{result.filename}</strong> · Transactions Imported: <strong>{result.transactions_imported}</strong>
          </p>
          <button
            type="button"
            onClick={() => { setResult(null); setFile(null); }}
            className="text-xs text-[#00BAF2] font-semibold hover:underline pt-1 block"
          >
            Upload another statement
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="space-y-3">
          <label className="border-2 border-dashed border-slate-200 hover:border-[#00BAF2] transition rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-sky-50/30">
            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-semibold text-slate-700">
              {file ? file.name : "Click to select statement file (CSV or PDF)"}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Max size: 10MB</span>
            <input
              type="file"
              accept=".csv,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
            />
          </label>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
          >
            {loading ? "Processing Statement..." : "Upload & Normalize Statement"}
          </button>
        </form>
      )}
    </div>
  );
}
