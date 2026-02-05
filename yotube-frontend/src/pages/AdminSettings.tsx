// src/pages/AdminSettings.tsx
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Plus, Pencil, Trash2, X, Loader2,
  Mail, Lock, Shield, Building2, Coins, Hash, Send, CheckCircle2, AlertTriangle, Key
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import type { Summary, PlanConfig, SmtpConfig, MpConfig } from "../types";
import { getSettings, savePlans, saveSmtp, saveMp, testSmtp as testSmtpApi } from "../service/settings";
import { get } from "../service/api";

// ===== Utils =====
const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ===== Demo/Fallback =====
const demoPlans: PlanConfig[] = [
  { id: "starter", name: "Starter",   price: 29.9,  channels: 2,  active: true },
  { id: "pro",     name: "Pro",       price: 89.9,  channels: 8,  active: true, popular: true },
  { id: "business",name: "Business",  price: 249.0, channels: 20, active: true },
  { id: "ent",     name: "Enterprise",price: 0,     channels: 999,active: true },
];
const demoSmtp: SmtpConfig = {
  host: "smtp.seudominio.com",
  port: 587,
  secure: true,
  user: "no-reply@seudominio.com",
  pass: "",
  fromName: "Seu Produto",
  fromEmail: "no-reply@seudominio.com",
  replyTo: "suporte@seudominio.com",
};
const demoSummary: Summary = {
  totalRevenue: 0,
  mrr: 0,
  arr: 0,
  avgTicket: 0,
  activeSubs: 0,
  churnRate: 0,
  topPlans: [],
};

// ===== Componentes base =====
function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode; rightIcon?: React.ReactNode }
) {
  const { leftIcon, rightIcon, className = "", ...rest } = props;
  return (
    <div className={cx(
      "group relative flex h-11 items-center rounded-xl border-2 border-transparent bg-gray-100 px-3 transition-all",
      "focus-within:border-[var(--primary)] focus-within:bg-white dark:bg-white/5 dark:focus-within:bg-white/10",
      className
    )}>
      {leftIcon && <div className="mr-2 text-gray-500 dark:text-gray-400">{leftIcon}</div>}
      <input {...rest} className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100" />
      {rightIcon && <div className="ml-2 text-gray-500 dark:text-gray-400">{rightIcon}</div>}
    </div>
  );
}
function NumberInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode; suffix?: string }
) {
  const { leftIcon, suffix, className = "", ...rest } = props;
  return (
    <div className={cx(
      "group relative flex h-11 items-center rounded-xl border-2 border-transparent bg-gray-100 px-3 transition-all",
      "focus-within:border-[var(--primary)] focus-within:bg-white dark:bg-white/5 dark:focus-within:bg-white/10",
      className
    )}>
      {leftIcon && <div className="mr-2 text-gray-500 dark:text-gray-400">{leftIcon}</div>}
      <input {...rest} inputMode="numeric" className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100" />
      {suffix && <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{suffix}</span>}
    </div>
  );
}
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked ? "bg-[var(--primary)]" : "bg-gray-300 dark:bg-white/10"
      )}
      aria-label={label}
    >
      <span className={cx("inline-block h-5 w-5 transform rounded-full bg-white transition-transform", checked ? "translate-x-5" : "translate-x-1")} />
    </button>
  );
}

function Modal({
  open, onClose, title, children
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            role="dialog" aria-modal
            initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.98 }} transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-10 mx-auto w-full max-w-2xl rounded-2xl border border-gray-200/70 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#0F0F11]"
          >
            <div className="mb-3 flex items-center justify-between border-b border-gray-200/70 pb-2 dark:border-white/10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10">
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

/** Modal de confirmação genérico */
function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading,
  tone = "danger",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: "danger" | "primary";
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
          className={cx("rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-white/5 dark:text-gray-100", loading && "opacity-70")}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cx(
            "inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white",
            tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-[var(--primary)] hover:bg-[var(--primary-dark)]",
            loading && "opacity-70"
          )}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ===== Página =====
