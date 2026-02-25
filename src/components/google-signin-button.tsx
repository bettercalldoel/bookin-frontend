"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchWithHeaders } from "@/lib/api";
import { extractTokenFromAuthHeader, setAuthToken } from "@/lib/auth-client";
import { useAppLocaleValue } from "@/hooks/use-app-locale";

type LoginResponse = {
  account: { type: "USER" | "TENANT" };
};

type GoogleSignInButtonProps = {
  accountType: "USER" | "TENANT";
  className?: string;
};

const resolveRouteByAccountType = (accountType: "USER" | "TENANT") =>
  accountType === "TENANT" ? "/tenant-dashboard" : "/profile";

const requestGoogleLogin = (credential: string, accountType: "USER" | "TENANT") =>
  apiFetchWithHeaders<LoginResponse>("/auth/login/google", {
    method: "POST",
    body: JSON.stringify({ idToken: credential, accountType }),
  });

const saveGoogleToken = (headers: Headers, missingTokenMessage: string) => {
  const token = extractTokenFromAuthHeader(headers.get("authorization"));
  if (!token) throw new Error(missingTokenMessage);
  setAuthToken(token);
};

export default function GoogleSignInButton({
  accountType,
  className,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const locale = useAppLocaleValue();
  const copy = {
    tokenMissing: locale === "en" ? "Token not found." : "Token tidak ditemukan.",
    failed: locale === "en" ? "Google sign-in failed." : "Gagal masuk dengan Google.",
    processing:
      locale === "en"
        ? "Processing Google sign-in..."
        : "Memproses masuk dengan Google...",
  };
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const accountTypeRef = useRef(accountType);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    accountTypeRef.current = accountType;
  }, [accountType]);

  const handleCredential = async function (credential: string) {
    setError("");
    setIsLoading(true);
    try {
      const { data, headers } = await requestGoogleLogin(
        credential,
        accountTypeRef.current,
      );
      saveGoogleToken(headers, copy.tokenMissing);
      router.push(resolveRouteByAccountType(data.account.type));
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.failed;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    const scriptId = "google-identity";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = scriptId;
      document.body.appendChild(script);
    }

    let interval = window.setInterval(() => {
      if (window.google?.accounts?.id && containerRef.current) {
        window.clearInterval(interval);
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              handleCredential(response.credential);
            } else {
              setError(copy.failed);
            }
          },
        });
        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width: "100%",
          shape: "pill",
          text: "signin_with",
        });
        setIsReady(true);
      }
    }, 200);

    return () => window.clearInterval(interval);
  }, [googleClientId, accountType]);

  return (
    <div className={`flex w-full flex-col ${className ?? ""}`}>
      <div
        ref={containerRef}
        className="h-12 w-full overflow-hidden rounded-full [&_iframe]:h-12 [&_iframe]:w-full"
      />
      {error ? (
        <p className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}
      {isLoading ? (
        <p className="mt-2 text-xs text-slate-500">{copy.processing}</p>
      ) : null}
    </div>
  );
}
