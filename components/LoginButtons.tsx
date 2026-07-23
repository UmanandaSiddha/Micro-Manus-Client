"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginWithPopup } from "@/lib/auth";
import { useMe } from "@/lib/me";

function GoogleDot() {
  return (
    <span
      className="w-[17px] h-[17px] rounded-full shrink-0"
      style={{ background: "conic-gradient(from -45deg, #ea4335, #fbbc05, #34a853, #4285f4, #ea4335)" }}
    />
  );
}
function GithubDot() {
  return <span className="w-4 h-4 rounded-full shrink-0 bg-[#e9e9ee]" />;
}

export default function LoginButtons() {
  const router = useRouter();
  const { refresh } = useMe();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const login = async (provider: "google" | "github") => {
    setBusy(provider);
    setError(null);
    try {
      await loginWithPopup(provider); // Firebase signInWithPopup + cookie exchange
      await refresh();
      router.push("/chat");
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (!code.includes("popup-closed") && !code.includes("cancelled")) {
        setError((e as Error).message ?? "Sign-in failed");
      }
    } finally {
      setBusy(null);
    }
  };

  const cls =
    "flex items-center justify-center gap-[11px] w-full p-3 rounded-[11px] text-sm font-medium cursor-pointer transition-colors";

  return (
    <div className="flex flex-col gap-[10px] w-full">
      <button
        className={cls}
        style={{ border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.09)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.05)")}
        disabled={busy !== null}
        onClick={() => void login("google")}
      >
        <GoogleDot />
        {busy === "google" ? "Waiting for Google…" : "Continue with Google"}
      </button>
      <button
        className={cls}
        style={{ border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.09)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.05)")}
        disabled={busy !== null}
        onClick={() => void login("github")}
      >
        <GithubDot />
        {busy === "github" ? "Waiting for GitHub…" : "Continue with GitHub"}
      </button>
      {error && <p className="text-xs text-[#ff7a7a] text-center">{error}</p>}
    </div>
  );
}
