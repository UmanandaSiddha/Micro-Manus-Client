"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import ArtifactPanel, { ART_COLOR } from "@/components/ArtifactPanel";
import Composer from "@/components/Composer";
import Icon, { ARTIFACT_ICON } from "@/components/Icon";
import RunTimeline from "@/components/RunTimeline";
import { apiUrl } from "@/lib/api";
import { useMe } from "@/lib/me";
import { ArtifactRef, runFromPersisted, RunView, useThread } from "@/lib/useThread";
import { useChat } from "../layout";

function ThreadView() {
  const { id } = useParams<{ id: string }>();
  const { me, refresh } = useMe();
  const { reloadThreads, models, modelId } = useChat();
  const search = useSearchParams();
  const router = useRouter();

  const [openArtifact, setOpenArtifact] = useState<ArtifactRef | null>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 1180);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const onCreditsChanged = useMemo(
    () => () => {
      void refresh();
      void reloadThreads();
    },
    [refresh, reloadThreads],
  );
  const { detail, liveRun, error, send, cancel } = useThread(
    id,
    onCreditsChanged,
    // The agent deliberately produced an artifact → open its preview.
    (a) => setOpenArtifact(a),
  );

  // Auto-send ?q= draft from the empty-state examples (once).
  const sentDraft = useRef(false);
  useEffect(() => {
    const q = search.get("q");
    if (!q || sentDraft.current || !detail || !modelId) return;
    if (detail.messages.length === 0 && detail.runs.length === 0) {
      sentDraft.current = true;
      router.replace(`/chat/${id}`, { scroll: false });
      void send(q, modelId).catch(() => {});
    }
  }, [search, detail, modelId, send, id, router]);

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
    return <main className="flex-1 grid place-items-center text-mut text-sm">Loading…</main>;
  }

  const running = liveRun?.status === "running";

  return (
    <div className="flex-1 flex min-h-0 relative">
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-[26px]">
          <div className="max-w-[760px] mx-auto px-4 sm:px-7">
            {!me?.hasKey && (
              <div
                className="mb-6 rounded-xl px-4 py-3 text-[12.8px]"
                style={{ border: "1px solid rgba(245,158,11,.2)", background: "rgba(245,158,11,.06)", color: "#d3b982" }}
              >
                Add your LLM API key in{" "}
                <Link href="/settings" className="underline underline-offset-2" style={{ color: "#e2c078" }}>
                  Settings
                </Link>{" "}
                to start researching.
              </div>
            )}

            {timeline.length === 0 && (
              <p className="text-center text-mut text-sm py-20">
                Ask a research question below — the agent searches, reads and
                cites sources while you watch.
              </p>
            )}

            {timeline.map((item) =>
              item.kind === "user" ? (
                <div key={item.key} className="flex justify-end mb-[26px]" style={{ animation: "fadeUp .4s ease both" }}>
                  <div
                    className="max-w-[80%] px-4 py-3 text-[14.5px] leading-[1.55] text-[#eef0ff]"
                    style={{
                      borderRadius: "16px 16px 4px 16px",
                      background: "linear-gradient(135deg, rgba(99,102,241,.22), rgba(34,211,238,.14))",
                      border: "1px solid rgba(129,140,248,.24)",
                    }}
                  >
                    {item.content}
                  </div>
                </div>
              ) : (
                <div key={item.key} className="mb-8">
                  {/* assistant header */}
                  <div className="flex items-center gap-[10px] mb-4">
                    <span className="grad w-[26px] h-[26px] rounded-lg flex items-center justify-center shrink-0 text-[#0a0a12]">
                      <Icon name="sparkles" size={14} />
                    </span>
                    <span className="font-semibold text-[13.5px]">MicroManus</span>
                    <span
                      className="mono text-[10.5px] text-mut-3 px-[7px] py-[2px] rounded-full"
                      style={{ border: "1px solid rgba(255,255,255,.08)" }}
                    >
                      {models.find((m) => m.id === item.run.modelId)?.label ?? item.run.modelId}
                    </span>
                    {item.run.status === "running" && (
                      <span className="text-xs text-accent2 flex items-center gap-[6px]">researching…</span>
                    )}
                    {item.run.status === "done" && (
                      <span className="text-xs text-[#4ade80]">done</span>
                    )}
                  </div>
                  <RunTimeline run={item.run} />
                </div>
              ),
            )}

            {/* artifact cards — click = open that artifact's preview */}
            {detail.artifacts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {detail.artifacts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setOpenArtifact({ id: a.id, type: a.type, title: a.title })}
                    className="glass flex items-center gap-[10px] rounded-[11px] px-[13px] py-[10px] text-[12.5px] cursor-pointer hover:bg-[rgba(255,255,255,.05)]"
                  >
                    <span
                      className="w-[22px] h-[22px] rounded-md shrink-0 flex items-center justify-center"
                      style={{ background: `${ART_COLOR[a.type] ?? "#818cf8"}1f`, color: ART_COLOR[a.type] ?? "#818cf8" }}
                    >
                      <Icon name={ARTIFACT_ICON[a.type] ?? "file-text"} size={13} />
                    </span>
                    <span className="max-w-[220px] truncate text-ink-2">{a.title}</span>
                    <span className="mono text-[9.5px] uppercase text-mut-3">{a.type}</span>
                  </button>
                ))}
              </div>
            )}

            {detail.uploads.length > 0 && (
              <div className="mt-3">
                <div className="mono text-[10px] uppercase tracking-wider text-mut-4 mb-2">Attached files</div>
                <div className="flex flex-wrap gap-2">
                  {detail.uploads.map((u) => (
                    <a
                      key={u.id}
                      href={apiUrl(u.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="glass flex items-center gap-[9px] rounded-[10px] px-[11px] py-[8px] text-[12px] cursor-pointer hover:bg-[rgba(255,255,255,.05)]"
                    >
                      <Icon name="paperclip" size={13} className="text-mut-2" />
                      <span className="max-w-[200px] truncate text-ink-2">{u.filename}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-[#ff8a8a] mt-3">{error}</p>}
            <div ref={bottomRef} />
          </div>
        </div>

        <Composer
          disabled={!me?.hasKey || !modelId}
          running={!!running}
          onSend={(content, attachmentIds) => send(content, modelId, attachmentIds)}
          onCancel={() => void cancel()}
        />
      </main>

      {openArtifact && (
        <>
          {narrow && (
            <div
              onClick={() => setOpenArtifact(null)}
              className="absolute inset-0 z-40"
              style={{ background: "rgba(6,6,9,.55)", backdropFilter: "blur(2px)" }}
            />
          )}
          <ArtifactPanel
            artifact={openArtifact}
            onClose={() => setOpenArtifact(null)}
            overlay={narrow}
          />
        </>
      )}

      {/* collapsed panel → floating pill */}
      {!openArtifact && detail.artifacts.length > 0 && (
        <button
          onClick={() => {
            const last = detail.artifacts[detail.artifacts.length - 1];
            setOpenArtifact({ id: last.id, type: last.type, title: last.title });
          }}
          className="absolute right-4 bottom-24 z-20 flex items-center gap-2 px-[14px] py-[10px] rounded-[11px] text-[12.5px] text-ink-2 cursor-pointer"
          style={{
            border: "1px solid rgba(255,255,255,.12)",
            background: "#16161d",
            boxShadow: "0 8px 24px rgba(0,0,0,.4)",
          }}
        >
          <Icon name="file-text" size={13} className="text-[#4ade80]" />
          {detail.artifacts.length} artifact{detail.artifacts.length > 1 ? "s" : ""}
          <Icon name="arrow-right" size={13} className="text-mut-3" />
        </button>
      )}
    </div>
  );
}

export default function ThreadPage() {
  return (
    <Suspense>
      <ThreadView />
    </Suspense>
  );
}
