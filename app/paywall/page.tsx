"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Guard from "@/components/Guard";
import { api, ApiError } from "@/lib/api";
import { useMe } from "@/lib/me";

function PaywallInner() {
  const { me, refresh } = useMe();
  const router = useRouter();
  const params = useSearchParams();
  const paid = params.get("paid") === "1";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"pay" | "coupon" | null>(null);
  const [waitingLong, setWaitingLong] = useState(false);
  const polls = useRef(0);

  // Entitled (webhook landed / coupon worked) → into the app.
  useEffect(() => {
    if (me && (me.hasEntitlement || me.credits > 0)) router.replace("/chat");
  }, [me, router]);

  // Back from Stripe: poll /me until the webhook grants credits.
  // Fast for 15s, then keep polling slowly and tell the user what's up
  // (locally this almost always means `stripe listen` isn't running).
  useEffect(() => {
    if (!paid) return;
    const t = setInterval(
      () => {
        polls.current += 1;
        if (polls.current > 15) setWaitingLong(true);
        void refresh();
      },
      waitingLong ? 5000 : 1000,
    );
    return () => clearInterval(t);
  }, [paid, refresh, waitingLong]);

  const pay = async () => {
    setBusy("pay");
    setError(null);
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", {
        method: "POST",
      });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Checkout failed");
      setBusy(null);
    }
  };

  const redeem = async () => {
    setBusy("coupon");
    setError(null);
    try {
      await api("/api/billing/redeem", { method: "POST", json: { code } });
      await refresh(); // effect above routes to /chat
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Redeem failed");
      setBusy(null);
    }
  };

  if (paid) {
    return (
      <main className="flex-1 grid place-items-center px-6">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium">Payment received 🎉</p>
          <p className="text-muted text-sm mt-2">Granting your credits…</p>
          {waitingLong && (
            <div className="mt-6 rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-xs text-amber-300 text-left">
              Still waiting for Stripe&apos;s webhook confirmation. Your payment
              went through — credits appear the moment the webhook lands (we
              keep checking automatically).
              <span className="block mt-2 text-amber-300/80">
                Running locally? Make sure{" "}
                <code className="font-mono">stripe listen</code> is forwarding
                to the API and <code className="font-mono">STRIPE_WEBHOOK_SECRET</code>{" "}
                is set.
              </span>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center mb-10 max-w-md">
        <h1 className="text-2xl font-semibold">Unlock MicroManus</h1>
        <p className="text-muted mt-2 text-sm">
          5 research credits — each credit is one full deep-research run. Your
          LLM usage runs on your own API key.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <div className="rounded-xl border border-border-c bg-surface p-6 flex flex-col">
          <p className="font-medium">Buy credits</p>
          <p className="text-3xl font-semibold mt-3">
            $5<span className="text-sm text-muted font-normal"> / 5 credits</span>
          </p>
          <div className="mt-3 rounded-md bg-surface-2 border border-border-c px-3 py-2 text-xs text-muted">
            <span className="text-amber-400 font-medium">Test mode</span> — use
            card <span className="font-mono text-foreground">4242 4242 4242 4242</span>,
            any future expiry, any CVC.
          </div>
          <button
            onClick={() => void pay()}
            disabled={busy !== null}
            className="mt-auto pt-5"
          >
            <span className="block rounded-lg bg-accent hover:bg-accent-hover transition-colors px-4 py-2.5 text-sm font-medium text-white">
              {busy === "pay" ? "Redirecting…" : "Pay with card"}
            </span>
          </button>
        </div>

        <div className="rounded-xl border border-border-c bg-surface p-6 flex flex-col">
          <p className="font-medium">Have a coupon?</p>
          <p className="text-muted text-sm mt-1">
            Redeem it for 5 free credits.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="COUPON CODE"
            className="mt-4 rounded-lg bg-surface-2 border border-border-c px-3 py-2.5 text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:border-accent"
            onKeyDown={(e) => e.key === "Enter" && code && void redeem()}
          />
          <button
            onClick={() => void redeem()}
            disabled={busy !== null || !code.trim()}
            className="mt-auto pt-5"
          >
            <span className="block rounded-lg border border-border-c bg-surface-2 hover:bg-border-c transition-colors px-4 py-2.5 text-sm font-medium disabled:opacity-50">
              {busy === "coupon" ? "Redeeming…" : "Redeem coupon"}
            </span>
          </button>
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}
    </main>
  );
}

export default function PaywallPage() {
  return (
    <Guard requireEntitlement={false}>
      <Suspense>
        <PaywallInner />
      </Suspense>
    </Guard>
  );
}
