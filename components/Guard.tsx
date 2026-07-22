"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMe } from "@/lib/me";

/**
 * Client-side route guard: wraps authed pages.
 * No session → landing. No credits & never purchased/redeemed → paywall.
 */
export default function Guard({
  children,
  requireEntitlement = true,
}: {
  children: React.ReactNode;
  requireEntitlement?: boolean;
}) {
  const { me, loading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!me) router.replace("/");
    else if (requireEntitlement && !me.hasEntitlement && me.credits === 0)
      router.replace("/paywall");
  }, [loading, me, requireEntitlement, router]);

  if (loading || !me) {
    return (
      <div className="flex-1 grid place-items-center text-muted text-sm">
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
