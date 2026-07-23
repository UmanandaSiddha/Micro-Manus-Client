"use client";

import { useParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Guard from "@/components/Guard";
import Sidebar, { ThreadListItem } from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { api } from "@/lib/api";
import { ModelOption, useModelChoice, useModels } from "@/lib/models";

interface ChatCtx {
  threads: ThreadListItem[];
  reloadThreads: () => Promise<void>;
  loaded: boolean;
  models: ModelOption[];
  modelId: string;
}

const Ctx = createContext<ChatCtx>({
  threads: [],
  reloadThreads: async () => {},
  loaded: false,
  models: [],
  modelId: "",
});
export const useChat = () => useContext(Ctx);

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Default closed on narrow screens — 264px of sidebar would crush the chat.
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 900,
  );
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const params = useParams<{ id?: string }>();
  const models = useModels();
  const { modelId, setModelId } = useModelChoice(models);

  const reloadThreads = useCallback(async () => {
    try {
      setThreads(await api<ThreadListItem[]>("/api/chat/threads"));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void reloadThreads();
  }, [reloadThreads]);

  return (
    <Guard>
      <Ctx.Provider
        value={{ threads, reloadThreads, loaded, models: models ?? [], modelId }}
      >
        <div className="flex flex-col h-screen">
          <TopNav
            models={models ?? []}
            modelId={modelId}
            setModelId={setModelId}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
          />
          <div className="flex-1 flex min-h-0 relative">
            {narrow && sidebarOpen && (
              <div
                onClick={() => setSidebarOpen(false)}
                className="absolute inset-0 z-30"
                style={{ background: "rgba(6,6,9,.55)", backdropFilter: "blur(2px)" }}
              />
            )}
            <Sidebar
              threads={threads}
              activeId={params.id}
              open={sidebarOpen}
              overlay={narrow}
              onChanged={() => void reloadThreads()}
              onNavigate={() => narrow && setSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col min-w-0 min-h-0">{children}</div>
          </div>
        </div>
      </Ctx.Provider>
    </Guard>
  );
}
