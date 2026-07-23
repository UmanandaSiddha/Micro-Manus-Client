"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Guard from "@/components/Guard";
import SettingsShell from "@/components/SettingsShell";
import { api } from "@/lib/api";

interface Stats {
  threads: Array<{
    threadId: string;
    title: string;
    modelIds: string[];
    runs: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    costUsd: number;
    cacheSavedUsd: number;
    perRun: Array<{ runId: string; costUsd: number; at: string }>;
  }>;
  totals: {
    costUsd: number;
    cacheSavedUsd: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    runs: number;
    cacheHitRate: number;
  };
  whatIf: Array<{ modelId: string; label: string; costUsd: number }>;
}

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const usd = (n: number) => `$${n.toFixed(4)}`;

function StatCard({ label, value, delta, deltaColor }: { label: string; value: string; delta?: string; deltaColor?: string }) {
  return (
    <div className="p-[18px] rounded-[14px]" style={{ border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)" }}>
      <div className="text-xs text-mut-2">{label}</div>
      <div className="text-[26px] font-semibold tracking-[-.02em] mt-2">{value}</div>
      {delta && (
        <div className="text-[11.5px] mt-1" style={{ color: deltaColor ?? "#6a6a75" }}>
          {delta}
        </div>
      )}
    </div>
  );
}

function UsageSection() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void api<Stats>("/api/usage/stats").then(setStats);
  }, []);

  if (!stats) return <p className="text-sm text-mut">Loading…</p>;

  if (stats.threads.length === 0) {
    return (
      <div style={{ animation: "fadeUp .4s ease both" }}>
        <h1 className="text-[23px] font-semibold tracking-[-.02em]">Usage & cost</h1>
        <div
          className="mt-6 rounded-2xl p-10 text-center text-mut text-sm"
          style={{ border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)" }}
        >
          No usage yet — run a research question first.
        </div>
      </div>
    );
  }

  const t = stats.totals;
  const maxWhatIf = Math.max(...stats.whatIf.map((w) => w.costUsd), 1e-9);

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-[23px] font-semibold tracking-[-.02em]">Usage & cost</h1>
          <p className="text-mut-2 mt-[6px] text-sm">
            Your LLM spend, per chat — split by token type on your own key.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] mt-[22px]">
        <StatCard label="Total LLM cost" value={usd(t.costUsd)} delta={`${t.runs} research runs`} />
        <StatCard
          label="Saved by caching"
          value={usd(Math.max(0, t.cacheSavedUsd))}
          delta={`${(t.cacheHitRate * 100).toFixed(0)}% prompt cache hit rate`}
          deltaColor="#4ade80"
        />
        <StatCard label="Input tokens" value={fmt(t.inputTokens)} delta={`+ ${fmt(t.cacheReadTokens)} cached reads`} />
        <StatCard label="Output tokens" value={fmt(t.outputTokens)} delta={`+ ${fmt(t.cacheWriteTokens)} cache writes`} />
      </div>

      {/* per-thread table */}
      <div className="mt-[22px] rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,.08)" }}>
        <div
          className="flex px-4 py-[11px] mono text-[10.5px] tracking-[.05em] uppercase text-mut-3"
          style={{ background: "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.07)" }}
        >
          <span className="flex-[2]">Chat</span>
          <span className="flex-1 text-right">Runs</span>
          <span className="flex-1 text-right">Input</span>
          <span className="flex-1 text-right">Output</span>
          <span className="flex-1 text-right">Cached</span>
          <span className="flex-1 text-right">Saved</span>
          <span className="flex-1 text-right">Cost</span>
        </div>
        {stats.threads.map((th) => (
          <div
            key={th.threadId}
            className="flex items-center px-4 py-[13px] text-[13px] hover:bg-[rgba(255,255,255,.02)]"
            style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}
          >
            <span className="flex-[2] min-w-0 pr-3">
              <Link href={`/chat/${th.threadId}`} className="block truncate text-ink hover:text-[#c4ccff]">
                {th.title}
              </Link>
              {th.perRun.length > 1 && (
                <span className="flex gap-[3px] mt-[6px] items-end h-[12px]">
                  {th.perRun.map((r) => {
                    const max = Math.max(...th.perRun.map((x) => x.costUsd), 1e-9);
                    return (
                      <span
                        key={r.runId}
                        title={usd(r.costUsd)}
                        className="w-[7px] rounded-[2px]"
                        style={{
                          height: `${Math.max(20, (r.costUsd / max) * 100)}%`,
                          background: "linear-gradient(180deg, #818cf8, #22d3ee)",
                          opacity: 0.7,
                        }}
                      />
                    );
                  })}
                </span>
              )}
            </span>
            <span className="flex-1 text-right">{th.runs}</span>
            <span className="flex-1 text-right mono text-xs">{fmt(th.inputTokens)}</span>
            <span className="flex-1 text-right mono text-xs">{fmt(th.outputTokens)}</span>
            <span className="flex-1 text-right mono text-xs text-accent2">
              {fmt(th.cacheReadTokens + th.cacheWriteTokens)}
            </span>
            <span className="flex-1 text-right mono text-xs text-[#4ade80]">
              {th.cacheSavedUsd > 0 ? usd(th.cacheSavedUsd) : "—"}
            </span>
            <span className="flex-1 text-right mono text-xs font-semibold">{usd(th.costUsd)}</span>
          </div>
        ))}
      </div>

      {/* what-if */}
      <div
        className="mt-5 p-[22px] rounded-2xl"
        style={{ border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)" }}
      >
        <div className="text-sm font-semibold">What if you had used a different model?</div>
        <div className="mono text-[10.5px] text-mut-3 mt-[2px]">
          your exact token mix, priced per registry model
        </div>
        <div className="mt-5 flex flex-col gap-[13px]">
          {stats.whatIf.map((w) => (
            <div key={w.modelId}>
              <div className="flex justify-between text-[12.5px] mb-[6px]">
                <span className="text-ink-2">{w.label}</span>
                <span className="mono text-mut">{usd(w.costUsd)}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(2, (w.costUsd / maxWhatIf) * 100)}%`,
                    background: "linear-gradient(90deg, #818cf8, #22d3ee)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Guard>
      <SettingsShell title="Usage">
        <UsageSection />
      </SettingsShell>
    </Guard>
  );
}