export default function AdminSettings() {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);

  // estado principal
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [smtp, setSmtp] = useState<SmtpConfig>(demoSmtp);
  const [mp, setMp] = useState<MpConfig>({ accessToken: "", webhookSecret: "" });

  // modais
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [savingPlans, setSavingPlans] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [savingMp, setSavingMp] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  // confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void> | void)>(null);
  const [confirmText, setConfirmText] = useState<{ title: string; message: string }>({ title: "", message: "" });

  // toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    const saved = localStorage.getItem("adminSidebarCollapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // carregar settings
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getSettings();
        setPlans(data.plans.length ? data.plans : demoPlans);
        setSmtp(data.smtp || demoSmtp);
        setMp(data.mp || { accessToken: "", webhookSecret: "" });
      } catch {
        setPlans(demoPlans);
        setSmtp(demoSmtp);
        setMp({ accessToken: "", webhookSecret: "" });
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await get<Summary>("/api/admin/metrics/summary");
        if (!res.ok || !res.data) throw new Error("fallback");
        setSummary(res.data);
      } catch {
        setSummary(demoSummary);
      }
    })();
  }, []);

  const kpis = useMemo(() => ({
    plans: plans.length,
    active: plans.filter(p => p.active).length,
    averagePrice: plans.length ? plans.reduce((a, b) => a + b.price, 0) / plans.length : 0,
    maxChannels: plans.length ? Math.max(...plans.map(p => p.channels)) : 0,
  }), [plans]);

  // ===== actions Planos =====
  const openCreatePlan = () => { setEditingPlan(null); setPlanModalOpen(true); };
  const openEditPlan = (p: PlanConfig) => { setEditingPlan(p); setPlanModalOpen(true); };

  const askDeletePlan = (p: PlanConfig) => {
    setConfirmText({ title: "Excluir plano", message: `Tem certeza que deseja excluir o plano "${p.name}"?` });
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      setPlans(prev => prev.filter(x => x.id !== p.id));
      setConfirmLoading(false);
      setConfirmOpen(false);
      showToast("Plano excluído");
    });
    setConfirmOpen(true);
  };

  const savePlanLocal = (data: Partial<PlanConfig>) => {
    if (editingPlan) {
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...editingPlan, ...data } as PlanConfig : p));
      showToast("Plano atualizado");
    } else {
      const id = (data.name || "novo").toLowerCase().replace(/\s+/g, "-") + "-" + Math.random().toString(36).slice(2, 6);
      setPlans(prev => [...prev, {
        id,
        name: data.name || "Novo Plano",
        price: typeof data.price === "number" ? data.price : 0,
        channels: typeof data.channels === "number" ? data.channels : 1,
        active: data.active ?? true,
        popular: data.popular ?? false,
      }]);
      showToast("Plano criado");
    }
    setPlanModalOpen(false);
  };

  const persistPlans = async () => {
    setSavingPlans(true);
    try {
      await savePlans(plans);
      showToast("Planos salvos com sucesso");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar planos";
      showToast(msg);
    }
    setSavingPlans(false);
  };

  // ===== actions Mercado Pago =====
  const persistMp = async () => {
    setSavingMp(true);
    try {
      await saveMp(mp);
      showToast("Credenciais Mercado Pago salvas");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar Mercado Pago";
      showToast(msg);
    }
    setSavingMp(false);
  };

  // ===== actions SMTP =====
  const persistSmtp = async () => {
    setSavingSmtp(true);
    try {
      await saveSmtp(smtp);
      showToast("Configurações SMTP salvas");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar SMTP";
      showToast(msg);
    }
    setSavingSmtp(false);
  };

  const testSmtp = async () => {
    if (!testEmail) return showToast("Informe o e-mail para teste");
    setTesting(true);
    try {
      const out = await testSmtpApi(testEmail);
      showToast(out.success ? "Teste enviado!" : out.message || "Falha no teste");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao enviar teste";
      showToast(msg);
    }
    setTesting(false);
  };

  // ===== UI =====
  return (
    <div className="min-h-screen bg-gray-50 pb-8 dark:bg-[#0B0B0C]">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} summary={summary ?? demoSummary} />
      <div className={cx("md:pl-[260px]", collapsed && "md:pl-[84px]")}>
        <AdminHeader setCollapsed={setCollapsed} title="Configurações" />

        <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">
          {/* KPIs rápidos */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
              <div className="text-sm text-gray-500 dark:text-gray-400">Planos (ativos/total)</div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {plans.filter(p => p.active).length}/{plans.length}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
              <div className="text-sm text-gray-500 dark:text-gray-400">Preço médio</div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {BRL(plans.length ? plans.reduce((a, b) => a + b.price, 0) / plans.length : 0)}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
              <div className="text-sm text-gray-500 dark:text-gray-400">Máx. canais por plano</div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {plans.length ? Math.max(...plans.map(p => p.channels)) : 0}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
              <div className="text-sm text-gray-500 dark:text-gray-400">Status SMTP</div>
              <div className="mt-1 flex items-center gap-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {smtp.host ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <AlertTriangle className="h-6 w-6 text-red-500" />}
                {smtp.host ? "Configurado" : "Pendente"}
              </div>
            </div>
          </div>

          {/* Grids */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Planos */}
            <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[var(--primary)]" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Planos e preços</h2>
                </div>
                <button
                  onClick={openCreatePlan}
                  className="inline-flex items-center rounded-xl bg-[var(--primary)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Novo plano
                </button>
              </div>

              <div className="divide-y divide-gray-200/70 dark:divide-white/10">
                {loading ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">Nenhum plano cadastrado.</div>
                ) : (
                  plans.map((p) => (
                    <div key={p.id} className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-12 sm:items-center">
                      <div className="sm:col-span-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{p.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{p.id}</div>
                          </div>
                        </div>
                      </div>
                      <div className="sm:col-span-2 text-gray-700 dark:text-gray-300">{BRL(p.price)}</div>
                      <div className="sm:col-span-2 text-gray-700 dark:text-gray-300">{p.channels} canais</div>
                      <div className="sm:col-span-1">
                        <span className={cx(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          p.active ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                        )}>
                          {p.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <div className="sm:col-span-2 flex justify-end gap-1">
                        <button onClick={() => openEditPlan(p)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => askDeletePlan(p)} className="rounded-lg p-2 text-red-600 hover:bg-red-500/10" title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={persistPlans}
                  disabled={savingPlans}
                  className={cx(
                    "inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[var(--primary-dark)]",
                    savingPlans && "opacity-70"
                  )}
                >
                  {savingPlans ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Salvar planos
                </button>
              </div>
            </section>

            {/* Mercado Pago */}
            <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
              <div className="mb-4 flex items-center gap-2">
                <Key className="h-5 w-5 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mercado Pago</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Access Token</label>
                  <TextInput leftIcon={<Key className="h-5 w-5" />} placeholder="" value={mp.accessToken} onChange={(e) => setMp({ ...mp, accessToken: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Webhook Secret</label>
                  <TextInput leftIcon={<Shield className="h-5 w-5" />} placeholder="" value={mp.webhookSecret} onChange={(e) => setMp({ ...mp, webhookSecret: e.target.value })} />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={persistMp}
                  disabled={savingMp}
                  className={cx("inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white hover:bg-[var(--primary-dark)]", savingMp && "opacity-70")}
                >
                  {savingMp ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Salvar Mercado Pago
                </button>
              </div>
            </section>

            {/* SMTP */}
            <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F0F11]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[var(--primary)]" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Envio de e-mails (SMTP)</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Host</label>
                  <TextInput leftIcon={<Shield className="h-5 w-5" />} placeholder="smtp.seudominio.com"
                    value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Porta</label>
                  <NumberInput leftIcon={<Hash className="h-5 w-5" />} type="number" min={1}
                    value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value || "0", 10) })} />
                </div>
                <div className="flex items-end gap-3">
                  <div className="w-full">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">TLS/SSL</label>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200/70 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0F0F11]">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Ativar</span>
                      <Switch checked={smtp.secure} onChange={(v) => setSmtp({ ...smtp, secure: v })} label="TLS/SSL" />
                    </div>
                  </div>
                </div>
                <div />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
                  <TextInput leftIcon={<Mail className="h-5 w-5" />} placeholder="no-reply@seudominio.com"
                    value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                  <TextInput leftIcon={<Lock className="h-5 w-5" />} type="password" placeholder="••••••••"
                    value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do remetente</label>
                  <TextInput leftIcon={<SettingsIcon className="h-5 w-5" />} placeholder="Seu Produto"
                    value={smtp.fromName} onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail do remetente</label>
                  <TextInput leftIcon={<Mail className="h-5 w-5" />} placeholder="no-reply@seudominio.com"
                    value={smtp.fromEmail} onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reply-to (opcional)</label>
                  <TextInput leftIcon={<Mail className="h-5 w-5" />} placeholder="suporte@seudominio.com"
                    value={smtp.replyTo ?? ""} onChange={(e) => setSmtp({ ...smtp, replyTo: e.target.value })} />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <TextInput
                    leftIcon={<Mail className="h-5 w-5" />}
                    placeholder="Seu e-mail para teste"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="sm:w-80"
                  />
                  <button
                    onClick={testSmtp}
                    disabled={testing}
                    className={cx("inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold text-white",
                      testing ? "bg-[var(--primary)]/80" : "bg-[var(--primary)] hover:bg-[var(--primary-dark)]")}
                  >
                    {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Enviar teste
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={persistSmtp}
                    disabled={savingSmtp}
                    className={cx("inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white hover:bg-[var(--primary-dark)]",
                      savingSmtp && "opacity-70")}
                  >
                    {savingSmtp ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Salvar SMTP
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Modal Plano */}
      <Modal open={planModalOpen} onClose={() => setPlanModalOpen(false)} title={editingPlan ? "Editar plano" : "Novo plano"}>
        <PlanForm initial={editingPlan ?? undefined} onSubmit={savePlanLocal} />
      </Modal>

      {/* Confirm */}
      <ConfirmModal
        open={confirmOpen}
        title={confirmText.title}
        message={confirmText.message}
        loading={confirmLoading}
        onConfirm={() => { if (confirmAction) confirmAction(); }}
        onClose={() => { if (!confirmLoading) setConfirmOpen(false); }}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-white px-4 py-2 text-sm text-gray-800 shadow-lg dark:bg-[#0F0F11] dark:text-gray-100">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== Form de Plano (interno) =====
function PlanForm({ initial, onSubmit }:{
  initial?: Partial<PlanConfig>;
  onSubmit: (data: Partial<PlanConfig>) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState<number>(typeof initial?.price === "number" ? initial!.price! : 0);
  const [channels, setChannels] = useState<number>(typeof initial?.channels === "number" ? initial!.channels! : 1);
  const [active, setActive] = useState<boolean>(initial?.active ?? true);
  const [popular, setPopular] = useState<boolean>(initial?.popular ?? false);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, price, channels, active, popular }); }} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do plano</label>
        <TextInput leftIcon={<Building2 className="h-5 w-5" />} placeholder="Ex.: Pro"
          value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Preço</label>
          <NumberInput leftIcon={<Coins className="h-5 w-5" />} type="number" min={0} step="0.01"
            value={price} onChange={(e) => setPrice(parseFloat(e.target.value || "0"))} />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{BRL(price || 0)}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Canais permitidos</label>
          <NumberInput leftIcon={<Hash className="h-5 w-5" />} type="number" min={1} step="1"
            value={channels} onChange={(e) => setChannels(parseInt(e.target.value || "1", 10))} />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200/70 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0F0F11]">
            <span className="text-sm text-gray-600 dark:text-gray-300">Ativo</span>
            <Switch checked={active} onChange={setActive} label="Ativo" />
          </div>
          <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200/70 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0F0F11]">
            <span className="text-sm text-gray-600 dark:text-gray-300">Popular</span>
            <Switch checked={popular} onChange={setPopular} label="Popular" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white hover:bg-[var(--primary-dark)]">
          Salvar
        </button>
      </div>
    </form>
  );
}
