"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import { api } from "@/lib/api";

export interface ThreadListItem {
  id: string;
  title: string;
  updated_at: string;
}

function groupThreads(threads: ThreadListItem[]) {
  const today: ThreadListItem[] = [];
  const week: ThreadListItem[] = [];
  const earlier: ThreadListItem[] = [];
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekAgo = startOfDay - 6 * 86_400_000;
  for (const t of threads) {
    const at = new Date(t.updated_at).getTime();
    if (at >= startOfDay) today.push(t);
    else if (at >= weekAgo) week.push(t);
    else earlier.push(t);
  }
  return [
    { label: "Today", items: today },
    { label: "Last 7 days", items: week },
    { label: "Earlier", items: earlier },
  ].filter((g) => g.items.length);
}

export default function Sidebar({
  threads,
  activeId,
  open,
  onChanged,
}: {
  threads: ThreadListItem[];
  activeId?: string;
  open: boolean;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const newChat = async () => {
    const { id } = await api<{ id: string }>("/api/chat/threads", { method: "POST" });
    onChanged();
    router.push(`/chat/${id}`);
  };

  const filtered = q.trim()
    ? threads.filter((t) => t.title.toLowerCase().includes(q.trim().toLowerCase()))
    : threads;
  const groups = groupThreads(filtered);

  return (
    <aside
      className="shrink-0 overflow-hidden"
      style={{
        width: open ? 264 : 0,
        borderRight: open ? "1px solid rgba(255,255,255,.07)" : "none",
        background: "rgba(12,12,16,.92)",
        transition: "width .28s cubic-bezier(.4,0,.2,1)",
      }}
    >
      <div className="w-[264px] h-full flex flex-col p-[14px]">
        <button
          onClick={() => void newChat()}
          className="btn-grad w-full flex items-center justify-center gap-[6px] py-[10px] rounded-[11px] text-[13px]"
          style={{ boxShadow: "0 5px 16px rgba(99,102,241,.3)" }}
        >
          <Icon name="plus" size={15} strokeWidth={2.2} />
          New research
        </button>

        <div className="relative mt-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search history"
            className="w-full py-2 pr-[11px] pl-[32px] rounded-[9px] text-[12.5px] text-ink-2"
            style={{ border: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.22)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(129,140,248,.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.08)")}
          />
          <Icon name="search" size={14} className="absolute left-[10px] top-[9px] text-mut-4" />
        </div>

        <nav className="flex-1 overflow-y-auto mt-[14px] -mr-[6px] pr-[6px]">
          {groups.length === 0 && (
            <p className="text-[11.5px] text-mut-4 px-1 py-2">
              {q ? "No matches." : "No research yet — ask something below."}
            </p>
          )}
          {groups.map((g) => (
            <div key={g.label} className="mb-4">
              <div className="mono text-[10px] tracking-[.08em] uppercase text-mut-4 px-1 pb-[6px]">
                {g.label}
              </div>
              {g.items.map((t) => (
                <div key={t.id} className="group relative">
                  <Link
                    href={`/chat/${t.id}`}
                    className="flex gap-[9px] items-center px-[9px] py-2 rounded-[9px] mb-[2px] hover:bg-[rgba(255,255,255,.05)]"
                    style={{ background: t.id === activeId ? "rgba(255,255,255,.06)" : "transparent" }}
                  >
                    <span
                      className="w-[6px] h-[6px] rounded-full shrink-0"
                      style={{ background: t.id === activeId ? "#818cf8" : "rgba(255,255,255,.18)" }}
                    />
                    <span
                      className="flex-1 truncate text-[12.5px] pr-4"
                      style={{ color: t.id === activeId ? "#e9e9ee" : "#9a9aa6" }}
                    >
                      {t.title}
                    </span>
                  </Link>
                  <button
                    title="Delete chat"
                    onClick={() =>
                      void api(`/api/chat/threads/${t.id}`, { method: "DELETE" }).then(() => {
                        onChanged();
                        if (t.id === activeId) router.push("/chat");
                      })
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center text-mut-4 hover:text-[#ff7a7a] bg-transparent border-none cursor-pointer"
                  >
                    <Icon name="x" size={13} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </nav>

        <Link
          href="/settings"
          className="mt-2 flex items-center gap-[9px] px-[10px] py-[9px] rounded-[9px] text-mut text-[12.5px] hover:bg-[rgba(255,255,255,.05)] hover:text-ink-2"
          style={{ border: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.02)" }}
        >
          <span className="w-[6px] h-[6px] rounded-full bg-[#4ade80]" />
          API keys & settings
        </Link>
      </div>
    </aside>
  );
}
