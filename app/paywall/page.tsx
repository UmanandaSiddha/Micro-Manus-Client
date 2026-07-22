"use client";

import Guard from "@/components/Guard";

export default function PaywallPage() {
  return (
    <Guard requireEntitlement={false}>
      <main className="flex-1 grid place-items-center text-muted text-sm">
        Paywall lands in M1.
      </main>
    </Guard>
  );
}
