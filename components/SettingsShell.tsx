"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon, { IconName } from "@/components/Icon";
import Logo from "@/components/Logo";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";

const NAV: { href: string; label: string; icon: IconName; color: string }[] = [
  { href: "/settings", label: "LLM keys", icon: "sparkles", color: "#4ade80" },
  { href: "/settings/billing", label: "Billing & credits", icon: "file-text", color: "#fbbf24" },
  { href: "/dashboard", label: "Usage & cost", icon: "table", color: "#22d3ee" },
];
const ADMIN_NAV: (typeof NAV)[number] = {
  href: "/admin",
  label: "Admin",
  icon: "globe",
  color: "#f472b6",
};

/** Settings/dashboard chrome — the design's settings shell. */
export default function SettingsShell({
  children,
  title = "Settings",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const { me, refresh } = useMe();
  const nav = me?.user?.role === "admin" ? [...NAV, ADMIN_NAV] : NAV;

  return (
    <div className="flex flex-col h-screen">
      <div
        className="h-[53px] shrink-0 flex items-center gap-[14px] px-4"
        style={{
          borderBottom: "1px solid rgba(255,255,255,.07)",
          background: "rgba(10,10,14,.6)",
          backdropFilter: "blur(18px)",
        }}
      >
        <Link href="/chat" className="btn-ghost flex items-center gap-[6px] px-[11px] py-[6px] rounded-[9px] text-[13px] text-ink-3">
          <Icon name="arrow-left" size={14} />
          Workspace
        </Link>
        <span className="flex items-center gap-[9px]">
          <Logo withText={false} />
          <span className="font-semibold text-[14.5px]">{title}</span>
        </span>
        <div className="flex-1" />
        <div
          className="flex items-center gap-2 px-3 py-[6px] rounded-[9px]"
          style={{ border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.03)" }}
        >
          <span className="w-[14px] h-[14px] rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #fde68a, #f59e0b)" }} />
          <span className="mono text-xs text-[#e2c078]">{me?.credits ?? 0}</span>
          <span className="text-mut-3 text-[11.5px]">credits</span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 max-w-[1080px] w-full mx-auto">
        <div className="w-[218px] shrink-0 py-[26px] px-[14px] flex flex-col" style={{ borderRight: "1px solid rgba(255,255,255,.06)" }}>
          {nav.map((n) => {
            const active = path === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className="w-full flex items-center gap-[11px] px-[11px] py-[9px] rounded-[9px] text-[13.5px] font-medium mb-[2px] hover:bg-[rgba(255,255,255,.05)]"
                style={{
                  background: active ? "rgba(255,255,255,.06)" : "transparent",
                  color: active ? "#e9e9ee" : "#9a9aa6",
                }}
              >
                <Icon name={n.icon} size={15} style={{ color: active ? n.color : undefined }} />
                {n.label}
              </Link>
            );
          })}
          <div className="flex-1" />
          <button
            onClick={() =>
              void api("/api/auth/logout", { method: "POST" }).then(() =>
                refresh().then(() => router.replace("/")),
              )
            }
            className="w-full flex items-center gap-[11px] px-[11px] py-[9px] rounded-[9px] text-[13.5px] font-medium text-[#ff8a8a] cursor-pointer border-none bg-transparent hover:bg-[rgba(255,80,80,.08)]"
          >
            <Icon name="x" size={15} />
            Sign out
          </button>
        </div>
        <div className="flex-1 overflow-auto px-10 py-[34px]">{children}</div>
      </div>
    </div>
  );
}
