const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Merchant {
  id: number;
  name: string;
  email: string;
  category: string;
  language: string;
  plan: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  language: string;
  plan: string;
  category: string;
  onboarding_complete: boolean;
  organization_id?: number | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  merchant: Merchant | User | null; // legacy compat
}

// ---------------------------------------------------------------------------
// Token / session storage
// ---------------------------------------------------------------------------

export const authStorage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("venture_ai_token");
  },
  setToken: (token: string) => {
    if (typeof window !== "undefined") localStorage.setItem("venture_ai_token", token);
  },
  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const str = localStorage.getItem("venture_ai_user");
    if (!str) return null;
    try { return JSON.parse(str); } catch { return null; }
  },
  setUser: (user: User) => {
    if (typeof window !== "undefined") localStorage.setItem("venture_ai_user", JSON.stringify(user));
  },
  // Legacy compat — existing pages read getMerchant()
  getMerchant: (): Merchant | null => {
    if (typeof window === "undefined") return null;
    const str = localStorage.getItem("venture_ai_merchant");
    if (!str) {
      // Fall back to user shape
      const user = authStorage.getUser();
      if (!user) return null;
      return { id: user.id, name: user.name || user.email, email: user.email,
               category: user.category, language: user.language, plan: user.plan };
    }
    try { return JSON.parse(str); } catch { return null; }
  },
  setMerchant: (merchant: Merchant | User) => {
    if (typeof window !== "undefined")
      localStorage.setItem("venture_ai_merchant", JSON.stringify(merchant));
  },
  getLanguage: (): "en" | "hi" | "mr" => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("venture_ai_lang") as "en" | "hi" | "mr") || "en";
  },
  setLanguage: (lang: "en" | "hi" | "mr") => {
    if (typeof window !== "undefined") localStorage.setItem("venture_ai_lang", lang);
  },
  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("venture_ai_token");
      localStorage.removeItem("venture_ai_user");
      localStorage.removeItem("venture_ai_merchant");
    }
  },
};

// ---------------------------------------------------------------------------
// Persist auth response from any login method
// ---------------------------------------------------------------------------

export function storeAuthResponse(data: AuthResponse) {
  authStorage.setToken(data.access_token);
  if (data.user) {
    authStorage.setUser(data.user);
    authStorage.setMerchant(data.user);
    authStorage.setLanguage((data.user.language as "en" | "hi" | "mr") || "en");
  }
  if (data.merchant) {
    authStorage.setMerchant(data.merchant as Merchant);
  }
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    authStorage.clear();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/sign-in")) {
      window.location.href = "/sign-in";
    }
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}
