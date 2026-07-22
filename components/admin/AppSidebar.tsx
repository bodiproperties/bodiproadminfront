"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Newspaper,
  ImageIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  CircleUserRound,
} from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { clearToken } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    section: "OVERVIEW",
    items: [
      {
        href: "/admin",
        label: "Хянах самбар",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      {
        href: "/admin/projects",
        label: "Төслүүд",
        icon: Building2,
      },
      {
        href: "/admin/news",
        label: "Мэдээ",
        icon: Newspaper,
      },
      {
        href: "/admin/home",
        label: "Нүүр хуудас",
        icon: ImageIcon,
      },
    ],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    clearToken();
    router.replace("/admin/login");
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col",
        "border-r border-white/[0.06]",
        "bg-[#0A0A0A] text-neutral-300",
        "shadow-[4px_0_24px_rgba(0,0,0,0.35)]",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[76px]" : "w-[260px]"
      )}
    >
      {/* ========================================
          HEADER / LOGO
      ======================================== */}
      <div
        className={cn(
          "relative flex h-[92px] items-center",
          collapsed ? "justify-center" : "px-6"
        )}
      >
        {/* Orange vertical accent */}
        <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-[#F58220] via-[#F58220]/50 to-transparent" />

        <div
          className={cn(
            "flex min-w-0 items-center gap-3 transition-all",
            collapsed && "gap-0"
          )}
        >
          {/* Logo mark — жинхэнэ компанийн лого */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06]">
            <div className="absolute inset-0 bg-[#F58220]/10" />
            <Image
              src="/images/solologo.png"
              alt="Bodi Properties"
              fill
              sizes="40px"
              className="relative object-contain p-1.5"
              priority
            />
          </div>

          {/* Logo text */}
          {!collapsed && (
            <div className="min-w-0 leading-none">
              <p className="truncate text-[15px] font-semibold tracking-[0.08em] text-white">
                BODI
              </p>
              <p className="mt-2 text-[8px] font-medium tracking-[0.28em] text-neutral-500">
                PROPERTIES
              </p>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Цэс дэлгэх" : "Цэс хумих"}
          className={cn(
            "absolute -right-3 top-9",
            "flex h-6 w-6 items-center justify-center",
            "rounded-full border border-white/10",
            "bg-[#151515]",
            "text-neutral-500",
            "shadow-lg",
            "transition-all duration-200",
            "hover:border-[#F58220]/50",
            "hover:bg-[#F58220]",
            "hover:text-white",
            "active:scale-90"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* ========================================
          NAVIGATION
      ======================================== */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.08)_transparent]">
        {NAV.map((group) => (
          <div key={group.section} className="mb-7">
            {/* Section title */}
            {!collapsed && (
              <div className="mb-2 px-3">
                <p className="text-[9px] font-semibold tracking-[0.25em] text-neutral-600">
                  {group.section}
                </p>
              </div>
            )}

            <div className="space-y-1">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact
                  ? pathname === href
                  : pathname.startsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "group relative flex items-center",
                      "h-11 rounded-lg",
                      "transition-all duration-200",
                      collapsed ? "justify-center px-0" : "gap-3 px-3",
                      active
                        ? "bg-gradient-to-r from-[#F58220]/15 to-transparent text-white"
                        : "text-neutral-500 hover:bg-white/[0.035] hover:text-neutral-200"
                    )}
                  >
                    {/* Active indicator */}
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-r-full bg-[#F58220]",
                        "transition-all duration-300",
                        active
                          ? "opacity-100 shadow-[0_0_12px_rgba(245,130,32,0.8)]"
                          : "opacity-0"
                      )}
                    />

                    {/* Icon */}
                    <Icon
                      className={cn(
                        "h-[17px] w-[17px] shrink-0",
                        "transition-all duration-200",
                        active
                          ? "text-[#F58220]"
                          : "text-neutral-600 group-hover:text-neutral-300 group-hover:scale-110"
                      )}
                    />

                    {/* Label */}
                    {!collapsed && (
                      <span className="flex-1 truncate text-[13px] font-medium">
                        {label}
                      </span>
                    )}

                    {/* Collapsed active dot */}
                    {collapsed && active && (
                      <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#F58220] shadow-[0_0_8px_rgba(245,130,32,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ========================================
          BOTTOM AREA
      ======================================== */}
      <div className="border-t border-white/[0.06] p-3">
        {/* Admin profile */}
        <div
          className={cn(
            "mb-2 flex items-center rounded-lg bg-white/[0.025]",
            "transition-all",
            collapsed ? "justify-center p-2" : "gap-3 px-3 py-3"
          )}
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F58220] to-[#C85D00]">
            <CircleUserRound className="h-4 w-4 text-white" />
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-[#0A0A0A] bg-green-500" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-white">
                Administrator
              </p>
              <p className="mt-0.5 truncate text-[9px] tracking-wide text-neutral-600">
                BODI PROPERTIES
              </p>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          className={cn(
            "group flex w-full items-center rounded-lg text-neutral-600",
            "transition-all duration-200",
            "hover:bg-white/[0.035] hover:text-neutral-300",
            collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"
          )}
        >
          <Settings className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
          {!collapsed && (
            <span className="text-[12px] font-medium">Тохиргоо</span>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          title={collapsed ? "Гарах" : undefined}
          className={cn(
            "group flex w-full items-center rounded-lg text-neutral-600",
            "transition-all duration-200",
            "hover:bg-red-500/[0.06] hover:text-red-400",
            collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"
          )}
        >
          <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          {!collapsed && (
            <span className="text-[12px] font-medium">Гарах</span>
          )}
        </button>
      </div>
    </aside>
  );
}