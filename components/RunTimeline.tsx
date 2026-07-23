"use client";

import { useState } from "react";
import Markdown from "./Markdown";
import type { RunView, StepView } from "@/lib/useThread";

const CHIP: Record<string, { label: string; color: string }> = {
  think: { label: "THINK", color: "#a78bfa" },
  reason: { label: "REASON", color: "#818cf8" },
  web_search: { label: "SEARCH", color: "#60a5fa" },
  fetch_url: { label: "BROWSE", color: "#22d3ee" },
  create_artifact: { label: "WRITE", color: "#4ade80" },
  read_artifact: { label: "READ", color: "#22d3ee" },
};
const chipBg = (c: string) => `${c}24`; // ~14% alpha
const glow = (c: string) => `${c}80`;

interface TimelineStep {
  key: number;
  label: string;
  color: string;
  title: string;
  detail?: string;
  sources?: StepView["sources"];
  time?: string;
  running?: boolean;
}

function firstLine(s: string, max = 90): string {
  const line = s.trim().split("\n")[0] ?? "";
  return line.length > max ? line.slice(0, max) + "…" : line;
}

/** Map raw run steps to the design's timeline entries + the final answer. */
function derive(run: RunView) {
  const timeline: TimelineStep[] = [];
  let answer: StepView | null = null;
  let llmSeen = 0;

  for (const s of run.steps) {
    if (s.kind === "llm") {
      const hasText = (s.text ?? "").trim().length > 0;
      const isLast = s === run.steps[run.steps.length - 1];
      // The trailing llm step with text is the answer (streaming while the run
      // is live, final once done) — it renders as the answer card, not a node.
      if (isLast && hasText) {
        answer = s;
        continue;
      }
      llmSeen += 1;
      if (!hasText) continue; // silent tool-call turn — nothing to show
      const kind = llmSeen === 1 ? CHIP.think : CHIP.reason;
      timeline.push({
        key: s.index,
        label: kind.label,
        color: kind.color,
        title: firstLine(s.text ?? ""),
        detail: (s.text ?? "").trim(),
      });
    } else {
      const chip = CHIP[s.tool ?? ""] ?? { label: (s.tool ?? "TOOL").toUpperCase(), color: "#22d3ee" };
      const args = (s.args ?? {}) as Record<string, unknown>;
      const title = s.running
        ? s.tool === "web_search"
          ? `Searching: ${String(args.query ?? "…")}`
          : s.tool === "fetch_url"
            ? `Reading ${hostOf(String(args.url ?? ""))}`
            : s.tool === "create_artifact"
              ? `Writing ${String(args.title ?? "artifact")}…`
              : `Running ${s.tool}`
        : s.tool === "web_search"
          ? `Searched: ${String(args.query ?? "")} — ${s.summary ?? ""}`
          : s.tool === "fetch_url"
            ? `Read ${hostOf(String(args.url ?? ""))}`
            : s.tool === "create_artifact"
              ? `Compiled → ${s.summary ?? "artifact"}`
              : (s.summary ?? s.tool ?? "tool");
      timeline.push({
        key: s.index,
        label: chip.label,
        color: chip.color,
        title,
        sources: s.sources,
        time: s.durationMs !== undefined ? `${(s.durationMs / 1000).toFixed(1)}s` : undefined,
        running: s.running,
      });
    }
  }
  return { timeline, answer };
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "page";
  }
}

const fmtTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function RunTimeline({ run }: { run: RunView }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { timeline, answer } = derive(run);

  const totals = run.steps.reduce(
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

  const streaming = run.status === "running" && (answer?.text ?? "").length > 0;

  return (
    <div>
      {/* timeline rail */}
      {timeline.length > 0 && (
        <div className="relative ml-3 pl-[26px]" style={{ borderLeft: "1.5px solid rgba(255,255,255,.08)" }}>
          {timeline.map((s) => {
            const isOpen = expanded === s.key;
            const expandable = !!s.detail || !!s.sources?.length;
            return (
              <div key={s.key} className="relative mb-3" style={{ animation: "stepIn .38s ease both" }}>
                <div
                  className="absolute flex items-center justify-center rounded-full"
                  style={{
                    left: -33,
                    top: 2,
                    width: 15,
                    height: 15,
                    background: "#0e0e13",
                    border: `2px solid ${s.color}`,
                    boxShadow: `0 0 0 4px rgba(8,8,11,1), 0 0 12px ${glow(s.color)}`,
                  }}
                >
                  <span className="w-[5px] h-[5px] rounded-full" style={{ background: s.color }} />
                </div>
                <div
                  onClick={() => expandable && setExpanded(isOpen ? null : s.key)}
                  className="glass rounded-xl overflow-hidden"
                  style={{ cursor: expandable ? "pointer" : "default" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.08)")}
                >
                  <div className="flex items-center gap-[11px] px-[13px] py-[11px]">
                    <span
                      className="mono shrink-0 font-semibold rounded-md px-[7px] py-[3px]"
                      style={{ fontSize: 9.5, letterSpacing: ".06em", color: s.color, background: chipBg(s.color) }}
                    >
                      {s.label}
                    </span>
                    <span className={`flex-1 text-[13.5px] truncate ${s.running ? "text-mut" : "text-ink-2"}`}>
                      {s.title}
                    </span>
                    {s.time && !s.running && (
                      <span className="mono text-[10.5px] text-mut-4 shrink-0">{s.time}</span>
                    )}
                    {s.running && (
                      <span
                        className="shrink-0 w-[13px] h-[13px] rounded-full"
                        style={{
                          border: "2px solid rgba(129,140,248,.3)",
                          borderTopColor: "#818cf8",
                          animation: "spin .7s linear infinite",
                        }}
                      />
                    )}
                    {expandable && (
                      <span
                        className="text-[10px] text-mut-3 shrink-0 transition-transform duration-200"
                        style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
                      >
                        ▸
                      </span>
                    )}
                  </div>
                  {isOpen && (
                    <div className="px-[13px] pb-[13px]" style={{ animation: "stepIn .2s ease both" }}>
                      <div className="h-px mb-[11px]" style={{ background: "rgba(255,255,255,.06)" }} />
                      {s.detail && (
                        <p className="text-[12.8px] text-[#a5a5b0] leading-[1.6] whitespace-pre-wrap">{s.detail}</p>
                      )}
                      {!!s.sources?.length && (
                        <div className="mt-[11px] flex flex-col gap-[7px]">
                          {s.sources.map((src) => (
                            <a
                              key={src.url}
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-[10px] px-[10px] py-2 rounded-[9px]"
                              style={{ border: "1px solid rgba(255,255,255,.07)", background: "rgba(0,0,0,.2)" }}
                              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(129,140,248,.4)")}
                              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.07)")}
                            >
                              <span className="w-4 h-4 rounded shrink-0 grad opacity-70" />
                              <span className="flex-1 min-w-0">
                                <span className="block text-[12.5px] text-ink-2 truncate">{src.title}</span>
                                <span className="block mono text-[10.5px] text-mut-3">{src.domain}</span>
                              </span>
                              <span className="text-mut-4 text-xs">↗</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {run.status === "running" && !streaming && (
            <div className="relative mb-3">
              <div
                className="absolute rounded-full"
                style={{
                  left: -33,
                  top: 2,
                  width: 15,
                  height: 15,
                  border: "2px solid rgba(129,140,248,.3)",
                  borderTopColor: "#818cf8",
                  animation: "spin .7s linear infinite",
                }}
              />
              <div className="flex items-center gap-[9px] px-[2px] py-[9px] text-mut text-[13px]">
                <span>Working</span>
                <span className="flex gap-[3px]">
                  {[0, 0.2, 0.4].map((d) => (
                    <span
                      key={d}
                      className="w-1 h-1 rounded-full bg-accent"
                      style={{ animation: `pulse-dot 1s ease-in-out ${d}s infinite` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* streamed / final answer */}
      {answer && (answer.text ?? "").trim() && (
        <div
          className="mt-[22px] rounded-2xl px-[22px] py-5"
          style={{
            border: "1px solid rgba(255,255,255,.08)",
            background: "linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.015))",
          }}
        >
          <div className="prose-mm">
            <Markdown>{(answer.text ?? "").trim()}</Markdown>
          </div>
          {streaming && (
            <span
              className="inline-block w-2 h-4 align-[-2px] bg-accent ml-[2px]"
              style={{ animation: "blink 1s step-end infinite" }}
            />
          )}
          {run.status === "done" && (
            <div className="flex gap-2 mt-4 pt-[14px]" style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
              <button
                onClick={() => void navigator.clipboard.writeText(answer.text ?? "")}
                className="btn-ghost px-[11px] py-[6px] rounded-lg text-xs flex items-center gap-[6px] text-ink-3"
              >
                <span className="text-accent2">⧉</span>Copy answer
              </button>
            </div>
          )}
        </div>
      )}

      {run.status === "failed" && (
        <div
          className="mt-3 rounded-xl px-[13px] py-[10px] text-[13px]"
          style={{ border: "1px solid rgba(255,90,90,.25)", background: "rgba(120,30,30,.14)", color: "#ffb4b4" }}
        >
          Run failed: {run.error ?? "unknown error"}
          {run.creditRefunded && <span className="opacity-75"> — credit refunded</span>}
        </div>
      )}

      {(totals.in > 0 || run.costUsd !== undefined) && (
        <p className="mono text-[10.5px] text-mut-4 mt-[10px] px-1">
          {fmtTokens(totals.in)} in · {fmtTokens(totals.out)} out · {fmtTokens(totals.cached)} cached
          {run.costUsd !== undefined && ` · $${run.costUsd.toFixed(4)}`}
        </p>
      )}
    </div>
  );
}
