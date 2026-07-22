"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Eye, EyeOff, Clock } from "lucide-react";
import { getNewsAdmin, type NewsItem } from "@/lib/api";

const MONTHS = ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р", "7-р", "8-р", "9-р", "10-р", "11-р", "12-р"];

function lastMonths(n: number) {
  const arr: { key: string; label: string }[] = [];
  const base = new Date();
  base.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(base.getFullYear(), base.getMonth() - i, 1);
    arr.push({ key: `${dt.getFullYear()}-${dt.getMonth()}`, label: MONTHS[dt.getMonth()] });
  }
  return arr;
}

const monthKey = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
};

export default function AdminHome() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setNews(await getNewsAdmin());
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const now = Date.now();

  const published = news.filter((n) => n.status === "published").length;
  const drafts = news.filter((n) => n.status === "draft").length;
  const hidden = news.filter((n) => n.status === "hidden").length;
  const scheduled = news.filter(
    (n) =>
      n.status === "published" &&
      n.publishedAt &&
      new Date(n.publishedAt).getTime() > now
  ).length;

  const incomplete = news.filter((n) => {
    const hasEn = !!(n.title?.en || n.desc?.en);
    const hasMn = !!(n.title?.mn || n.desc?.mn);
    return !hasEn || !hasMn;
  }).length;

  const chart = useMemo(() => {
    const months = lastMonths(6);
    const base = months.map((m) => ({ ...m, published: 0, other: 0 }));
    const idx = new Map(base.map((m, i) => [m.key, i]));

    news.forEach((n) => {
      const k = monthKey(n.publishedAt || n.createdAt || n.updatedAt);
      if (k && idx.has(k)) {
        if (n.status === "published") base[idx.get(k)!].published += 1;
        else base[idx.get(k)!].other += 1;
      }
    });

    const max = Math.max(1, ...base.map((m) => m.published + m.other));
    return { rows: base, max };
  }, [news]);

  const stats = [
    { label: "Нийт мэдээ", value: news.length, href: "/admin/news", icon: FileText },
    { label: "Нийтэлсэн", value: published, href: "/admin/news", icon: Eye },
    { label: "Ноорог", value: drafts, href: "/admin/news", icon: EyeOff },
    { label: "Нуусан", value: hidden, href: "/admin/news", icon: EyeOff },
  ];

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#F58220]">Overview</p>
      <h1 className="mt-3 text-3xl font-extralight tracking-tight text-neutral-900 md:text-4xl">
        Хяналтын самбар
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Контентын төлөв, сүүлийн өөрчлөлтүүд.</p>

      {/* Stat index */}
      <div className="mt-10 grid grid-cols-2 border-y border-neutral-200 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className={`group relative px-6 py-9 transition-colors hover:bg-neutral-50 ${
                i < stats.length - 1 ? "border-b border-neutral-200 lg:border-b-0 lg:border-r" : ""
              } ${i % 2 === 0 ? "border-r border-neutral-200 lg:border-r" : ""}`}
            >
              <Icon className="absolute right-5 top-6 h-4 w-4 text-neutral-300 transition-colors group-hover:text-[#F58220]" />
              <p className="text-5xl font-extralight tabular-nums text-neutral-900">
                {loading ? "—" : s.value}
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                {s.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Chart + breakdown */}
      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
              Мэдээ — сүүлийн 6 сар
            </p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                <span className="h-2 w-2 rounded-sm bg-[#F58220]" /> Нийтэлсэн
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                <span className="h-2 w-2 rounded-sm bg-neutral-300" /> Ноорог/Нуусан
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            {loading ? (
              <div className="py-16 text-center text-sm text-neutral-400">Ачааллаж байна…</div>
            ) : (
              <div className="flex items-end justify-between gap-3" style={{ height: 220 }}>
                {chart.rows.map((m) => {
                  const total = m.published + m.other;
                  const h = (total / chart.max) * 180;
                  const pubH = total ? (m.published / total) * h : 0;
                  const othH = total ? (m.other / total) * h : 0;
                  return (
                    <div key={m.key} className="flex flex-1 flex-col items-center gap-3">
                      <div className="flex w-full flex-col items-center justify-end" style={{ height: 180 }}>
                        {total > 0 && (
                          <span className="mb-1.5 text-xs font-medium tabular-nums text-neutral-700">
                            {total}
                          </span>
                        )}
                        <div
                          className="flex w-full max-w-[44px] flex-col overflow-hidden rounded"
                          style={{ height: h }}
                        >
                          {othH > 0 && (
                            <div
                              className="w-full bg-neutral-300 transition-all"
                              style={{ height: othH }}
                              title={`Ноорог/Нуусан: ${m.other}`}
                            />
                          )}
                          {pubH > 0 && (
                            <div
                              className="w-full bg-[#F58220] transition-all"
                              style={{ height: pubH }}
                              title={`Нийтэлсэн: ${m.published}`}
                            />
                          )}
                          {total === 0 && <div className="mt-auto h-0.5 w-full bg-neutral-100" />}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.1em] text-neutral-400">
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Breakdown */}
        <div>
          <p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            Төлөвийн задаргаа
          </p>
          <div className="space-y-px overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {[
              { label: "Нийтэлсэн", value: published, dot: "bg-[#F58220]" },
              { label: "Хуваарьт", value: scheduled, dot: "bg-amber-400" },
              { label: "Ноорог", value: drafts, dot: "bg-neutral-300" },
              { label: "Нуусан", value: hidden, dot: "bg-neutral-900" },
            ].map((row, i) => (
              <div
                key={row.label}
                className={`flex items-center justify-between px-5 py-3.5 ${
                  i < 3 ? "border-b border-neutral-100" : ""
                }`}
              >
                <span className="inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.15em] text-neutral-500">
                  <span className={`h-1.5 w-1.5 rounded-full ${row.dot}`} />
                  {row.label}
                </span>
                <span className="text-lg font-extralight tabular-nums text-neutral-900">
                  {loading ? "—" : row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/admin/news"
          className="bg-neutral-900 px-8 py-3.5 text-[11px] uppercase tracking-[0.25em] text-white transition-colors hover:bg-neutral-800"
        >
          Мэдээ удирдах
        </Link>
        <Link
          href="/admin/projects"
          className="border border-neutral-900 px-8 py-3.5 text-[11px] uppercase tracking-[0.25em] text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
        >
          Төсөл удирдах
        </Link>
      </div>
    </div>
  );
}