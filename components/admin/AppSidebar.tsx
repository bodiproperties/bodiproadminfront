"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, Newspaper, ImageIcon, LogOut } from "lucide-react";
import { clearToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "Projects", icon: Building2 },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/home", label: "Home images", icon: ImageIcon },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-neutral-950 text-neutral-300">
      {/* Wordmark */}
      <div className="flex items-center gap-3 px-6 pb-6 pt-8">
        <span className="h-7 w-px bg-[#F58220]" />
        <div className="leading-none">
          <p className="text-base font-semibold tracking-tight text-white">BODI</p>
          <p className="mt-1.5 text-[10px] tracking-[0.3em] text-neutral-500">
            PROPERTIES
          </p>
        </div>
      </div>

      <p className="px-6 pb-3 text-[10px] uppercase tracking-[0.3em] text-neutral-600">
        Studio Admin
      </p>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/5 text-white"
                  : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 bg-[#F58220] transition-opacity",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => {
            clearToken();
            router.replace("/admin/login");
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-neutral-400 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}