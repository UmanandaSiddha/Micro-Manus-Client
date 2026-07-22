"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginButtons from "@/components/LoginButtons";
import { useMe } from "@/lib/me";

const STEPS = [
  ["Sign in", "Google or GitHub — no passwords, no email verification."],
  ["Add your API key", "OpenRouter, OpenAI, Anthropic or Kimi. Your key, your models."],
  ["Research", "The agent searches, reads, reasons in a loop — and writes cited PDF reports."],
] as const;

export default function Landing() {
  const { me, loading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (!loading && me) router.replace("/chat");
  }, [loading, me, router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-12">
      <div className="text-center max-w-2xl">
        <p className="text-accent font-mono text-sm mb-4">MicroManus</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
          A deep research agent
          <br />
          <span className="text-muted">that shows its work.</span>
        </h1>
        <p className="mt-5 text-muted text-lg">
          Ask a hard question. Watch it search, read and reason live — then
          download the report as a PDF. Bring your own LLM key; see exactly what
          every step cost.
        </p>
      </div>

      <LoginButtons />

      <div className="grid sm:grid-cols-3 gap-4 max-w-3xl w-full">
        {STEPS.map(([title, body], i) => (
          <div key={title} className="rounded-xl border border-border-c bg-surface p-5">
            <p className="text-accent font-mono text-xs mb-2">0{i + 1}</p>
            <p className="font-medium mb-1">{title}</p>
            <p className="text-sm text-muted">{body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
