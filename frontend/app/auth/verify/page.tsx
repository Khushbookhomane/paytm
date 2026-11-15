"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest, storeAuthResponse, AuthResponse } from "@/lib/api";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

function VerifyMagicLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("No sign-in token found in the link. Please request a new one.");
      return;
    }

    apiRequest<AuthResponse>("/auth/magic-link/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then((data) => {
        storeAuthResponse(data);
        setStatus("success");
        setTimeout(() => {
          const user = data.user;
          if (user?.onboarding_complete) {
            router.replace("/home");
          } else if (user?.organization_id) {
            router.replace("/onboarding");
          } else {
            router.replace("/onboarding/business");
          }
        }, 1200);
      })
      .catch((err) => {
        setStatus("error");
        setError(err.message || "This sign-in link is invalid or has expired.");
      });
  }, [searchParams, router]);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #002E6E 0%, #003d8f 50%, #042B62 100%)" }}
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
        {status === "verifying" && (
          <>
            <Loader2 className="w-10 h-10 text-[#00BAF2] animate-spin mx-auto mb-4" />
            <h2 className="font-bold text-slate-900 text-lg">Verifying your link…</h2>
            <p className="text-xs text-slate-500 mt-1">Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="font-bold text-slate-900 text-lg">Signed in successfully!</h2>
            <p className="text-xs text-slate-500 mt-1">Redirecting to your dashboard…</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="font-bold text-slate-900 text-lg">Link invalid or expired</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
            <button
              onClick={() => router.replace("/sign-in")}
              className="w-full py-3 text-white font-bold text-sm rounded-xl"
              style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyMagicLinkPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex-1 flex items-center justify-center min-h-screen"
          style={{ background: "linear-gradient(160deg, #002E6E 0%, #003d8f 50%, #042B62 100%)" }}
        >
          <Loader2 className="w-8 h-8 text-[#00BAF2] animate-spin" />
        </div>
      }
    >
      <VerifyMagicLinkContent />
    </Suspense>
  );
}
