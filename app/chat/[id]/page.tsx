"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef } from "react";
import Composer, { useModels } from "@/components/Composer";
import RunTrace from "@/components/RunTrace";
import { apiUrl } from "@/lib/api";
import { useMe } from "@/lib/me";
import { runFromPersisted, RunView, useThread } from "@/lib/useThread";
import { useChat } from "../layout";

function ThreadView() {
  const { id } = useParams<{ id: string }>();
  const { me, refresh } = useMe();
  const { reloadThreads } = useChat();
  const models = useModels();
  const search = useSearchParams();
  const router = useRouter();

  const onCreditsChanged = useMemo(
    () => () => {
      void refresh();
      void reloadThreads();
    },
    [refresh, reloadThreads],
  );
  const { detail, liveRun, error, send, cancel } = useThread(id, onCreditsChanged);

  // Auto-send ?q= draft from the empty-state examples (once).
  const sentDraft = useRef(false);
  useEffect(() => {
    const q = search.get("q");
    if (!q || sentDraft.current || !detail || !models?.length) return;
    if (detail.messages.length === 0 && detail.runs.length === 0) {
      sentDraft.current = true;
      const saved = localStorage.getItem("mm-model");
      const modelId = saved && models.some((m) => m.id === saved) ? saved : models[0].id;
      router.replace(`/chat/${id}`, { scroll: false });
      void send(q, modelId).catch(() => {});
    }
  }, [search, detail, models, send, id, router]);

  // Merge persisted runs with the live one; pair with user messages by time.
  const timeline = useMemo(() => {
    if (!detail) return [];
    const runs: RunView[] = detail.runs.map((r) =>
      liveRun && r.id === liveRun.id ? liveRun : runFromPersisted(r),
    );
    if (liveRun && !detail.runs.some((r) => r.id === liveRun.id)) runs.push(liveRun);

    const items: Array<
      | { kind: "user"; key: string; at: string; content: string }
      | { kind: "run"; key: string; at: string; run: RunView }
    > = [
      ...detail.messages
        .filter((m) => m.role === "user")
        .map((m) => ({ kind: "user" as const, key: m.id, at: m.created_at, content: m.content })),
      ...runs.map((r) => ({ kind: "run" as const, key: r.id, at: r.startedAt, run: r })),
    ];
    return items.sort((a, b) => a.at.localeCompare(b.at));
  }, [detail, liveRun]);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline.length, liveRun?.steps.length]);

  if (!detail) {
    return <main className="flex-1 grid place-items-center text-muted text-sm">Loading…</main>;
  }

  const running = liveRun?.status === "running";

  return (
    <>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
          {!me?.hasKey && (
            <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
              Add your LLM API key in{" "}
              <Link href="/settings" className="underline">
                Settings
              </Link>{" "}
              to start researching.
            </div>
          )}
          {timeline.length === 0 && (
            <p className="text-center text-muted text-sm py-20">
              Ask a research question below — the agent will search, read and
              cite sources while you watch.
            </p>
          )}
          {timeline.map((item) =>
            item.kind === "user" ? (
              <div key={item.key} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent/15 border border-accent/25 px-4 py-2.5 text-sm whitespace-pre-wrap">
                  {item.content}
                </div>
              </div>
            ) : (
              <RunTrace key={item.key} run={item.run} />
            ),
          )}
          {detail.artifacts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {detail.artifacts.map((a) => (
                <a
                  key={a.id}
                  href={apiUrl(`/api/artifacts/${a.id}/download`)}
                  className="flex items-center gap-2 rounded-lg border border-border-c bg-surface px-3 py-2 text-sm hover:bg-surface-2"
                >
                  📄 {a.title}
                  <span className="text-xs text-muted uppercase">{a.type}</span>
                </a>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div ref={bottomRef} />
        </div>
      </main>
      <Composer
        disabled={!me?.hasKey || (models?.length ?? 0) === 0}
        models={models ?? []}
        running={!!running}
        onSend={send}
        onCancel={() => void cancel()}
      />
    </>
  );
}

export default function ThreadPage() {
  return (
    <Suspense>
      <ThreadView />
    </Suspense>
  );
}
