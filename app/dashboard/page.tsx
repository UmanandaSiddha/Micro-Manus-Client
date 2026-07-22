"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Guard from "@/components/Guard";
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

const fmt = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const usd = (n: number) => `$${n.toFixed(4)}`;

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border-c bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void api<Stats>("/api/usage/stats").then(setStats);
  }, []);

  return (
    <Guard>
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Cost & usage</h1>
            <p className="text-sm text-muted mt-1">
              Your LLM spend on your own API key, per chat — split by token type.
            </p>
          </div>
          <Link href="/chat" className="text-sm text-muted hover:text-foreground">
            ← Back to chat
          </Link>
        </div>

        {!stats ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : stats.threads.length === 0 ? (
          <div className="rounded-xl border border-border-c bg-surface p-10 text-center text-muted text-sm">
            No usage yet — run a research question first.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total LLM cost" value={usd(stats.totals.costUsd)} sub={`${stats.totals.runs} research runs`} />
              <StatCard
                label="Saved by caching"
                value={usd(Math.max(0, stats.totals.cacheSavedUsd))}
                sub={`${(stats.totals.cacheHitRate * 100).toFixed(0)}% prompt cache hit rate`}
              />
              <StatCard label="Input tokens" value={fmt(stats.totals.inputTokens)} sub={`+ ${fmt(stats.totals.cacheReadTokens)} cached reads`} />
              <StatCard label="Output tokens" value={fmt(stats.totals.outputTokens)} sub={`+ ${fmt(stats.totals.cacheWriteTokens)} cache writes`} />
            </div>

            <section className="rounded-xl border border-border-c bg-surface overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-border-c">
                    <th className="px-4 py-3 font-medium">Chat</th>
                    <th className="px-3 py-3 font-medium">Model</th>
                    <th className="px-3 py-3 font-medium text-right">Runs</th>
                    <th className="px-3 py-3 font-medium text-right">Input</th>
                    <th className="px-3 py-3 font-medium text-right">Output</th>
                    <th className="px-3 py-3 font-medium text-right">Cache read</th>
                    <th className="px-3 py-3 font-medium text-right">Cache write</th>
                    <th className="px-3 py-3 font-medium text-right">Saved</th>
                    <th className="px-4 py-3 font-medium text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.threads.map((t) => (
                    <tr key={t.threadId} className="border-b border-border-c/60 hover:bg-surface-2/50">
                      <td className="px-4 py-3 max-w-[220px]">
                        <Link href={`/chat/${t.threadId}`} className="hover:text-accent-hover block truncate">
                          {t.title}
                        </Link>
                        {t.perRun.length > 1 && (
                          <div className="flex gap-0.5 mt-1.5 items-end h-3">
                            {t.perRun.map((r) => {
                              const max = Math.max(...t.perRun.map((x) => x.costUsd), 1e-9);
                              return (
                                <span
                                  key={r.runId}
                                  title={usd(r.costUsd)}
                                  className="w-2 bg-accent/60 rounded-sm"
                                  style={{ height: `${Math.max(15, (r.costUsd / max) * 100)}%` }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">{[...new Set(t.modelIds)].join(", ")}</td>
                      <td className="px-3 py-3 text-right">{t.runs}</td>
                      <td className="px-3 py-3 text-right font-mono text-xs">{fmt(t.inputTokens)}</td>
                      <td className="px-3 py-3 text-right font-mono text-xs">{fmt(t.outputTokens)}</td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-emerald-400">{fmt(t.cacheReadTokens)}</td>
                      <td className="px-3 py-3 text-right font-mono text-xs">{fmt(t.cacheWriteTokens)}</td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-emerald-400">
                        {t.cacheSavedUsd > 0 ? usd(t.cacheSavedUsd) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-semibold">{usd(t.costUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="rounded-xl border border-border-c bg-surface p-5">
              <h2 className="font-medium text-sm">What if you had used a different model?</h2>
              <p className="text-xs text-muted mt-1 mb-4">
                Your exact token mix, priced with each model in the registry.
              </p>
              <div className="flex flex-col gap-2">
                {stats.whatIf.map((w) => {
                  const max = Math.max(...stats.whatIf.map((x) => x.costUsd), 1e-9);
                  return (
                    <div key={w.modelId} className="flex items-center gap-3 text-xs">
                      <span className="w-36 shrink-0 text-muted">{w.label}</span>
                      <div className="flex-1 h-4 rounded bg-surface-2 overflow-hidden">
                        <div
                          className="h-full bg-accent/70 rounded"
                          style={{ width: `${Math.max(2, (w.costUsd / max) * 100)}%` }}
                        />
                      </div>
                      <span className="w-20 text-right font-mono">{usd(w.costUsd)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </Guard>
  );
}
