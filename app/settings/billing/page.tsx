"use client";

import { useEffect, useState } from "react";
import Guard from "@/components/Guard";
import SettingsShell from "@/components/SettingsShell";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";

interface Ledger {
  delta: number;
  reason: string;
  ref_id: string | null;
  created_at: string;
}

const REASON_META: Record<string, { label: string; color: string }> = {
  purchase: { label: "PURCHASE", color: "#4ade80" },
  coupon: { label: "COUPON", color: "#22d3ee" },
  run: { label: "RUN", color: "#818cf8" },
  refund: { label: "REFUND", color: "#fbbf24" },
};

function BillingSection() {
  const { me } = useMe();
  const [ledger, setLedger] = useState<Ledger[] | null>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    void api<{ ledger: Ledger[] }>("/api/billing/credits")
      .then((r) => setLedger(r.ledger))
      .catch(() => setLedger([]));
  }, []);

  const buy = async () => {
    setBuying(true);
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", { method: "POST" });
      window.location.href = url;
    } catch {
      setBuying(false);
    }
  };

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <h1 className="text-[23px] font-semibold tracking-[-.02em]">Billing & credits</h1>
      <p className="text-mut-2 mt-[6px] text-sm">
        Credits pay for agent runs. Token spend happens on your own LLM key.
      </p>

      <div className="flex gap-4 mt-6 flex-wrap">
        <div
          className="flex-1 min-w-[300px] p-[22px] rounded-2xl"
          style={{
            border: "1px solid rgba(129,140,248,.25)",
            background: "linear-gradient(135deg, rgba(99,102,241,.12), rgba(34,211,238,.06))",
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="mono text-[10.5px] tracking-[.08em] text-mut-2 uppercase">Balance</div>
              <div className="text-[30px] font-semibold mt-[6px]">
                {me?.credits ?? 0}
                <span className="text-[14px] text-mut-2 font-normal ml-2">credits</span>
              </div>
            </div>
            <span
              className="px-[10px] py-1 rounded-full text-[11px] font-semibold"
              style={{ color: "#4ade80", background: "rgba(74,222,128,.12)" }}
            >
              1 CREDIT = 1 RUN
            </span>
          </div>
          <div className="flex gap-[10px] mt-[18px]">
            <button
              onClick={() => void buy()}
              disabled={buying}
              className="btn-grad px-[15px] py-[9px] rounded-[10px] text-[13px] disabled:opacity-60"
            >
              {buying ? "Redirecting…" : "Buy 5 for $5"}
            </button>
          </div>
          <div className="mono text-[10.5px] text-mut-3 mt-3">
            Stripe test mode · card 4242 4242 4242 4242
          </div>
        </div>

        <div
          className="flex-1 min-w-[300px] p-[22px] rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)" }}
        >
          <div className="mono text-[10.5px] tracking-[.08em] text-mut-2 uppercase">How billing works</div>
          <ul className="mt-[14px] flex flex-col gap-[10px] text-[13px] text-ink-3">
            <li className="flex gap-[10px]"><span className="text-accent">✓</span>1 credit is deducted when a research run starts</li>
            <li className="flex gap-[10px]"><span className="text-accent">✓</span>Failed runs refund the credit automatically</li>
            <li className="flex gap-[10px]"><span className="text-accent">✓</span>LLM tokens bill to your own key — itemized in Usage</li>
          </ul>
        </div>
      </div>

      <h2 className="text-[15px] font-semibold mt-[30px] mb-3">Activity</h2>
      <div className="rounded-[13px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,.08)" }}>
        {ledger === null ? (
          <div className="px-4 py-5 text-sm text-mut">Loading…</div>
        ) : ledger.length === 0 ? (
          <div className="px-4 py-5 text-sm text-mut">No activity yet.</div>
        ) : (
          ledger.map((l, i) => {
            const meta = REASON_META[l.reason] ?? { label: l.reason.toUpperCase(), color: "#9a9aa6" };
            return (
              <div
                key={i}
                className="flex items-center px-4 py-[13px] text-[13px]"
                style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}
              >
                <span className="flex-[1.4] font-medium">
                  {new Date(l.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="flex-1">
                  <span
                    className="px-[9px] py-[3px] rounded-full text-[11px] mono"
                    style={{ color: meta.color, background: `${meta.color}1c` }}
                  >
                    {meta.label}
                  </span>
                </span>
                <span
                  className="flex-1 mono"
                  style={{ color: l.delta > 0 ? "#4ade80" : "#9a9aa6" }}
                >
                  {l.delta > 0 ? `+${l.delta}` : l.delta}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Guard>
      <SettingsShell>
        <BillingSection />
      </SettingsShell>
    </Guard>
  );
}
