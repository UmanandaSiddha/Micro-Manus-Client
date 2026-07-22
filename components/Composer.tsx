"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface ModelOption {
  id: string;
  label: string;
  vendor: string;
  pricing: { in: number; out: number };
}

export function useModels() {
  const [models, setModels] = useState<ModelOption[] | null>(null);
  useEffect(() => {
    void api<{ models: ModelOption[] }>("/api/models")
      .then((r) => setModels(r.models))
      .catch(() => setModels([]));
  }, []);
  return models;
}

export default function Composer({
  disabled,
  models,
  onSend,
  onCancel,
  running,
}: {
  disabled: boolean;
  models: ModelOption[];
  onSend: (content: string, modelId: string) => Promise<void>;
  onCancel?: () => void;
  running: boolean;
}) {
  const [text, setText] = useState("");
  const [modelId, setModelId] = useState("");

  useEffect(() => {
    if (!modelId && models.length) {
      const saved = localStorage.getItem("mm-model");
      setModelId(saved && models.some((m) => m.id === saved) ? saved : models[0].id);
    }
  }, [models, modelId]);

  const send = async () => {
    const content = text.trim();
    if (!content || !modelId) return;
    setText("");
    try {
      await onSend(content, modelId);
    } catch {
      setText(content); // restore on failure
    }
  };

  return (
    <div className="border-t border-border-c bg-surface p-3">
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={running ? "Research in progress…" : "Ask a research question…"}
          disabled={disabled || running}
          rows={2}
          className="w-full resize-none rounded-xl bg-surface-2 border border-border-c px-4 py-3 text-sm focus:outline-none focus:border-accent disabled:opacity-60"
        />
        <div className="flex items-center gap-2">
          <select
            value={modelId}
            onChange={(e) => {
              setModelId(e.target.value);
              localStorage.setItem("mm-model", e.target.value);
            }}
            disabled={running}
            className="rounded-lg bg-surface-2 border border-border-c px-2 py-1.5 text-xs focus:outline-none"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} (${m.pricing.in}/{m.pricing.out} per 1M)
              </option>
            ))}
          </select>
          <span className="text-xs text-muted">1 credit per run</span>
          {running && onCancel ? (
            <button
              onClick={onCancel}
              className="ml-auto rounded-lg border border-border-c px-4 py-1.5 text-sm text-red-400 hover:bg-surface-2"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={() => void send()}
              disabled={disabled || running || !text.trim()}
              className="ml-auto rounded-lg bg-accent hover:bg-accent-hover transition-colors px-5 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
