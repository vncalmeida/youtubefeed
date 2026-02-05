import React, { useEffect, useState } from "react";
import { TrendingUp, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import type { Summary, RevenueByPlan, RevenueTrendItem } from "../types";
import { get } from "../service/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const emptySummary: Summary = {
  totalRevenue: 0,
  mrr: 0,
  arr: 0,
  avgTicket: 0,
  activeSubs: 0,
  churnRate: 0,
  topPlans: [],
};

const palette = ["#E53935", "#FF9800", "#4CAF50", "#03A9F4", "#9C27B0"]; // usa seu tema depois

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export default function AdminDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [revenueByPlan, setRevenueByPlan] = useState<RevenueByPlan[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("adminSidebarCollapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    (async () => {
      try {
        const s = await get<Summary>("/api/admin/metrics/summary");
        if (s.ok && s.data) setSummary(s.data);
        const r = await get<RevenueByPlan[]>("/api/admin/metrics/revenue-by-plan");
        if (r.ok && r.data) setRevenueByPlan(r.data);
        const t = await get<RevenueTrendItem[]>("/api/admin/metrics/revenue-trend");
        if (t.ok && t.data)
          setRevenueTrend(
            t.data.map((item) => ({
              ...item,
              month: new Date(item.month + "-01").toLocaleDateString("pt-BR", { month: "short" }),
            }))
          );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0B0C]">
        Carregando...
      </div>
    );
  }

  const s = summary ?? emptySummary;
  const topPlans = s.topPlans;

  const KPI = ({ title, value, delta, up }: { title: string; value: string; delta?: string; up?: boolean }) => (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className="mt-1 flex items-end gap-2">
        <div className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">{value}</div>
        {delta && (
          <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", up ? "text-emerald-600 bg-emerald-500/10" : "text-red-600 bg-red-500/10") }>
            {up ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
            {delta}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8 dark:bg-[#0B0B0C]">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} summary={s} />
      <div className={cx("md:pl-[260px]", collapsed && "md:pl-[84px]") }>
        <AdminHeader setCollapsed={setCollapsed} title="Dashboard" />
        <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPI title="Faturamento total (30d)" value={`R$ ${s.totalRevenue.toLocaleString("pt-BR")}`} />
            <KPI title="MRR" value={`R$ ${s.mrr.toLocaleString("pt-BR")}`} />
            <KPI title="Ticket médio" value={`R$ ${s.avgTicket.toLocaleString("pt-BR")}`} />
            <KPI title="Churn" value={`${(s.churnRate * 100).toFixed(1)}%`} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11] lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Faturamento mensal</h2>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="month" stroke="currentColor" opacity={0.7} />
                    <YAxis stroke="currentColor" opacity={0.7} tickFormatter={(v) => `R$ ${v/1000}k`} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                    <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="mrr" stroke="#8884d8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Planos que mais venderam</h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie dataKey="revenue" data={topPlans} innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {topPlans.map((_, i) => (
                        <Cell key={i} fill={palette[i % palette.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11] lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Faturamento por plano (30d)</h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByPlan} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="plan" stroke="currentColor" opacity={0.7} />
                    <YAxis stroke="currentColor" opacity={0.7} tickFormatter={(v) => `R$ ${v/1000}k`} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                    <Bar dataKey="revenue" radius={[8,8,0,0]}>
                      {revenueByPlan.map((_, i) => (
                        <Cell key={i} fill={palette[i % palette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Destaques</h2>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
                  <span>Plano com maior receita</span>
                  <span className="font-semibold">{topPlans[0]?.name || '-'}</span>
                </li>
                <li className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
                  <span>Assinaturas ativas</span>
                  <span className="font-semibold">{s.activeSubs.toLocaleString("pt-BR")}</span>
                </li>
                <li className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
                  <span>ARR estimado</span>
                  <span className="font-semibold">R$ {s.arr.toLocaleString("pt-BR")}</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
