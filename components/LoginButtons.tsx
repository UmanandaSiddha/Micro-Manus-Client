"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginWithPopup } from "@/lib/auth";
import { useMe } from "@/lib/me";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2 3.5-5 3.5-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-4.9l-.14.01-3.6 2.8-.05.13C3.5 21.3 7.5 24 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.5c-.3-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3l-.01-.16-3.7-2.8-.12.06C.5 8.6 0 10.3 0 12.2s.5 3.6 1.5 5.2l3.8-2.9z" />
      <path fill="#EB4335" d="M12 4.7c2.2 0 3.7 1 4.6 1.8l3.3-3.2C17.9 1.2 15.2 0 12 0 7.5 0 3.5 2.7 1.5 6.9l3.8 2.9C6.2 6.9 8.9 4.7 12 4.7z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.15c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

export default function LoginButtons() {
  const router = useRouter();
  const { refresh } = useMe();
  const [busy, setBusy] = useState<string | null>(null);

  const login = (provider: "google" | "github") => {
    setBusy(provider);
    loginWithPopup(provider, () => {
      void refresh().then(() => {
        setBusy(null);
        router.push("/chat");
      });
    });
  };

  const cls =
    "flex items-center justify-center gap-3 w-full rounded-lg border border-border-c bg-surface px-4 py-3 text-sm font-medium hover:bg-surface-2 transition-colors disabled:opacity-50";

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      <button className={cls} disabled={busy !== null} onClick={() => login("google")}>
        <GoogleIcon />
        {busy === "google" ? "Waiting for Google…" : "Continue with Google"}
      </button>
      <button className={cls} disabled={busy !== null} onClick={() => login("github")}>
        <GithubIcon />
        {busy === "github" ? "Waiting for GitHub…" : "Continue with GitHub"}
      </button>
    </div>
  );
}
