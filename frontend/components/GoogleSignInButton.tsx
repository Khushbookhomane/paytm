"use client";

import React, { useState } from "react";
import { Chrome } from "lucide-react";

interface GoogleSignInButtonProps {
  text?: string;
  className?: string;
}

export default function GoogleSignInButton({
  text = "Continue with Google",
  className = "",
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    window.location.href = `${backendUrl}/auth/google/login`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] transition font-semibold text-sm text-slate-700 shadow-sm disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
      ) : (
        <Chrome className="w-5 h-5 text-[#4285F4]" />
      )}
      <span>{text}</span>
    </button>
  );
}
