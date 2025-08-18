"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import usePermissions from "@/hooks/usePermissions";

export default function SystemLayout({ children }) {
  const router = useRouter();
  const permissions = usePermissions();

  useEffect(() => {
    if (!permissions.canViewSystemSettings) {
      router.push("/dashboard");
    }
  }, [permissions, router]);

  if (!permissions.canViewSystemSettings) {
    return null;
  }

  return <>{children}</>;
}