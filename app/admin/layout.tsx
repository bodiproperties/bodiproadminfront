"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthed } from "@/lib/api";
import AppSidebar from "@/components/admin/AppSidebar";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!isAuthed()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <AppSidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-5xl px-10 py-10">{children}</div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
