"use client";

import { useCallback, useEffect, useState } from "react";
import Guard from "@/components/Guard";
import SettingsShell from "@/components/SettingsShell";
import { api, ApiError } from "@/lib/api";
import { useMe } from "@/lib/me";

interface KeyRow {
  id: string;
  provider: string;
  key_hint: string;
  created_at: string;
}

const PROVIDERS = [
  ["", "Auto-detect"],
  ["openrouter", "OpenRouter"],
  ["openai", "OpenAI"],
  ["anthropic", "Anthropic"],
  ["moonshot", "Moonshot (Kimi)"],
] as const;

const PROVIDER_DOT: Record<string, string> = {
  openrouter: "#818cf8",
  openai: "#4ade80",
  anthropic: "#a78bfa",
  moonshot: "#60a5fa",
};

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
      setAdded(`Validated as ${res.provider} — models unlocked in the workspace picker.`);
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

  const inputStyle = {
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(0,0,0,.25)",
  } as const;

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <h1 className="text-[23px] font-semibold tracking-[-.02em]">LLM keys</h1>
      <p className="text-mut-2 mt-[6px] text-sm max-w-[60ch]">
        Bring your own key — the agent runs on it and every token is itemized on
        the cost dashboard. One OpenRouter key unlocks Claude, GPT and Kimi at once.
      </p>

      <div
        className="flex items-center gap-3 mt-5 px-4 py-[13px] rounded-xl"
        style={{ border: "1px solid rgba(245,158,11,.2)", background: "rgba(245,158,11,.06)" }}
      >
        <span className="w-[7px] h-[7px] rounded-full bg-[#f59e0b] shrink-0" />
        <span className="text-[12.8px]" style={{ color: "#d3b982" }}>
          Keys are encrypted at rest (AES-256-GCM). Only a hint is ever shown again.
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-[26px]">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="px-3 py-[10px] rounded-[10px] text-[13px]"
          style={inputStyle}
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
          onKeyDown={(e) => e.key === "Enter" && apiKey.trim().length >= 8 && void add()}
          placeholder="sk-…"
          className="mono flex-1 px-[14px] py-[10px] rounded-[10px] text-sm"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#818cf8")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.12)")}
        />
        <button
          onClick={() => void add()}
          disabled={busy || apiKey.trim().length < 8}
          className="btn-grad px-[15px] py-[10px] rounded-[10px] text-[13px] disabled:opacity-50"
        >
          {busy ? "Validating…" : "+ Add key"}
        </button>
      </div>
      {error && <p className="mt-3 text-[13px] text-[#ff8a8a]">{error}</p>}
      {added && <p className="mt-3 text-[13px] text-[#4ade80]">{added}</p>}

      <div className="mt-6 rounded-[13px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,.08)" }}>
        <div
          className="flex px-4 py-[11px] mono text-[10.5px] tracking-[.05em] uppercase text-mut-3"
          style={{ background: "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.07)" }}
        >
          <span className="flex-[1.2]">Provider</span>
          <span className="flex-[1.6]">Key</span>
          <span className="flex-1">Added</span>
          <span className="w-10" />
        </div>
        {keys === null ? (
          <div className="px-4 py-5 text-sm text-mut">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="px-4 py-5 text-sm text-mut">No keys yet — add one above to start researching.</div>
        ) : (
          keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center px-4 py-[14px] text-[13px]"
              style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}
            >
              <span className="flex-[1.2] font-medium capitalize flex items-center gap-2">
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: PROVIDER_DOT[k.provider] ?? "#818cf8" }} />
                {k.provider}
              </span>
              <span className="flex-[1.6] mono text-xs text-mut">{k.key_hint}</span>
              <span className="flex-1 text-mut-2">{new Date(k.created_at).toLocaleDateString()}</span>
              <button
                onClick={() => void remove(k.id)}
                className="w-7 h-7 rounded-lg cursor-pointer text-mut-2 bg-transparent"
                style={{ border: "1px solid rgba(255,255,255,.09)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,80,80,.12)";
                  e.currentTarget.style.color = "#ff7a7a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "";
                }}
                title="Remove key"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Guard>
      <SettingsShell>
        <KeysSection />
      </SettingsShell>
    </Guard>
  );
}
