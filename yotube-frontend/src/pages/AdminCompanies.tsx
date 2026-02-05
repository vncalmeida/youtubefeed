import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  Building2,
  Users as UsersIcon,
  Mail,
  User,
  Shield,
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import type { Summary, Plan, Company, CompanyUser, PlanConfig } from "../types";
import {
  getCompanies,
  createCompany as apiCreateCompany,
  updateCompany as apiUpdateCompany,
  deleteCompany as apiDeleteCompany,
  getCompanyUsers,
  createCompanyUser as apiCreateCompanyUser,
  updateCompanyUser as apiUpdateCompanyUser,
  deleteCompanyUser as apiDeleteCompanyUser,
} from "../service/companies";
import { getPlans } from "../service/plans";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const toNumber = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : Number(v) || 0);
const BRL = (v: number | null | undefined) => `R$ ${toNumber(v).toLocaleString("pt-BR")}`;
const formatDateBR = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
};

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-16 mx-auto w-full max-w-3xl rounded-2xl border border-gray-200/70 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#0F0F11]"
          >
            <div className="mb-3 flex items-center justify-between border-b border-gray-200/60 pb-2 dark:border-white/10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Modal de confirmação genérico (substitui alert/confirm) */
function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title}>
      <p className="text-sm text-gray-700 dark:text-gray-200">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={loading}
          className={cx(
            "rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-white/5 dark:text-gray-100",
            loading && "opacity-70 cursor-not-allowed"
          )}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cx(
            "inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors",
            tone === "danger"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-[var(--primary)] hover:bg-[var(--primary-dark)]",
            loading && "opacity-70 cursor-not-allowed"
          )}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

function TextInput({ icon, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="flex h-11 items-center rounded-xl border-2 border-transparent bg-gray-100 px-3 transition-all focus-within:border-[var(--primary)] focus-within:bg-white dark:bg-white/5 dark:focus-within:bg-white/10">
      {icon && <div className="mr-2 text-gray-500 dark:text-gray-400">{icon}</div>}
      <input
        {...rest}
        className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
      />
    </div>
  );
}

