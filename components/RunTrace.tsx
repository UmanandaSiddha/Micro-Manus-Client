"use client";

import Markdown from "./Markdown";
import type { RunView, StepView } from "@/lib/useThread";

function fmtTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function ToolChip({ step }: { step: StepView }) {
  const icon = step.tool === "web_search" ? "🔍" : step.tool === "fetch_url" ? "🌐" : "📄";
  const label = step.running
    ? step.tool === "web_search"
      ? `Searching ${(step.args as { query?: string })?.query ?? "…"}`
      : step.tool === "fetch_url"
        ? `Reading ${hostOf((step.args as { url?: string })?.url)}`
        : `Running ${step.tool}`
    : (step.summary ?? step.tool);

  return (
    <details className="group rounded-lg border border-border-c bg-surface-2/60 text-sm">
      <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span>{icon}</span>
        <span className={step.running ? "animate-pulse text-muted" : "text-foreground/90"}>
          {label}
        </span>
        {!step.running && step.durationMs !== undefined && (
          <span className="ml-auto text-xs text-muted">{(step.durationMs / 1000).toFixed(1)}s</span>
        )}
      </summary>
      <div className="px-3 pb-2 text-xs text-muted font-mono whitespace-pre-wrap break-all">
        {JSON.stringify(step.args, null, 2)}
      </div>
    </details>
  );
}

function hostOf(url?: string): string {
  try {
    return url ? new URL(url).hostname : "…";
  } catch {
    return "…";
  }
}

export default function RunTrace({ run }: { run: RunView }) {
  const steps = run.steps;
  const lastLlm = [...steps].reverse().find((s) => s.kind === "llm" && (s.text ?? "").trim());
  const totals = steps.reduce(
    (a, s) => {
      if (s.usage) {
        a.in += s.usage.inputTokens;
        a.out += s.usage.outputTokens;
        a.cached += s.usage.cacheReadTokens + s.usage.cacheWriteTokens;
      }
      return a;
    },
    { in: 0, out: 0, cached: 0 },
  );

  return (
    <div className="flex flex-col gap-2">
      {steps.map((s) => {
        if (s.kind === "tool") return <ToolChip key={s.index} step={s} />;
        const isFinal = s === lastLlm && run.status !== "running";
        const text = (s.text ?? "").trim();
        if (!text) return null;
        // Intermediate narration = muted; the answer (or live stream) = full.
        if (!isFinal && s !== steps[steps.length - 1] && s.usage) {
          return (
            <p key={s.index} className="text-sm text-muted italic px-1">
              {text.length > 240 ? text.slice(0, 240) + "…" : text}
            </p>
          );
        }
        return (
          <div key={s.index} className="px-1">
            <Markdown>{text}</Markdown>
          </div>
        );
      })}

      {run.status === "running" && (
        <p className="flex items-center gap-2 text-sm text-muted px-1">
          <span className="inline-block size-2 rounded-full bg-accent animate-pulse" />
          Researching…
        </p>
      )}

      {run.status === "failed" && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          Run failed: {run.error ?? "unknown error"}
          {run.creditRefunded && <span className="text-red-400/80"> — credit refunded</span>}
        </div>
      )}

      {(totals.in > 0 || run.costUsd !== undefined) && (
        <p className="text-xs text-muted px-1 font-mono">
          {fmtTokens(totals.in)} in · {fmtTokens(totals.out)} out · {fmtTokens(totals.cached)} cached
          {run.costUsd !== undefined && ` · $${run.costUsd.toFixed(4)}`}
        </p>
      )}
    </div>
  );
}
