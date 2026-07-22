"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Guard from "@/components/Guard";
import { api, ApiError } from "@/lib/api";
import { useMe } from "@/lib/me";

interface KeyRow {
  id: string;
  provider: string;
  key_hint: string;
  models: string[];
  created_at: string;
}

const PROVIDERS = [
  ["", "Auto-detect"],
  ["openrouter", "OpenRouter"],
  ["openai", "OpenAI"],
  ["anthropic", "Anthropic"],
  ["moonshot", "Moonshot (Kimi)"],
] as const;

function KeysSection() {
  const { refresh } = useMe();
  const [keys, setKeys] = useState<KeyRow[] | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const load = useCallback(
    () => api<KeyRow[]>("/api/keys").then(setKeys).catch(() => setKeys([])),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    setBusy(true);
    setError(null);
    setAdded(null);
    try {
      const res = await api<{ provider: string; models: string[] }>("/api/keys", {
        method: "POST",
        json: { apiKey: apiKey.trim(), ...(provider ? { provider } : {}) },
      });
      setAdded(
        `Detected ${res.provider} — ${res.models.length || "all registry"} models reachable.`,
      );
      setApiKey("");
      await Promise.all([load(), refresh()]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to add key");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await api(`/api/keys/${id}`, { method: "DELETE" });
    await Promise.all([load(), refresh()]);
  };

  return (
    <section className="rounded-xl border border-border-c bg-surface p-6">
      <h2 className="font-medium">LLM API keys</h2>
      <p className="text-sm text-muted mt-1">
        Bring your own key — OpenRouter unlocks Claude, GPT and Kimi at once.
        Keys are encrypted at rest; we only ever show a hint.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded-lg bg-surface-2 border border-border-c px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
        >
          {PROVIDERS.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-…"
          className="flex-1 rounded-lg bg-surface-2 border border-border-c px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-accent"
          onKeyDown={(e) => e.key === "Enter" && apiKey.trim() && void add()}
        />
        <button
          onClick={() => void add()}
          disabled={busy || apiKey.trim().length < 8}
          className="rounded-lg bg-accent hover:bg-accent-hover transition-colors px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Validating…" : "Add key"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {added && <p className="mt-3 text-sm text-emerald-400">{added}</p>}

      <div className="mt-5 flex flex-col gap-2">
        {keys === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted">No keys yet — add one to start chatting.</p>
        ) : (
          keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-lg bg-surface-2 border border-border-c px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium capitalize">{k.provider}</p>
                <p className="text-xs text-muted font-mono">{k.key_hint}</p>
              </div>
              <button
                onClick={() => void remove(k.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function CreditsSection() {
  const { me } = useMe();
  const [busy, setBusy] = useState(false);

  const buy = async () => {
    setBusy(true);
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", {
        method: "POST",
      });
      window.location.href = url;
    } catch {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-border-c bg-surface p-6 flex items-center justify-between">
      <div>
        <h2 className="font-medium">Credits</h2>
        <p className="text-sm text-muted mt-1">
          <span className="text-foreground font-semibold">{me?.credits ?? 0}</span>{" "}
          remaining — 1 credit per research run.
        </p>
      </div>
      <button
        onClick={() => void buy()}
        disabled={busy}
        className="rounded-lg border border-border-c bg-surface-2 hover:bg-border-c transition-colors px-4 py-2.5 text-sm font-medium"
      >
        {busy ? "Redirecting…" : "Buy 5 for $5"}
      </button>
    </section>
  );
}

export default function SettingsPage() {
  const { refresh } = useMe();
  const router = useRouter();

  return (
    <Guard>
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-10 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Settings</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/chat")}
              className="text-sm text-muted hover:text-foreground"
            >
              ← Back to chat
            </button>
            <button
              onClick={() =>
                void api("/api/auth/logout", { method: "POST" }).then(() =>
                  refresh().then(() => router.replace("/")),
                )
              }
              className="text-sm text-red-400 hover:text-red-300"
            >
              Sign out
            </button>
          </div>
        </div>
        <KeysSection />
        <CreditsSection />
      </main>
    </Guard>
  );
}
