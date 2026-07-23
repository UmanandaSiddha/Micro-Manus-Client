"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { useMe } from "@/lib/me";

const NAV = [
  { href: "/settings", label: "LLM keys", dot: "#4ade80" },
  { href: "/settings/billing", label: "Billing & credits", dot: "#fbbf24" },
  { href: "/dashboard", label: "Usage & cost", dot: "#22d3ee" },
];

/** Settings/dashboard chrome — the design's settings shell. */
export default function SettingsShell({
  children,
  title = "Settings",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const path = usePathname();
  const { me } = useMe();

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
        <Link href="/chat" className="btn-ghost flex items-center gap-2 px-[11px] py-[6px] rounded-[9px] text-[13px] text-ink-3">
          ← Workspace
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
        <div className="w-[218px] shrink-0 py-[26px] px-[14px]" style={{ borderRight: "1px solid rgba(255,255,255,.06)" }}>
          {NAV.map((n) => {
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
                <span className="w-[6px] h-[6px] rounded-[2px]" style={{ background: n.dot }} />
                {n.label}
              </Link>
            );
          })}
        </div>
        <div className="flex-1 overflow-auto px-10 py-[34px]">{children}</div>
      </div>
    </div>
  );
}
