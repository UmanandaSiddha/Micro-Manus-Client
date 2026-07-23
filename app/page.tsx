"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Logo from "@/components/Logo";
import { useMe } from "@/lib/me";

const FEATURES = [
  { color: "#60a5fa", text: "live agent timeline" },
  { color: "#4ade80", text: "cited PDF reports" },
  { color: "#fbbf24", text: "cost per token, transparent" },
];

export default function Landing() {
  const { me, loading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (!loading && me) router.replace("/chat");
  }, [loading, me, router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-10 py-16 text-center">
      <div className="flex items-center gap-[10px] mb-[38px]" style={{ animation: "fadeUp .6s ease both" }}>
        <Logo size={30} textSize={19} />
      </div>

      <div
        className="inline-flex items-center gap-2 px-[14px] py-[6px] rounded-full text-[12.5px] text-[#b9b9c4] mb-[26px]"
        style={{
          border: "1px solid rgba(255,255,255,.1)",
          background: "rgba(255,255,255,.03)",
          backdropFilter: "blur(10px)",
          animation: "fadeUp .6s .05s ease both",
        }}
      >
        <span className="w-[6px] h-[6px] rounded-full bg-[#4ade80]" style={{ boxShadow: "0 0 8px #4ade80" }} />
        Deep Research Agent · BYOK
      </div>

      <h1
        className="serif font-normal max-w-[15ch] mx-auto"
        style={{
          fontSize: "clamp(40px, 6.4vw, 78px)",
          lineHeight: 1.02,
          letterSpacing: "-.02em",
          animation: "fadeUp .7s .1s ease both",
        }}
      >
        Research that runs
        <br />
        <span
          className="italic"
          style={{
            background: "linear-gradient(120deg, #a5b0ff, #7dd3fc)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          while you don&apos;t.
        </span>
      </h1>

      <p
        className="max-w-[52ch] mx-auto mt-[22px] text-mut text-[16.5px] leading-[1.6]"
        style={{ animation: "fadeUp .7s .16s ease both" }}
      >
        MicroManus browses the web, reasons through the hard parts, and hands
        you finished artifacts — cited reports, data, documents — not just
        answers. On your own LLM key, with every token accounted for.
      </p>

      <div className="flex gap-3 justify-center mt-[34px]" style={{ animation: "fadeUp .7s .22s ease both" }}>
        <Link
          href="/login"
          className="btn-grad px-[26px] py-[13px] rounded-xl text-[14.5px]"
          style={{ boxShadow: "0 8px 26px rgba(99,102,241,.36), inset 0 1px 0 rgba(255,255,255,.35)" }}
        >
          Get started — 5 credits with a coupon
        </Link>
        <Link
          href="/login"
          className="btn-ghost px-6 py-[13px] rounded-xl text-[14.5px] font-medium"
          style={{ backdropFilter: "blur(8px)" }}
        >
          Sign in →
        </Link>
      </div>

      <div className="flex gap-[26px] justify-center mt-[52px] flex-wrap" style={{ animation: "fadeUp .8s .3s ease both" }}>
        {FEATURES.map((f) => (
          <div key={f.text} className="flex items-center gap-[9px] text-[13px]">
            <span className="w-[5px] h-[5px] rounded-full" style={{ background: f.color }} />
            <span className="mono text-[11.5px] tracking-[.02em] text-mut">{f.text}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
