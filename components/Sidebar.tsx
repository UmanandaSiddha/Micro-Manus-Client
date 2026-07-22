"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";

export interface ThreadListItem {
  id: string;
  title: string;
  updated_at: string;
}

export default function Sidebar({
  threads,
  activeId,
  onChanged,
}: {
  threads: ThreadListItem[];
  activeId?: string;
  onChanged: () => void;
}) {
  const router = useRouter();
  const { me } = useMe();

  const newChat = async () => {
    const { id } = await api<{ id: string }>("/api/chat/threads", { method: "POST" });
    onChanged();
    router.push(`/chat/${id}`);
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border-c bg-surface flex flex-col h-screen sticky top-0">
      <div className="p-3 border-b border-border-c">
        <Link href="/chat" className="block font-semibold px-2 py-1">
          MicroManus
        </Link>
        <button
          onClick={() => void newChat()}
          className="mt-2 w-full rounded-lg bg-accent hover:bg-accent-hover transition-colors px-3 py-2 text-sm font-medium text-white"
        >
          + New chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {threads.length === 0 && (
          <p className="text-xs text-muted px-2 py-3">No chats yet.</p>
        )}
        {threads.map((t) => (
          <div key={t.id} className="group relative">
            <Link
              href={`/chat/${t.id}`}
              className={`block rounded-lg px-3 py-2 text-sm truncate pr-8 ${
                t.id === activeId
                  ? "bg-surface-2 text-foreground"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {t.title}
            </Link>
            <button
              title="Delete chat"
              onClick={() =>
                void api(`/api/chat/threads/${t.id}`, { method: "DELETE" }).then(() => {
                  onChanged();
                  if (t.id === activeId) router.push("/chat");
                })
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:block text-muted hover:text-red-400 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </nav>

      <div className="border-t border-border-c p-3 text-sm flex flex-col gap-1">
        <p className="px-2 text-xs text-muted">
          Credits: <span className="text-foreground font-medium">{me?.credits ?? 0}</span>
        </p>
        <Link href="/dashboard" className="rounded-lg px-2 py-1.5 text-muted hover:bg-surface-2 hover:text-foreground">
          📊 Cost dashboard
        </Link>
        <Link href="/settings" className="rounded-lg px-2 py-1.5 text-muted hover:bg-surface-2 hover:text-foreground">
          ⚙️ Settings
        </Link>
      </div>
    </aside>
  );
}
