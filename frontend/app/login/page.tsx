"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy /login route — redirects to new /sign-in page. */
export default function LegacyLoginRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/sign-in"); }, [router]);
  return null;
}
