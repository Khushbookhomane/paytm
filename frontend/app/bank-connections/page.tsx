"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import BankConnectionCard from "@/components/BankConnectionCard";
import StatementUpload from "@/components/StatementUpload";
import BankVerificationForm from "@/components/BankVerificationForm";
import { apiRequest, authStorage } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  Landmark,
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  ArrowUpDown,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface BankAccount {
  id: number;
  bank_name?: string;
  account_number_masked?: string;
  ifsc_code: string;
  account_holder_name?: string;
  verification_status: string;
}

interface FinancialConsent {
  id: number;
  provider: string;
  consent_reference: string;
  purpose?: string;
  data_range?: string;
  status: string;
  expires_at?: string;
  revoked_at?: string;
}

interface StatementImport {
  id: number;
  filename: string;
  file_format: string;
  total_rows: number;
  status: string;
  created_at: string;
}

interface BankTransaction {
  id: number;
  transaction_date: string;
  amount: number;
  transaction_type: string;
  category?: string;
  description?: string;
}

export default function BankConnectionsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [activeTab, setActiveTab] = useState<"accounts" | "aa" | "statements" | "transactions">("accounts");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [consents, setConsents] = useState<FinancialConsent[]>([]);
  const [statements, setStatements] = useState<StatementImport[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!authStorage.getToken()) {
      router.replace("/sign-in");
      return;
    }
    setLang(authStorage.getLanguage());
    loadAllData();
  }, [router]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [accRes, consentRes, stmtRes, txRes] = await Promise.allSettled([
        apiRequest<BankAccount[]>("/bank/accounts"),
        apiRequest<FinancialConsent[]>("/bank/connections"),
        apiRequest<StatementImport[]>("/imports"),
        apiRequest<BankTransaction[]>("/bank/transactions"),
      ]);

      if (accRes.status === "fulfilled") setAccounts(accRes.value || []);
      if (consentRes.status === "fulfilled") setConsents(consentRes.value || []);
      if (stmtRes.status === "fulfilled") setStatements(stmtRes.value || []);
      if (txRes.status === "fulfilled") setTransactions(txRes.value || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      t.amount.toString().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-[#F4F6F9]">
      <Header currentLang={lang} onLanguageChange={(l) => { setLang(l); authStorage.setLanguage(l); }} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4 pb-12">
        {/* Page Title & Navigation Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#00BAF2]" />
              <span>Bank & Financial Connections</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage bank account verification, Account Aggregator consent, and statement imports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
              style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Verify New Account</span>
            </button>
            <button
              onClick={loadAllData}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition shadow-2xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Regulatory Sandbox Transparency Banner */}
        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-[#00BAF2] shrink-0" />
            <span>RBI-Regulated Account Aggregator Sandbox Active</span>
          </div>
          <p className="text-[11px] text-sky-800 leading-relaxed">
            In compliance with Reserve Bank of India directions, financial data connections operate under official sandbox protocols. Live financial pulls require confirmed FIU license arrangements. Direct statement import remains fully active.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: "accounts", label: `Bank Accounts (${accounts.length})`, icon: Landmark },
            { id: "aa", label: `Account Aggregator (${consents.length})`, icon: ShieldCheck },
            { id: "statements", label: `Statement Uploads (${statements.length})`, icon: FileSpreadsheet },
            { id: "transactions", label: `Transactions (${transactions.length})`, icon: ArrowUpDown },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? "border-[#00BAF2] text-[#002E6E]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#00BAF2]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Bank Accounts */}
        {activeTab === "accounts" && (
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Bank Accounts Linked Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Verify your business bank account ownership via automated penny-drop verification.
                </p>
                <button
                  onClick={() => setShowAddAccountModal(true)}
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs"
                  style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
                >
                  Verify Bank Account Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {accounts.map((acc) => {
                  const isVerified = acc.verification_status === "VERIFIED";
                  const isReview = acc.verification_status === "REQUIRES_REVIEW";
                  return (
                    <div
                      key={acc.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-[#002E6E]">
                            <Landmark className="w-5 h-5 text-slate-700" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">
                              {acc.bank_name || "Commercial Bank"}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono">
                              A/C: {acc.account_number_masked || "••••••••"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isVerified
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isReview
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {acc.verification_status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Account Holder:</span>
                          <span className="font-semibold">{acc.account_holder_name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">IFSC Code:</span>
                          <span className="font-mono font-semibold">{acc.ifsc_code}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Account Aggregator Consents */}
        {activeTab === "aa" && (
          <div className="space-y-3">
            {consents.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Account Aggregator Consents</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Initiate a consent request via Setu or Finvu to share read-only bank data.
                </p>
                <button
                  onClick={() => router.push("/onboarding/bank-consent")}
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs"
                  style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
                >
                  Initiate Consent Request
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {consents.map((consent) => (
                  <BankConnectionCard
                    key={consent.id}
                    connection={consent}
                    onRevoked={loadAllData}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Statement Uploads */}
        {activeTab === "statements" && (
          <div className="space-y-4">
            <StatementUpload onSuccess={loadAllData} />

            {statements.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Uploaded Statements History
                </h4>
                <div className="divide-y divide-slate-100">
                  {statements.map((stmt) => (
                    <div key={stmt.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-800">{stmt.filename}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(stmt.created_at).toLocaleDateString()} · {stmt.total_rows} rows parsed
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {stmt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Normalized Transactions */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Normalized Bank Feed ({filteredTransactions.length} records)
              </h4>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search description or category…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00BAF2]"
                />
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No transactions match your search query.
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Narration</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => {
                      const isCredit = tx.transaction_type === "CREDIT";
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {tx.transaction_date}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {tx.description || "Bank Transaction"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {tx.category || "General"}
                            </span>
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-bold font-mono ${
                              isCredit ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isCredit ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal for adding/verifying bank account */}
        {showAddAccountModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Verify Bank Account</h3>
                <button
                  onClick={() => setShowAddAccountModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕ Close
                </button>
              </div>

              <BankVerificationForm
                onSuccess={() => {
                  setShowAddAccountModal(false);
                  loadAllData();
                }}
              />
            </div>
          </div>
        )}
      </main>

      <Navigation currentLang={lang} />
    </div>
  );
}
