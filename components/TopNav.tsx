"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import type { ModelOption } from "@/lib/models";

const VENDOR_DOT: Record<string, string> = {
  anthropic: "#a78bfa",
  openai: "#4ade80",
  moonshot: "#60a5fa",
  groq: "#f55036",
};

function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return ref;
}

function ModelSelector({
  models,
  modelId,
  setModelId,
}: {
  models: ModelOption[];
  modelId: string;
  setModelId: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const current = models.find((m) => m.id === modelId);

  return (
    <div className="relative ml-2" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost flex items-center gap-[9px] px-[11px] py-[6px] rounded-[9px] text-[13px]"
      >
        <span
          className="grad w-[7px] h-[7px] rounded-full"
          style={{ boxShadow: "0 0 8px rgba(129,140,248,.7)" }}
        />
        <span className="font-medium max-w-[96px] sm:max-w-none truncate">
          {current?.label ?? "Pick a model"}
        </span>
        {current && (
          <span className="mono text-[11px] text-mut-3 hidden sm:inline">
            ${current.pricing.in}/{current.pricing.out}
          </span>
        )}
        <Icon name="chevron-down" size={13} className="text-mut-3" />
      </button>
      {open && (
        <div className="menu-pop absolute top-[38px] left-0 w-[min(300px,86vw)] p-[6px] rounded-[14px] z-40" style={{ background: "#16161d" }}>
          {models.length === 0 && (
            <div className="px-3 py-3 text-[12.5px] text-mut-2">
              No models yet —{" "}
              <Link href="/settings" className="text-accent" onClick={() => setOpen(false)}>
                add an API key
              </Link>{" "}
              to unlock them.
            </div>
          )}
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setModelId(m.id);
                setOpen(false);
              }}
              className="w-full text-left flex gap-[11px] items-start px-[11px] py-[10px] rounded-[9px] cursor-pointer border-none hover:bg-[rgba(255,255,255,.06)]"
              style={{ background: modelId === m.id ? "rgba(255,255,255,.05)" : "transparent" }}
            >
              <span
                className="w-2 h-2 rounded-full mt-[5px] shrink-0"
                style={{ background: VENDOR_DOT[m.vendor] ?? "#818cf8" }}
              />
              <span className="flex-1">
                <span className="flex justify-between items-center">
                  <span className="text-[13.5px] font-semibold text-ink">{m.label}</span>
                  <span className="mono text-[10.5px] text-mut-3">
                    ${m.pricing.in} / ${m.pricing.out} per 1M
                  </span>
                </span>
                <span className="block text-xs text-mut-2 mt-[2px] capitalize">
                  {m.vendor} · via {m.via}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountMenu() {
  const { me, refresh } = useMe();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const initials =
    me?.user?.name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ??
    me?.user?.email.slice(0, 2).toUpperCase() ??
    "MM";

  const items = [
    { label: "Settings", hint: "keys", act: () => router.push("/settings") },
    { label: "Cost dashboard", hint: "usage", act: () => router.push("/dashboard") },
    ...(me?.user?.role === "admin"
      ? [{ label: "Admin", hint: "platform", act: () => router.push("/admin") }]
      : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-[31px] h-[31px] rounded-full text-xs font-semibold text-white flex items-center justify-center cursor-pointer"
        style={{
          border: "1px solid rgba(255,255,255,.14)",
          background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
        }}
      >
        {initials}
      </button>
      {open && (
        <div className="menu-pop absolute top-10 right-0 w-[214px] p-[6px] rounded-[13px] z-40" style={{ background: "#16161d" }}>
          <div className="px-[11px] pt-[9px] pb-[7px]">
            <div className="text-[13px] font-semibold truncate">{me?.user?.name ?? "Researcher"}</div>
            <div className="text-[11.5px] text-mut-2 truncate">{me?.user?.email}</div>
          </div>
          <div className="h-px my-1" style={{ background: "rgba(255,255,255,.08)" }} />
          {items.map((i) => (
            <button
              key={i.label}
              onClick={() => {
                setOpen(false);
                i.act();
              }}
              className="w-full text-left px-[11px] py-2 rounded-lg border-none bg-transparent text-ink-2 cursor-pointer text-[13px] flex justify-between items-center hover:bg-[rgba(255,255,255,.06)]"
            >
              <span>{i.label}</span>
              <span className="mono text-[10px] text-mut-4">{i.hint}</span>
            </button>
          ))}
          <div className="h-px my-1" style={{ background: "rgba(255,255,255,.08)" }} />
          <button
            onClick={() =>
              void api("/api/auth/logout", { method: "POST" }).then(() =>
                refresh().then(() => router.replace("/")),
              )
            }
            className="w-full text-left px-[11px] py-2 rounded-lg border-none bg-transparent text-[#ff8a8a] cursor-pointer text-[13px] hover:bg-[rgba(255,80,80,.08)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function TopNav({
  models,
  modelId,
  setModelId,
  onToggleSidebar,
}: {
  models: ModelOption[];
  modelId: string;
  setModelId: (id: string) => void;
  onToggleSidebar: () => void;
}) {
  const { me } = useMe();
  const [buying, setBuying] = useState(false);

  const buy = async () => {
    setBuying(true);
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", { method: "POST" });
      window.location.href = url;
    } catch {
      setBuying(false);
    }
  };

  return (
    <div
      // relative z-50: the header's dropdowns hang into the content area below;
      // without a raised stacking context the (positioned) content wrapper
      // paints over them and swallows their clicks.
      className="h-[53px] shrink-0 flex items-center gap-2 sm:gap-[14px] px-3 sm:px-4 relative z-50"
      style={{
        borderBottom: "1px solid rgba(255,255,255,.07)",
        background: "rgba(10,10,14,.6)",
        backdropFilter: "blur(18px)",
      }}
    >
      <button
        onClick={onToggleSidebar}
        className="btn-ghost w-[30px] h-[30px] shrink-0 rounded-lg flex items-center justify-center text-[#b9b9c4]"
        title="Toggle sidebar"
      >
        <Icon name="menu" size={16} />
      </button>
      <Link href="/chat" className="shrink-0">
        <span className="sm:hidden"><Logo withText={false} /></span>
        <span className="hidden sm:inline"><Logo /></span>
      </Link>

      <ModelSelector models={models} modelId={modelId} setModelId={setModelId} />

      <div className="flex-1" />

      <div
        className="flex items-center gap-2 px-3 py-[6px] rounded-[9px]"
        style={{ border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.03)" }}
        title="Research credits — 1 per run"
      >
        <span
          className="w-[14px] h-[14px] rounded-full"
          style={{ background: "radial-gradient(circle at 35% 30%, #fde68a, #f59e0b)" }}
        />
        <span className="mono text-xs text-[#e2c078] font-medium">{me?.credits ?? 0}</span>
        <span className="text-mut-3 text-[11.5px] hidden sm:inline">credits</span>
      </div>
      <button
        onClick={() => void buy()}
        disabled={buying}
        className="btn-grad shrink-0 px-[13px] py-[7px] rounded-[9px] text-[12.5px] disabled:opacity-60"
      >
        {buying ? "…" : <><span className="hidden sm:inline">Buy credits</span><span className="sm:hidden">Buy</span></>}
      </button>

      <AccountMenu />
    </div>
  );
}
