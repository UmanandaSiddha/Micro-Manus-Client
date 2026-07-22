"use client";

import Guard from "@/components/Guard";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";

export default function ChatPage() {
  const { me, refresh } = useMe();

  return (
    <Guard>
      <main className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-lg">
          Signed in as <span className="font-medium">{me?.user.email}</span>
        </p>
        <p className="text-muted text-sm">
          Credits: {me?.credits} — chat lands in M3.
        </p>
        <button
          className="rounded-lg border border-border-c bg-surface px-4 py-2 text-sm hover:bg-surface-2"
          onClick={() =>
            void api("/api/auth/logout", { method: "POST" }).then(() => refresh())
          }
        >
          Sign out
        </button>
      </main>
    </Guard>
  );
}