function Select({ children, className = "", ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative h-11">
      <select
        {...rest}
        className={cx(
          "h-11 w-full appearance-none rounded-xl border-2 border-transparent bg-gray-100 px-3 pr-8 outline-none transition-all focus:border-[var(--primary)] focus:bg-white dark:bg-white/5 dark:text-gray-100 dark:focus:bg-white/10",
          className
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-gray-500" />
    </div>
  );
}

function CompanyForm({
  initial,
  onSubmit,
  submitting,
  plans,
}: {
  initial?: Partial<Company>;
  onSubmit: (data: Partial<Company>) => void;
  submitting?: boolean;
  plans: PlanConfig[];
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [plan, setPlan] = useState<string>(initial?.plan ?? "");
  const [mrr, setMrr] = useState<number>(toNumber(initial?.mrr));
  const [planExpiresAt, setPlanExpiresAt] = useState<string>(
    initial?.planExpiresAt ? initial.planExpiresAt.substring(0, 10) : ""
  );

  useEffect(() => {
    if (!plan && plans.length) {
      setPlan(initial?.plan ?? plans[0].name);
    }
  }, [initial?.plan, plan, plans]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, plan: plan as Plan, mrr, planExpiresAt: planExpiresAt || null });
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da empresa</label>
        <TextInput
          icon={<Building2 className="h-5 w-5" />}
          placeholder="Ex.: Minha Empresa LTDA"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Plano</label>
          <Select value={plan} onChange={(e) => setPlan(e.target.value)}>
            {plans.map((p) => (
              <option key={p.id} value={p.name} className="dark:bg-[#0F0F11]">
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">MRR</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={mrr}
            onChange={(e) => setMrr(parseFloat(e.target.value || "0"))}
            className="h-11 w-full rounded-xl border-2 border-transparent bg-gray-100 px-3 outline-none focus:border-[var(--primary)] focus:bg-white dark:bg-white/5 dark:text-gray-100 dark:focus:bg-white/10"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Vencimento</label>
          <input
            type="date"
            value={planExpiresAt}
            onChange={(e) => setPlanExpiresAt(e.target.value)}
            className="h-11 w-full rounded-xl border-2 border-transparent bg-gray-100 px-3 outline-none focus:border-[var(--primary)] focus:bg-white dark:bg-white/5 dark:text-gray-100 dark:focus:bg-white/10"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className={cx(
            "inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[var(--primary-dark)]",
            submitting && "opacity-70"
          )}
        >
          Salvar
        </button>
      </div>
    </form>
  );
}

function UserForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Partial<CompanyUser>;
  onSubmit: (data: Partial<CompanyUser>) => void;
  submitting?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<CompanyUser["role"]>(initial?.role ?? "member");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, email, role });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
          <TextInput
            icon={<User className="h-5 w-5" />}
            placeholder="Nome do usuário"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
          <TextInput
            icon={<Mail className="h-5 w-5" />}
            placeholder="user@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Papel</label>
          <Select value={role} onChange={(e) => setRole(e.target.value as CompanyUser["role"])}>
            <option value="owner" className="dark:bg-[#0F0F11]">
              Proprietário
            </option>
            <option value="admin" className="dark:bg-[#0F0F11]">
              Admin
            </option>
            <option value="member" className="dark:bg-[#0F0F11]">
              Membro
            </option>
          </Select>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          disabled={submitting}
          className={cx(
            "inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[var(--primary-dark)]",
            submitting && "opacity-70"
          )}
        >
          {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          Salvar usuário
        </button>
      </div>
    </form>
  );
}

export default function AdminCompanies() {
  const [collapsed, setCollapsed] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [planFilter, setPlanFilter] = useState<string>("all");

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  /** estado do ConfirmModal */
  type ConfirmCfg = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "default" | "danger";
    action: () => Promise<void> | void;
  };
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmCfg, setConfirmCfg] = useState<ConfirmCfg | null>(null);
  const runConfirm = async () => {
    if (!confirmCfg) return;
    setConfirmLoading(true);
    try {
      await confirmCfg.action();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro na operação");
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmCfg(null);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("adminSidebarCollapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompanies();
      setCompanies(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const loadPlans = useCallback(async () => {
    try {
      const data = await getPlans();
      setPlans(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const filtered = useMemo(() => {
    return companies
      .filter((c) => (planFilter === "all" ? true : c.plan === planFilter))
      .filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  }, [companies, q, planFilter]);

  const kpis = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const newThisMonth = companies.filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return !isNaN(t) && t >= monthStart;
    }).length;
    return { total: companies.length, newThisMonth };
  }, [companies]);

  const summary = useMemo<Summary>(() => {
    const mrr = companies.reduce((sum, c) => sum + toNumber(c.mrr), 0);
    const avgTicket = companies.length ? mrr / companies.length : 0;
    const planMap: Record<string, { revenue: number; sales: number }> = {};
    companies.forEach((c) => {
      const stats = planMap[c.plan] || (planMap[c.plan] = { revenue: 0, sales: 0 });
      stats.revenue += toNumber(c.mrr);
      stats.sales += 1;
    });
    const topPlans = Object.entries(planMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([name, { revenue, sales }]) => ({ name, revenue, sales }));
    return {
      totalRevenue: mrr,
      mrr,
      arr: mrr * 12,
      avgTicket,
      activeSubs: companies.length,
      churnRate: 0,
      topPlans,
    };
  }, [companies]);

  const openCreateCompany = () => {
    setEditingCompany(null);
    setCompanyModalOpen(true);
  };
  const openEditCompany = (c: Company) => {
    setEditingCompany(c);
    setCompanyModalOpen(true);
  };

  const saveCompany = async (data: Partial<Company>) => {
    setSavingCompany(true);
    try {
      if (editingCompany) {
        await apiUpdateCompany(editingCompany.id, data);
      } else {
        await apiCreateCompany(data);
      }
      setCompanyModalOpen(false);
      await loadCompanies();
      showToast(editingCompany ? "Empresa atualizada" : "Empresa criada");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao salvar empresa");
    } finally {
      setSavingCompany(false);
    }
  };

  /** abrir modal para excluir empresa */
  const openConfirmDeleteCompany = (c: Company) => {
    setConfirmCfg({
      title: "Excluir empresa",
      message: `Tem certeza que deseja excluir "${c.name}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      cancelLabel: "Cancelar",
      tone: "danger",
      action: async () => {
        await apiDeleteCompany(c.id);
        await loadCompanies();
        showToast("Empresa excluída");
      },
    });
    setConfirmOpen(true);
  };

  const openDetails = async (c: Company) => {
    setSelectedCompany(c);
    setDetailsOpen(true);
    setUsersLoading(true);
    try {
      const data = await getCompanyUsers(c.id);
      setCompanyUsers(data);
    } finally {
      setUsersLoading(false);
    }
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setUserModalOpen(true);
  };
  const openEditUser = (u: CompanyUser) => {
    setEditingUser(u);
    setUserModalOpen(true);
  };

  const saveUser = async (data: Partial<CompanyUser>) => {
    if (!selectedCompany) return;
    setSavingUser(true);
    try {
      if (editingUser) {
        await apiUpdateCompanyUser(selectedCompany.id, editingUser.id, data);
      } else {
        await apiCreateCompanyUser(selectedCompany.id, data);
      }
      setUserModalOpen(false);
      const dataUsers = await getCompanyUsers(selectedCompany.id);
      setCompanyUsers(dataUsers);
      await loadCompanies();
      showToast(editingUser ? "Usuário atualizado" : "Usuário criado");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao salvar usuário");
    } finally {
      setSavingUser(false);
    }
  };

  /** abrir modal para excluir usuário */
  const openConfirmDeleteUser = (u: CompanyUser) => {
    if (!selectedCompany) return;
    setConfirmCfg({
      title: "Excluir usuário",
      message: `Tem certeza que deseja excluir o usuário "${u.name}"?`,
      confirmLabel: "Excluir",
      cancelLabel: "Cancelar",
      tone: "danger",
      action: async () => {
        await apiDeleteCompanyUser(selectedCompany.id, u.id);
        const dataUsers = await getCompanyUsers(selectedCompany.id);
        setCompanyUsers(dataUsers);
        await loadCompanies();
        showToast("Usuário excluído");
      },
    });
    setConfirmOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8 dark:bg-[#0B0B0C]">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} summary={summary} />
      <div className={cx("md:pl-[260px]", collapsed && "md:pl-[84px]")}>
        <AdminHeader setCollapsed={setCollapsed} title="Empresas" />

        <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard title="Total de empresas" value={`${kpis.total}`} />
            <StatCard title="Novas no mês" value={`${kpis.newThisMonth}`} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="flex h-11 flex-1 items-center rounded-xl border-2 border-transparent bg-gray-100 px-3 dark:bg-white/5">
                <Search className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nome da empresa"
                  className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
                />
              </div>

              <div className="hidden h-11 items-center rounded-xl bg-gray-100 px-3 dark:bg-white/5 sm:flex">
                <Filter className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="h-full border-0 bg-transparent pr-6 text-sm outline-none dark:text-gray-100"
                >
                  <option value="all" className="dark:bg-[#0F0F11]">
                    Todos os planos
                  </option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.name} className="dark:bg-[#0F0F11]">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={openCreateCompany}
              className="inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[var(--primary-dark)]"
            >
              <Plus className="mr-2 h-5 w-5" /> Nova empresa
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-600 dark:text-gray-300">
                  <tr className="border-b border-gray-200/70 dark:border-white/10">
                    <th className="p-2">Empresa</th>
                    <th className="p-2">Plano</th>
                    <th className="p-2">Vencimento</th>
                    <th className="p-2">MRR</th>
                    <th className="p-2">Usuários</th>
                    <th className="p-2">Criada em</th>
                    <th className="p-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500 dark:text-gray-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500 dark:text-gray-400">
                        Nenhuma empresa encontrada.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="border-b border-gray-200/70 last:border-0 dark:border-white/10">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/15">
                              <Building2 className="h-4 w-4 text-[var(--primary)]" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{c.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{c.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-gray-700 dark:text-gray-300">{c.plan}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300">{formatDateBR(c.planExpiresAt)}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300">{BRL(c.mrr)}</td>
                        <td className="p-2">
                          <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                            <UsersIcon className="mr-1 h-3.5 w-3.5" /> {toNumber(c.usersCount)}
                          </span>
                        </td>
                        <td className="p-2 text-gray-700 dark:text-gray-300">{formatDateBR(c.createdAt)}</td>
                        <td className="p-2">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openDetails(c)}
                              className="rounded-lg px-2 py-1 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => openEditCompany(c)}
                              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openConfirmDeleteCompany(c)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-500/10"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Empresa (criar/editar) */}
      <Modal
        open={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        title={editingCompany ? "Editar empresa" : "Nova empresa"}
      >
        <CompanyForm
          initial={editingCompany ?? undefined}
          onSubmit={saveCompany}
          submitting={savingCompany}
          plans={plans}
        />
      </Modal>

      {/* Modal Detalhes + usuários */}
      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={selectedCompany ? `Empresa: ${selectedCompany.name}` : "Empresa"}
      >
        {selectedCompany && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Plano:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-white">{selectedCompany.plan}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Vencimento:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                  {formatDateBR(selectedCompany.planExpiresAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">MRR:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-white">{BRL(selectedCompany.mrr)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Criada:</span>
                <span className="ml-1 text-gray-900 dark:text-white">{formatDateBR(selectedCompany.createdAt)}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                Usuários ({companyUsers.length})
              </h4>
              <button
                onClick={openCreateUser}
                className="inline-flex items-center rounded-xl bg-[var(--primary)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Novo usuário
              </button>
            </div>

            <div className="rounded-xl border border-gray-200/70 dark:border-white/10">
              {usersLoading ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </div>
              ) : companyUsers.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">Nenhum usuário.</div>
              ) : (
                <div className="divide-y divide-gray-200/70 dark:divide-white/10">
                  {companyUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{u.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 capitalize text-gray-600 dark:text-gray-300">
                          <Shield className="mr-1 h-3.5 w-3.5" /> {u.role}
                        </span>
                        <button
                          onClick={() => openEditUser(u)}
                          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openConfirmDeleteUser(u)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-500/10"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Usuário (criar/editar) */}
      <Modal open={userModalOpen} onClose={() => setUserModalOpen(false)} title={editingUser ? "Editar usuário" : "Novo usuário"}>
        <UserForm initial={editingUser ?? undefined} onSubmit={saveUser} submitting={savingUser} />
      </Modal>

      {/* Modal de confirmação centralizado */}
      <ConfirmModal
        open={confirmOpen}
        title={confirmCfg?.title ?? ""}
        message={confirmCfg?.message ?? ""}
        confirmLabel={confirmCfg?.confirmLabel}
        cancelLabel={confirmCfg?.cancelLabel}
        tone={confirmCfg?.tone}
        loading={confirmLoading}
        onConfirm={runConfirm}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setConfirmCfg(null);
        }}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-white px-4 py-2 text-sm text-gray-800 shadow-lg dark:bg-[#0F0F11] dark:text-gray-100"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
