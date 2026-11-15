"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { apiRequest, authStorage } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";

interface Member {
  id: number;
  user_id: number;
  role: string;
  status: string;
  email: string;
  name?: string;
  is_current_user?: boolean;
  created_at?: string;
}

const ROLES = [
  { key: "OWNER", label: "Owner", desc: "Full administrative access and organization ownership." },
  { key: "ADMIN", label: "Admin", desc: "Manage members, credentials, and business integrations." },
  { key: "ACCOUNTANT", label: "Accountant", desc: "Access bank verifications, financial data, and reports." },
  { key: "STAFF", label: "Staff", desc: "Sales recording, inventory tracking, and campaign sends." },
  { key: "READ_ONLY", label: "Read-Only", desc: "View dashboards and metrics without permission to edit." },
];

export default function TeamPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("STAFF");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authStorage.getToken()) {
      router.replace("/sign-in");
      return;
    }
    setLang(authStorage.getLanguage());
    fetchMembers();
  }, [router]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<Member[]>("/organizations/members");
      setMembers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest("/organizations/members", {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      setSuccess(`Invited ${inviteEmail} as ${inviteRole}`);
      setInviteEmail("");
      setShowInviteModal(false);
      await fetchMembers();
    } catch (err: any) {
      setError(err.message || "Failed to invite member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: number, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from this organization?`)) return;

    setError(null);
    try {
      await apiRequest(`/organizations/members/${userId}`, { method: "DELETE" });
      setSuccess(`Removed ${email} from organization.`);
      await fetchMembers();
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case "OWNER":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "ADMIN":
        return "bg-sky-100 text-[#002E6E] border-sky-200";
      case "ACCOUNTANT":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "STAFF":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-[#F4F6F9]">
      <Header currentLang={lang} onLanguageChange={(l) => { setLang(l); authStorage.setLanguage(l); }} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4 pb-12">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00BAF2]" />
              <span>Team Members & Access Control</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage organization members and assign role-based permissions.
            </p>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
            style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Members Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Active Organization Members ({members.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading members…</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No members found.</div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4">Member</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Joined</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id || m.user_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#00BAF2]/10 text-[#002E6E] font-bold text-xs flex items-center justify-center">
                            {(m.name || m.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{m.name || m.email.split("@")[0]}</span>
                              {m.is_current_user && (
                                <span className="text-[10px] text-[#00BAF2] font-semibold bg-sky-50 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </p>
                            <span className="text-[11px] text-slate-500 font-mono">{m.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(
                            m.role
                          )}`}
                        >
                          {m.role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{m.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString() : "Active"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!m.is_current_user && m.role !== "OWNER" && (
                          <button
                            onClick={() => handleRemoveMember(m.user_id, m.email)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Role Permissions Reference Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00BAF2]" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Role-Based Access Control Matrix
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {ROLES.map((r) => (
              <div key={r.key} className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <span className="text-xs font-bold text-slate-900">{r.label}</span>
                <p className="text-[11px] text-slate-500 leading-tight">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Invite Team Member</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="teammate@venture.ai"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#00BAF2]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#00BAF2] bg-white"
                  >
                    {ROLES.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label} - {r.desc.slice(0, 30)}…
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow transition active:scale-95 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
                  >
                    {submitting ? "Sending Invite…" : "Send Organization Invite"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Navigation currentLang={lang} />
    </div>
  );
}
