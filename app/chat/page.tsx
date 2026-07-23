"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useChat } from "./layout";

const EXAMPLES = [
  {
    title: "California forest fires",
    q: "Create a report explaining the recent forest fires in California — causes and prevention",
    dot: "#f472b6",
  },
  {
    title: "Solid-state batteries",
    q: "Compare the current state of solid-state battery development across major manufacturers",
    dot: "#22d3ee",
  },
  {
    title: "EU AI regulation",
    q: "What changed in EU AI regulation this year and who does it affect?",
    dot: "#4ade80",
  },
];

export default function ChatIndex() {
  const { me } = useMe();
  const { loaded, reloadThreads, modelId } = useChat();
  const router = useRouter();

  const startWith = async (q?: string) => {
    const { id } = await api<{ id: string }>("/api/chat/threads", { method: "POST" });
    await reloadThreads();
    router.push(q ? `/chat/${id}?q=${encodeURIComponent(q)}` : `/chat/${id}`);
  };

  if (!loaded) {
    return (
      <main className="flex-1 grid place-items-center text-mut text-sm">Loading…</main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 gap-7 overflow-y-auto py-10">
      {!me?.hasKey && (
        <div
          className="rounded-xl px-4 py-3 text-[12.8px] flex items-center gap-3"
          style={{ border: "1px solid rgba(245,158,11,.2)", background: "rgba(245,158,11,.06)", color: "#d3b982" }}
        >
          <span className="w-[7px] h-[7px] rounded-full bg-[#f59e0b] shrink-0" />
          Add your LLM API key in{" "}
          <Link href="/settings" className="underline underline-offset-2" style={{ color: "#e2c078" }}>
            Settings
          </Link>{" "}
          to start researching.
        </div>
      )}

      <div className="text-center" style={{ animation: "fadeUp .5s ease both" }}>
        <h1 className="serif font-normal" style={{ fontSize: "clamp(30px, 4vw, 44px)", letterSpacing: "-.02em" }}>
          What should we <span className="italic" style={{ background: "linear-gradient(120deg,#a5b0ff,#7dd3fc)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>research</span>?
        </h1>
        <p className="text-mut mt-2 text-[14.5px]">
          The agent plans, searches, reads and writes — you watch it happen live.
        </p>
      </div>

      <div className="flex flex-col gap-[10px] w-full max-w-xl" style={{ animation: "fadeUp .6s .08s ease both" }}>
        {EXAMPLES.map((e) => (
          <button
            key={e.q}
            onClick={() => void startWith(e.q)}
            disabled={!me?.hasKey || !modelId}
            className="glass text-left rounded-[14px] px-4 py-[13px] cursor-pointer transition-colors hover:bg-[rgba(255,255,255,.05)] disabled:opacity-50 disabled:cursor-default"
          >
            <span className="flex items-center gap-[10px]">
              <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: e.dot }} />
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold">{e.title}</span>
                <span className="block text-[12.5px] text-mut-2 truncate mt-[2px]">{e.q}</span>
              </span>
              <span className="text-mut-4">→</span>
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => void startWith()}
        className="bg-transparent border-none text-mut-2 text-[13px] cursor-pointer underline underline-offset-[3px] hover:text-ink-2"
      >
        Or start a blank research thread
      </button>
    </main>
  );
}
