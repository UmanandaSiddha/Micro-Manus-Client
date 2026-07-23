"use client";

import { useEffect, useState } from "react";
import { api } from "./api";

export interface ModelOption {
  id: string;
  label: string;
  vendor: string;
  contextWindow: number;
  via: string;
  pricing: { in: number; out: number; cacheRead: number; cacheWrite: number };
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

/** Session model choice: explicit pick > saved > first available. */
export function useModelChoice(models: ModelOption[] | null) {
  const [choice, setChoice] = useState<string | null>(null);
  const saved = typeof window !== "undefined" ? localStorage.getItem("mm-model") : null;
  const list = models ?? [];
  const modelId =
    choice && list.some((m) => m.id === choice)
      ? choice
      : saved && list.some((m) => m.id === saved)
        ? saved
        : (list[0]?.id ?? "");
  const setModelId = (id: string) => {
    setChoice(id);
    localStorage.setItem("mm-model", id);
  };
  return { modelId, setModelId };
}
