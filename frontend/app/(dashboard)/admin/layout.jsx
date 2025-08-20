"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import usePermissions from "@/hooks/usePermissions";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const permissions = usePermissions();

  useEffect(() => {
    if (!permissions.canViewCompanySettings) {
      router.push("/dashboard");
    }
  }, [permissions, router]);

  if (!permissions.canViewCompanySettings) {
    return null;
  }

  return <>{children}</>;
}