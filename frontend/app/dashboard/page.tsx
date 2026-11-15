"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/lib/api";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      router.replace("/sign-in");
    } else {
      router.replace("/home");
    }
  }, [router]);

  return (
    <div
      className="flex-1 flex items-center justify-center min-h-screen"
      style={{ background: "linear-gradient(160deg, #002E6E 0%, #003d8f 50%, #042B62 100%)" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
        >
          <span className="text-white font-black text-2xl">P</span>
        </div>
        <p className="text-sky-200 text-xs font-semibold">Loading your merchant dashboard…</p>
      </div>
    </div>
  );
}
