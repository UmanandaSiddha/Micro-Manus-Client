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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
          <div className="flex-1 flex min-h-0">
            <Sidebar
              threads={threads}
              activeId={params.id}
              open={sidebarOpen}
              onChanged={() => void reloadThreads()}
            />
            <div className="flex-1 flex flex-col min-w-0 min-h-0">{children}</div>
          </div>
        </div>
      </Ctx.Provider>
    </Guard>
  );
}
