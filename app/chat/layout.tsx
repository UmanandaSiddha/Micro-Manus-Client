"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Guard from "@/components/Guard";
import Sidebar, { ThreadListItem } from "@/components/Sidebar";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";

interface ChatCtx {
  threads: ThreadListItem[];
  reloadThreads: () => Promise<void>;
  loaded: boolean;
}

const Ctx = createContext<ChatCtx>({ threads: [], reloadThreads: async () => {}, loaded: false });
export const useChat = () => useContext(Ctx);

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const params = useParams<{ id?: string }>();

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
      <Ctx.Provider value={{ threads, reloadThreads, loaded }}>
        <div className="flex flex-1">
          <Sidebar threads={threads} activeId={params.id} onChanged={() => void reloadThreads()} />
          <div className="flex-1 flex flex-col min-h-screen">{children}</div>
        </div>
      </Ctx.Provider>
    </Guard>
  );
}
