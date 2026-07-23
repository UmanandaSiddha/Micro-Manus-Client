"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginButtons from "@/components/LoginButtons";
import Logo from "@/components/Logo";
import { useMe } from "@/lib/me";

export default function LoginPage() {
  const { me, loading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (!loading && me) router.replace("/chat");
  }, [loading, me, router]);

  return (
    <main className="flex-1 flex items-center justify-center p-10">
      <div
        className="w-full max-w-[404px] rounded-[22px] px-[34px] py-[38px]"
        style={{
          border: "1px solid rgba(255,255,255,.09)",
          background: "linear-gradient(180deg, rgba(22,22,28,.86), rgba(14,14,18,.86))",
          backdropFilter: "blur(22px)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,.7)",
          animation: "fadeUp .5s ease both",
        }}
      >
        <div className="mb-[26px]">
          <Logo size={26} textSize={16} />
        </div>
        <h2 className="text-[22px] font-semibold tracking-[-.02em]">Welcome</h2>
        <p className="text-mut-2 mt-[6px] text-sm">
          Sign in to pick up where your agents left off.
        </p>
        <div className="mt-6">
          <LoginButtons />
        </div>
        <p className="mt-[18px] text-center text-mut-3 text-[11.5px] leading-[1.5]">
          Sign-in opens a secure popup. No passwords, no verification emails.
        </p>
      </div>
    </main>
  );
}
