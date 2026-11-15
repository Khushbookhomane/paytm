"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/lib/api";

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = authStorage.getToken();
      if (token) {
        router.replace("/home");
      } else {
        router.replace("/sign-in");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, #002E6E 0%, #003d8f 50%, #042B62 100%)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
          style={{ background: "linear-gradient(135deg, #00BAF2 0%, #00a3d4 100%)" }}
        >
          <span className="text-white font-black text-4xl leading-none tracking-tight">P</span>
        </div>
        <div className="text-center">
          <h1 className="text-white font-black text-3xl tracking-tight leading-none">VentureAI</h1>
          <p className="text-[#00BAF2] text-xs font-bold uppercase tracking-[0.2em] mt-1">by Paytm · for business</p>
        </div>
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[#00BAF2] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
