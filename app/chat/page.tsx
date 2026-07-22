"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useChat } from "./layout";

const EXAMPLES = [
  "Create a report explaining the recent forest fires in California — causes and prevention",
  "Compare the current state of solid-state battery development across major manufacturers",
  "What changed in EU AI regulation this year and who does it affect?",
];

export default function ChatIndex() {
  const { me } = useMe();
  const { loaded, reloadThreads } = useChat();
  const router = useRouter();

  const startWith = async (q?: string) => {
    const { id } = await api<{ id: string }>("/api/chat/threads", { method: "POST" });
    await reloadThreads();
    router.push(q ? `/chat/${id}?q=${encodeURIComponent(q)}` : `/chat/${id}`);
  };

  if (!loaded) {
    return <main className="flex-1 grid place-items-center text-muted text-sm">Loading…</main>;
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      {!me?.hasKey && (
        <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
          Add your LLM API key in{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>{" "}
          to start researching.
        </div>
      )}
      <h1 className="text-2xl font-semibold">What should we research?</h1>
      <div className="flex flex-col gap-2 w-full max-w-xl">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            onClick={() => void startWith(q)}
            disabled={!me?.hasKey}
            className="text-left rounded-xl border border-border-c bg-surface hover:bg-surface-2 transition-colors px-4 py-3 text-sm disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
      <button
        onClick={() => void startWith()}
        className="text-sm text-accent hover:text-accent-hover"
      >
        Or start a blank chat →
      </button>
    </main>
  );
}
