"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Guard from "@/components/Guard";
import SettingsShell from "@/components/SettingsShell";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";

interface Stats {
  users: number;
  runs: number;
  failed_runs: number;
  artifacts: number;
  llm_cost_usd: number;
  purchases: number;
  coupon_redemptions: number;
  credits_granted: number;
  credits_spent: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  credits: number;
  created_at: string;
  threads: number;
  runs: number;
  cost_usd: number;
  has_key: boolean;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-[16px] rounded-[14px]" style={{ border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)" }}>
      <div className="text-xs text-mut-2">{label}</div>
      <div className="text-[24px] font-semibold tracking-[-.02em] mt-1">{value}</div>
      {sub && <div className="text-[11px] text-mut-3 mt-[2px]">{sub}</div>}
    </div>
  );
}

function AdminInner() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const isAdmin = me?.user?.role === "admin";

  useEffect(() => {
    if (!loading && me && !isAdmin) router.replace("/chat");
  }, [loading, me, isAdmin, router]);

  const load = useCallback(async () => {
    const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    const [s, u] = await Promise.all([
      api<Stats>("/api/admin/stats"),
      api<AdminUser[]>(`/api/admin/users${q}`),
    ]);
    setStats(s);
    setUsers(u);
  }, [search]);

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(() => void load().catch(() => {}), 250); // debounce search
    return () => clearTimeout(t);
  }, [isAdmin, load]);

  const grant = async (id: string, delta: number) => {
    setBusy(id);
    try {
      await api(`/api/admin/users/${id}/credits`, { method: "POST", json: { delta } });
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (!isAdmin) return null;

  return (
    <SettingsShell title="Admin">
      <h1 className="text-[22px] font-semibold tracking-[-.02em]">Platform overview</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <StatCard label="Users" value={String(stats.users)} />
          <StatCard
            label="Runs"
            value={String(stats.runs)}
            sub={`${stats.failed_runs} failed`}
          />
          <StatCard label="Artifacts" value={String(stats.artifacts)} />
          <StatCard label="LLM cost (all users)" value={`$${stats.llm_cost_usd.toFixed(2)}`} />
          <StatCard label="Purchases" value={String(stats.purchases)} sub="Stripe checkouts" />
          <StatCard label="Coupons redeemed" value={String(stats.coupon_redemptions)} />
          <StatCard label="Credits granted" value={String(stats.credits_granted)} />
          <StatCard label="Credits spent" value={String(stats.credits_spent)} />
        </div>
      )}

      <div className="flex items-center gap-3 mt-9 mb-3">
        <h2 className="text-[16px] font-semibold flex-1">Users</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email or name…"
          className="px-3 py-[7px] rounded-[9px] text-[12.5px] w-[220px]"
          style={{ border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.25)" }}
        />
      </div>

      <div className="rounded-[12px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,.09)" }}>
        <div
          className="flex px-4 py-[9px] mono text-[10.5px] uppercase tracking-wider text-mut-3"
          style={{ background: "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.08)" }}
        >
          <span className="flex-[2]">User</span>
          <span className="w-[52px] text-right">Credits</span>
          <span className="w-[46px] text-right">Runs</span>
          <span className="w-[72px] text-right">LLM cost</span>
          <span className="w-[40px] text-center">Key</span>
          <span className="w-[120px] text-right">Adjust credits</span>
        </div>
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center px-4 py-[10px] text-[12.5px]"
            style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}
          >
            <span className="flex-[2] min-w-0">
              <span className="block truncate text-ink-2">
                {u.name ?? "—"}
                {u.role === "admin" && (
                  <span className="ml-2 mono text-[9px] uppercase px-[6px] py-[1px] rounded-full" style={{ border: "1px solid rgba(244,114,182,.4)", color: "#f472b6" }}>
                    admin
                  </span>
                )}
              </span>
              <span className="block truncate text-mut-3 text-[11px]">{u.email}</span>
            </span>
            <span className="w-[52px] text-right mono text-[#e2c078]">{u.credits}</span>
            <span className="w-[46px] text-right mono text-mut-2">{u.runs}</span>
            <span className="w-[72px] text-right mono text-mut-2">${u.cost_usd.toFixed(2)}</span>
            <span className="w-[40px] text-center">{u.has_key ? "✓" : "—"}</span>
            <span className="w-[120px] flex justify-end gap-[6px]">
              {[-1, +1, +5].map((d) => (
                <button
                  key={d}
                  disabled={busy === u.id || (d < 0 && u.credits === 0)}
                  onClick={() => void grant(u.id, d)}
                  className="btn-ghost px-2 py-[3px] rounded-md mono text-[11px] disabled:opacity-40"
                  title={`${d > 0 ? "Grant" : "Remove"} ${Math.abs(d)} credit${Math.abs(d) > 1 ? "s" : ""}`}
                >
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
            </span>
          </div>
        ))}
        {users.length === 0 && <p className="text-mut text-sm p-5 text-center">No users match.</p>}
      </div>
    </SettingsShell>
  );
}

export default function AdminPage() {
  return (
    <Guard>
      <AdminInner />
    </Guard>
  );
}
