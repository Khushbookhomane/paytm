"use client";

import React, { useState } from "react";
import { KeyRound, ShieldCheck, AlertCircle } from "lucide-react";
import { apiRequest, storeAuthResponse } from "@/lib/api";
import { useRouter } from "next/navigation";

interface PasskeyButtonProps {
  mode?: "login" | "register";
  text?: string;
  onSuccess?: () => void;
  className?: string;
}

// Convert base64 / base64url string to Uint8Array
function base64ToUint8Array(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

// Convert ArrayBuffer to base64url
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export default function PasskeyButton({
  mode = "login",
  text = mode === "login" ? "Sign in with Passkey (for previously registered devices)" : "Register Passkey",
  onSuccess,
  className = "",
}: PasskeyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasskeyAction = async () => {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      setError("Passkeys / WebAuthn are not supported on this browser or device.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        // 1. Get options
        const options: any = await apiRequest("/auth/passkeys/login/options", {
          method: "POST",
          body: JSON.stringify({}),
        });

        // Prepare challenge
        const challengeBytes = base64ToUint8Array(options.challenge);
        const allowCredentials = (options.allowCredentials || []).map((cred: any) => ({
          ...cred,
          id: base64ToUint8Array(cred.id),
        }));

        // 2. Browser get credentials
        const assertion = (await navigator.credentials.get({
          publicKey: {
            ...options,
            challenge: challengeBytes,
            allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
          },
        })) as any;

        if (!assertion) {
          throw new Error("Passkey authentication was cancelled.");
        }

        // 3. Verify
        const assertionResponse = {
          id: assertion.id,
          rawId: arrayBufferToBase64Url(assertion.rawId),
          type: assertion.type,
          response: {
            authenticatorData: arrayBufferToBase64Url(assertion.response.authenticatorData),
            clientDataJSON: arrayBufferToBase64Url(assertion.response.clientDataJSON),
            signature: arrayBufferToBase64Url(assertion.response.signature),
            userHandle: assertion.response.userHandle
              ? arrayBufferToBase64Url(assertion.response.userHandle)
              : null,
          },
        };

        const authRes: any = await apiRequest("/auth/passkeys/login/verify", {
          method: "POST",
          body: JSON.stringify(assertionResponse),
        });

        storeAuthResponse(authRes);
        if (onSuccess) onSuccess();
        else router.push(authRes.user?.onboarding_complete ? "/dashboard" : "/onboarding");
      } else {
        // Register mode
        const options: any = await apiRequest("/auth/passkeys/register/options", {
          method: "POST",
          body: JSON.stringify({}),
        });

        const challengeBytes = base64ToUint8Array(options.challenge);
        const userBytes = base64ToUint8Array(options.user.id);
        const excludeCredentials = (options.excludeCredentials || []).map((cred: any) => ({
          ...cred,
          id: base64ToUint8Array(cred.id),
        }));

        const credential = (await navigator.credentials.create({
          publicKey: {
            ...options,
            challenge: challengeBytes,
            user: {
              ...options.user,
              id: userBytes,
            },
            excludeCredentials: excludeCredentials.length > 0 ? excludeCredentials : undefined,
          },
        })) as any;

        if (!credential) {
          throw new Error("Passkey creation was cancelled.");
        }

        const registrationResponse = {
          id: credential.id,
          rawId: arrayBufferToBase64Url(credential.rawId),
          type: credential.type,
          device_name: navigator.userAgent.includes("Windows")
            ? "Windows Hello"
            : navigator.userAgent.includes("Mac")
            ? "Touch ID / iCloud Keychain"
            : "Device Biometrics",
          response: {
            attestationObject: arrayBufferToBase64Url(credential.response.attestationObject),
            clientDataJSON: arrayBufferToBase64Url(credential.response.clientDataJSON),
          },
        };

        await apiRequest("/auth/passkeys/register/verify", {
          method: "POST",
          body: JSON.stringify(registrationResponse),
        });

        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Passkey operation failed. Please use email sign-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handlePasskeyAction}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] transition font-medium text-xs text-slate-700 disabled:opacity-60 ${className}`}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <KeyRound className="w-4 h-4 text-[#002E6E]" />
        )}
        <span>{text}</span>
      </button>

      {error && (
        <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
