"use client";

import React, { Suspense } from "react";
import VerifyMagicLinkPage from "../auth/verify/page";

export default function VerifyEmailRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#002E6E] text-white">Loading verification...</div>}>
      <VerifyMagicLinkPage />
    </Suspense>
  );
}
