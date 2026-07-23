"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, apiUrl } from "./api";

export interface StepView {
  index: number;
  kind: "llm" | "tool";
  text?: string;
  usage?: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number };
  tool?: string;
  args?: unknown;
  summary?: string;
  durationMs?: number;
  running?: boolean;
}

export interface RunView {
  id: string;
  modelId: string;
  status: "running" | "done" | "failed";
  startedAt: string;
  steps: StepView[];
  costUsd?: number;
  error?: string;
  creditRefunded?: boolean;
}

export interface ThreadDetail {
  thread: { id: string; title: string; model_id: string | null };
  messages: Array<{ id: string; role: string; content: string; created_at: string }>;
  runs: Array<{
    id: string;
    model_id: string;
    status: string;
    steps: PersistedStep[];
    error: string | null;
    started_at: string;
  }>;
  artifacts: Array<{ id: string; type: string; title: string; created_at: string }>;
}

interface PersistedStep {
  i: number;
  kind: "llm" | "tool";
  text?: string;
  usage?: StepView["usage"];
  costUsd?: number;
  tool?: string;
  args?: unknown;
  summary?: string;
  durationMs?: number;
}

export function runFromPersisted(r: ThreadDetail["runs"][number]): RunView {
  return {
    id: r.id,
    modelId: r.model_id,
    status: r.status as RunView["status"],
    startedAt: r.started_at,
    error: r.error ?? undefined,
    costUsd: (r.steps ?? []).reduce((a, s) => a + (s.costUsd ?? 0), 0) || undefined,
    steps: (r.steps ?? []).map((s) =>
      s.kind === "llm"
        ? { index: s.i, kind: "llm" as const, text: s.text, usage: s.usage }
        : {
            index: s.i,
            kind: "tool" as const,
            tool: s.tool,
            args: s.args,
            summary: s.summary,
            durationMs: s.durationMs,
          },
    ),
  };
}

/** Apply one SSE event to a RunView (immutable-ish for React). */
export function applyEvent(run: RunView, event: string, data: Record<string, unknown>): RunView {
  const next: RunView = { ...run, steps: [...run.steps] };
  const at = (i: number): StepView => {
    let s = next.steps.find((x) => x.index === i);
    if (!s) {
      s = { index: i, kind: "llm" };
      next.steps.push(s);
      next.steps.sort((a, b) => a.index - b.index);
    }
    return s;
  };
  switch (event) {
    case "text_delta": {
      const s = at(data.stepIndex as number);
      if (s.usage) break; // step already complete (replay/live dedup rule)
      s.text = (s.text ?? "") + (data.delta as string);
      break;
    }
    case "token_usage": {
      const s = at(data.stepIndex as number);
      s.kind = "llm";
      s.usage = data as unknown as StepView["usage"];
      break;
    }
    case "tool_started": {
      const s = at(data.stepIndex as number);
      s.kind = "tool";
      s.tool = data.tool as string;
      s.args = data.args;
      s.running = true;
      break;
    }
    case "tool_finished": {
      const s = at(data.stepIndex as number);
      s.kind = "tool";
      s.tool = data.tool as string;
      s.summary = data.summary as string;
      s.durationMs = data.durationMs as number;
      s.running = false;
      break;
    }
    case "cost_updated":
      next.costUsd = data.runCostUsd as number;
      break;
    case "run_completed":
      next.status = "done";
      next.costUsd = data.costUsd as number;
      break;
    case "run_failed":
      next.status = "failed";
      next.error = data.error as string;
      next.creditRefunded = data.creditRefunded as boolean;
      break;
  }
  return next;
}

const EVENTS = [
  "run_started",
  "text_delta",
  "tool_started",
  "tool_finished",
  "token_usage",
  "cost_updated",
  "artifact_created",
  "run_completed",
  "run_failed",
] as const;

export function useThread(threadId: string, onCreditsChanged: () => void) {
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [liveRun, setLiveRun] = useState<RunView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const load = useCallback(async () => {
    const d = await api<ThreadDetail>(`/api/chat/threads/${threadId}`);
    setDetail(d);
    return d;
  }, [threadId]);

  const subscribe = useCallback(
    (runId: string, modelId: string) => {
      esRef.current?.close();
      setLiveRun({ id: runId, modelId, status: "running", startedAt: new Date().toISOString(), steps: [] });
      const es = new EventSource(apiUrl(`/api/chat/runs/${runId}/events`), {
        withCredentials: true, // cookie auth across origins
      });
      esRef.current = es;
      for (const ev of EVENTS) {
        es.addEventListener(ev, (e) => {
          const data = JSON.parse((e as MessageEvent).data as string) as Record<string, unknown>;
          if (ev === "artifact_created") {
            void load();
            return;
          }
          setLiveRun((prev) => (prev && prev.id === runId ? applyEvent(prev, ev, data) : prev));
          if (ev === "run_completed" || ev === "run_failed") {
            es.close();
            onCreditsChanged();
            void load().then(() => setLiveRun(null));
          }
        });
      }
      es.onerror = () => {
        // EventSource auto-reconnects; server replays steps, so no loss.
      };
    },
    [load, onCreditsChanged],
  );

  // Initial load + auto-attach to an in-flight run (page refresh mid-run).
  useEffect(() => {
    let cancelled = false;
    // False positive: state is only set inside the resolved promise (async).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load().then((d) => {
      if (cancelled) return;
      const running = d.runs.find((r) => r.status === "running");
      if (running) subscribe(running.id, running.model_id);
    });
    return () => {
      cancelled = true;
      esRef.current?.close();
    };
  }, [load, subscribe]);

  const send = useCallback(
    async (content: string, modelId: string) => {
      setError(null);
      try {
        const { runId } = await api<{ runId: string }>(
          `/api/chat/threads/${threadId}/messages`,
          { method: "POST", json: { content, modelId } },
        );
        onCreditsChanged();
        await load(); // pick up the user message
        subscribe(runId, modelId);
      } catch (e) {
        setError((e as Error).message);
        throw e;
      }
    },
    [threadId, load, subscribe, onCreditsChanged],
  );

  const cancel = useCallback(async () => {
    if (liveRun) await api(`/api/chat/runs/${liveRun.id}/cancel`, { method: "POST" });
  }, [liveRun]);

  return { detail, liveRun, error, send, cancel, reload: load };
}
