"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Guard from "@/components/Guard";
import Logo from "@/components/Logo";
import { api, ApiError } from "@/lib/api";
import { useMe } from "@/lib/me";

const PACK_FEATURES = [
  "5 full deep-research runs",
  "Live agent timeline with sources",
  "Typeset PDF report artifacts",
  "Failed runs refund automatically",
];
const COUPON_FEATURES = [
  "Same 5 research credits",
  "No card required",
  "Instant activation",
];

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

  useEffect(() => {
    if (me && (me.hasEntitlement || me.credits > 0)) router.replace("/chat");
  }, [me, router]);

  // Back from Stripe: poll /me until the webhook grants credits.
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
      const { url } = await api<{ url: string }>("/api/billing/checkout", { method: "POST" });
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
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Redeem failed");
      setBusy(null);
    }
  };

  if (paid) {
    return (
      <main className="flex-1 grid place-items-center px-6">
        <div className="text-center max-w-md" style={{ animation: "fadeUp .5s ease both" }}>
          <div className="mx-auto mb-5 w-[15px] h-[15px] rounded-full border-2 border-[rgba(129,140,248,.3)] border-t-accent" style={{ animation: "spin .7s linear infinite" }} />
          <p className="text-lg font-medium">Payment received 🎉</p>
          <p className="text-mut text-sm mt-2">Granting your credits…</p>
          {waitingLong && (
            <div
              className="mt-6 rounded-xl px-4 py-3 text-xs text-left"
              style={{ border: "1px solid rgba(245,158,11,.2)", background: "rgba(245,158,11,.06)", color: "#d3b982" }}
            >
              Still waiting for Stripe&apos;s webhook confirmation. Your payment went
              through — credits appear the moment it lands (we keep checking).
              <span className="block mt-2 opacity-80">
                Running locally? Make sure <code className="mono">stripe listen</code> is
                forwarding and <code className="mono">STRIPE_WEBHOOK_SECRET</code> is set.
              </span>
            </div>
          )}
        </div>
      </main>
    );
  }

  const cardBase: React.CSSProperties = {
    width: 320,
    padding: "28px 26px",
    borderRadius: 20,
    backdropFilter: "blur(16px)",
  };

  return (
    <main className="flex-1 overflow-auto px-8 py-16 flex flex-col items-center">
      <div className="mb-8" style={{ animation: "fadeUp .4s ease both" }}>
        <Logo size={26} textSize={16} />
      </div>
      <div className="text-center" style={{ animation: "fadeUp .5s ease both" }}>
        <h1 className="serif font-normal" style={{ fontSize: "clamp(34px, 4.6vw, 52px)", letterSpacing: "-.02em" }}>
          Unlock your research agent
        </h1>
        <p className="text-mut mt-3 text-[15.5px]">
          One flat pack of credits. Your LLM usage runs on your own key.
        </p>
      </div>

      <div className="flex gap-[18px] mt-10 flex-wrap justify-center" style={{ animation: "fadeUp .6s .08s ease both" }}>
        {/* Credit pack */}
        <div
          className="relative"
          style={{
            ...cardBase,
            border: "1px solid rgba(129,140,248,.35)",
            background: "linear-gradient(135deg, rgba(99,102,241,.12), rgba(34,211,238,.05))",
            boxShadow: "0 24px 70px -18px rgba(99,102,241,.35)",
          }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 grad px-3 py-1 rounded-full text-[11px] font-semibold text-[#0a0a12]"
            style={{ top: -11 }}
          >
            TEST MODE
          </div>
          <div className="text-[15px] font-semibold">Starter pack</div>
          <p className="text-mut-2 text-[13px] mt-[5px] min-h-[34px]">
            Pay with any test card — this is a demo checkout.
          </p>
          <div className="flex items-baseline gap-[5px] mt-[14px]">
            <span className="text-[38px] font-semibold tracking-[-.03em]">$5</span>
            <span className="text-mut-3 text-[13px]">/ 5 credits</span>
          </div>
          <button
            onClick={() => void pay()}
            disabled={busy !== null}
            className="btn-grad w-full mt-[18px] py-[11px] rounded-[11px] text-[13.5px] disabled:opacity-50"
          >
            {busy === "pay" ? "Redirecting…" : "Pay with card"}
          </button>
          <div className="mono text-[10.5px] text-mut-3 mt-3 text-center">
            card 4242 4242 4242 4242 · any future date · any CVC
          </div>
          <div className="h-px my-5" style={{ background: "rgba(255,255,255,.08)" }} />
          {PACK_FEATURES.map((f) => (
            <div key={f} className="flex gap-[10px] items-start mb-[11px] text-[13px] text-ink-3">
              <span className="text-accent shrink-0 mt-px">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div
          style={{
            ...cardBase,
            border: "1px solid rgba(255,255,255,.1)",
            background: "rgba(255,255,255,.03)",
          }}
        >
          <div className="text-[15px] font-semibold">Have a coupon?</div>
          <p className="text-mut-2 text-[13px] mt-[5px] min-h-[34px]">
            Redeem it and skip the card entirely.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && code.trim() && void redeem()}
            placeholder="COUPON CODE"
            className="mono w-full mt-[14px] px-[14px] py-3 rounded-[11px] text-sm uppercase placeholder:normal-case placeholder:font-sans"
            style={{ border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.25)" }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#818cf8";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(129,140,248,.16)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,.12)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            onClick={() => void redeem()}
            disabled={busy !== null || !code.trim()}
            className="btn-ghost w-full mt-[14px] py-[11px] rounded-[11px] text-[13.5px] font-semibold disabled:opacity-50"
          >
            {busy === "coupon" ? "Redeeming…" : "Redeem coupon"}
          </button>
          <div className="h-px my-5" style={{ background: "rgba(255,255,255,.08)" }} />
          {COUPON_FEATURES.map((f) => (
            <div key={f} className="flex gap-[10px] items-start mb-[11px] text-[13px] text-ink-3">
              <span className="text-accent2 shrink-0 mt-px">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-[#ff7a7a]">{error}</p>}
      <p className="mt-8 text-mut-3 text-xs max-w-[46ch] text-center leading-relaxed">
        Credits pay for agent runs on our side. Token spend happens on your own
        LLM API key and is itemized on the cost dashboard.
      </p>
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
