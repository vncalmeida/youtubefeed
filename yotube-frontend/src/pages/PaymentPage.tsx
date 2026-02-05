import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getPlans } from "../service/plans";
import { createPixPayment, getPixPaymentStatus } from "../service/payments";
import type { PlanConfig } from "../types";
import { RegisterAfterPaymentModal } from "../components/RegisterAfterPaymentModal";

type FormState = {
  name: string;
  email: string;
  cpf: string;
};

type Step = "form" | "qr" | "status";
type FinalStatus = "approved" | "error" | "expired";

const demoPlans: PlanConfig[] = [
  { id: "starter", name: "Starter", price: 0, channels: 1, active: true },
  { id: "pro", name: "Pro", price: 59, channels: 5, active: true, popular: true },
  { id: "business", name: "Business", price: 179, channels: 20, active: true },
];

export default function PaymentPage() {
  const [plans, setPlans] = useState<PlanConfig[]>(demoPlans);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingPlans(true);
      try {
        const data = await getPlans();
        setPlans(data.filter(p => p.active));
      } catch {
        setPlans(demoPlans);
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, []);

  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initialPlanId = urlParams.get("plano") || "pro";
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);

  useEffect(() => {
    if (!plans.find(p => p.id === selectedPlanId)) {
      const fallback = plans.find(p => p.id !== "starter")?.id || "pro";
      setSelectedPlanId(fallback);
    }
  }, [plans, selectedPlanId]);

  const selectedPlan = useMemo(
    () => plans.find(p => p.id === selectedPlanId) || plans.find(p => p.id === "pro")!,
    [plans, selectedPlanId]
  );

  const [form, setForm] = useState<FormState>({ name: "", email: "", cpf: "" });
  const [submitting, setSubmitting] = useState(false);
  const [pixPayload, setPixPayload] = useState<string>("");
  const [qrCodeBase64, setQrCodeBase64] = useState<string>("");
  const [txid, setTxid] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [step, setStep] = useState<Step>("form");
  const [finalStatus, setFinalStatus] = useState<FinalStatus | null>(null);
  const [statusReason, setStatusReason] = useState<string>("");
  const [showRegister, setShowRegister] = useState(false);

  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(0);

  const amountBRL = useMemo(() => Math.max(0, selectedPlan?.price || 0), [selectedPlan]);
  const amountFormatted = useMemo(() => formatBRL(amountBRL), [amountBRL]);
  const cpfMasked = useMemo(() => maskCPF(form.cpf), [form.cpf]);

  const isValid = useMemo(() => {
    if (!form.name || form.name.trim().length < 3) return false;
    if (!isValidEmail(form.email)) return false;
    if (!isValidCPF(form.cpf)) return false;
    if (!selectedPlan || amountBRL <= 0) return false;
    return true;
  }, [form, selectedPlan, amountBRL]);

  const qrUrl = useMemo(() => (qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : ""), [qrCodeBase64]);

  function onChange<K extends keyof FormState>(key: K, value: string) {
    setForm(s => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const payment = await createPixPayment(amountBRL, `Assinatura ${selectedPlan.name}`, form.email, { name: form.name, cpf: form.cpf, planId: selectedPlan.id });
      setTxid(payment.id);
      setPixPayload(payment.qrCode);
      setQrCodeBase64(payment.qrCodeBase64);
      let expMs = payment.expiresAt ? new Date(payment.expiresAt).getTime() : NaN;
      if (!isFinite(expMs) || expMs <= Date.now()) {
        expMs = Date.now() + 15 * 60 * 1000;
      }
      setExpiresAtMs(expMs);
      setRemainingMs(Math.max(0, expMs - Date.now()));
      setFinalStatus(null);
      setStatusReason("");
      setStep("qr");
    } catch (err: any) {
      setError(err?.message || "Falha ao gerar QR Code PIX.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (step !== "qr" || !expiresAtMs) return;
    setRemainingMs(Math.max(0, expiresAtMs - Date.now()));
    const id = setInterval(() => {
      setRemainingMs(Math.max(0, (expiresAtMs || 0) - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [step, expiresAtMs]);

  useEffect(() => {
    if (step !== "qr" || !expiresAtMs) return;
    if (remainingMs <= 0 && Date.now() >= expiresAtMs) {
      setFinalStatus("expired");
      setStep("status");
    }
  }, [step, expiresAtMs, remainingMs]);

  useEffect(() => {
    if (step !== "qr" || !txid) return;
    const es = new EventSource(`/api/payments/${txid}/stream`);
    es.onmessage = ev => {
      try {
        const data = JSON.parse(ev.data);
        const norm = normalizeStatus(data.status);
        if (norm === "approved") {
          setFinalStatus("approved");
          setStep("status");
          es.close();
        } else if (norm === "error") {
          setStatusReason("O pagamento não pôde ser processado.");
          setFinalStatus("error");
          setStep("status");
          es.close();
        } else if (norm === "expired") {
          setFinalStatus("expired");
          setStep("status");
          es.close();
        }
      } catch {}
    };
    return () => {
      es.close();
    };
  }, [step, txid]);

  useEffect(() => {
    if (step !== "qr" || !txid) return;
    const id = setInterval(async () => {
      try {
        const res = await getPixPaymentStatus(txid);
        const norm = normalizeStatus(res?.status);
        if (norm === "approved") {
          setFinalStatus("approved");
          setStep("status");
        } else if (norm === "error") {
          setStatusReason(res?.errorMessage || "O pagamento não pôde ser processado.");
          setFinalStatus("error");
          setStep("status");
        } else if (norm === "expired") {
          setFinalStatus("expired");
          setStep("status");
        }
      } catch {
      }
    }, 5000);
    return () => clearInterval(id);
  }, [step, txid]);

  useEffect(() => {
    if (finalStatus !== "approved" || !txid) return;
    (async () => {
      try {
        const res = await getPixPaymentStatus(txid);
        if (res.emailExists === false) {
          setShowRegister(true);
        }
      } catch {}
    })();
  }, [finalStatus, txid]);

  function resetPayment() {
    setPixPayload("");
    setQrCodeBase64("");
    setTxid("");
    setError("");
    setFinalStatus(null);
    setStatusReason("");
    setExpiresAtMs(null);
    setRemainingMs(0);
    setStep("form");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0B0B0C] dark:text-gray-100">
      <style>{`:root { --primary:#E53935; --primary-dark:#C62828; }`}</style>

      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-[#0B0B0C]/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">YA</span>
            <span>Youtube Analysis</span>
          </a>
          <a href="#secure" className="text-sm opacity-80 hover:opacity-100">Pagamento 100% seguro</a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <Stepper step={step} />

        <div className="mt-8 grid gap-8 md:grid-cols-5">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="md:col-span-3"
          >
            <h1 className="text-2xl font-bold">
              {step === "form" && "Finalizar assinatura"}
              {step === "qr" && "Pague com PIX"}
              {step === "status" && "Status do pagamento"}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {step === "form" && "Informe seus dados para gerar o QR Code PIX."}
              {step === "qr" && "Escaneie o QR Code ou use Copia e Cola. Aguardando confirmação..."}
              {step === "status" && "Resultado da sua tentativa de pagamento."}
            </p>

            {step === "form" && (
              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm">Plano</label>
                    <select
                      value={selectedPlanId}
                      onChange={e => setSelectedPlanId(e.target.value)}
                      disabled={loadingPlans}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[var(--primary)] dark:border-white/10 dark:bg-[#0F0F11]"
                    >
                      {plans.filter(p => p.id !== "starter").map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {formatBRL(p.price)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm">Nome completo</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => onChange("name", e.target.value)}
                      placeholder="Seu nome"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[var(--primary)] dark:border-white/10 dark:bg-[#0F0F11]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm">E-mail</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => onChange("email", e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[var(--primary)] dark:border-white/10 dark:bg-[#0F0F11]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm">CPF</label>
                    <input
                      inputMode="numeric"
                      value={cpfMasked}
                      onChange={e => onChange("cpf", onlyDigits(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[var(--primary)] dark:border-white/10 dark:bg-[#0F0F11]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-3 font-medium text-white transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Gerando QR Code..." : "Gerar QR Code PIX"}
                </button>

                {error && <p className="text-sm text-rose-500">{error}</p>}
              </form>
            )}

            {step === "status" && (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#0F0F11]">
                <StatusBlock status={finalStatus} reason={statusReason} amount={amountFormatted} />
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  {finalStatus === "approved" ? (
                    <>
                      <a
                        href="/dashboard"
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--primary-dark)]"
                      >
                        Ir para o Dashboard
                      </a>
                      <button
                        onClick={resetPayment}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-white/10"
                      >
                        Nova assinatura
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={resetPayment}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--primary-dark)]"
                      >
                        Tentar novamente
                      </button>
                      <a
                        href="/"
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-white/10"
                      >
                        Voltar à inicial
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="md:col-span-2"
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#0F0F11]">
              <h2 className="text-lg font-semibold">Resumo do pedido</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Plano</span>
                  <span className="font-medium">{selectedPlan?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Valor</span>
                  <span className="font-bold">{amountFormatted}/mês</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Método</span>
                  <span className="font-medium">PIX</span>
                </div>
              </div>

              {step === "qr" ? (
                <div className="mt-6">
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--primary)] p-4">
                    {qrUrl && <img alt="QR Code PIX" src={qrUrl} className="h-auto w-full max-w-xs rounded-xl" />}
                    <div className="w-full">
                      <label className="mb-1 block text-sm">Copia e Cola</label>
                      <textarea
                        readOnly
                        value={pixPayload}
                        className="h-28 w-full resize-none rounded-xl border border-gray-300 bg-white p-3 text-xs outline-none focus:border-[var(--primary)] dark:border-white/10 dark:bg-[#0F0F11]"
                      />
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <button
                          onClick={() => copyToClipboard(pixPayload)}
                          className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] dark:border-white/10"
                        >
                          Copiar
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-all">TXID: {txid}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Aguardando confirmação do pagamento...</span>
                    <span className="rounded-full border px-2 py-0.5 dark:border-white/10">
                      Expira em {formatCountdown(remainingMs)}
                    </span>
                  </div>
                </div>
              ) : step === "status" ? (
                <div className="mt-6 rounded-xl bg-white/50 p-4 text-sm dark:bg-white/5">
                  {finalStatus === "approved" && "Pagamento aprovado. Seu acesso foi liberado."}
                  {finalStatus === "error" && "Ocorreu um erro ao processar seu pagamento."}
                  {finalStatus === "expired" && "QR Code expirado. Gere um novo para pagar."}
                </div>
              ) : (
                <div className="mt-6 rounded-xl bg-white/50 p-4 text-sm dark:bg-white/5">
                  Gere o QR Code após preencher seus dados.
                </div>
              )}
            </div>

            <div
              id="secure"
              className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-600 dark:border-white/10 dark:bg-[#0F0F11] dark:text-gray-300"
            >
              Seus dados são usados apenas para emissão da cobrança PIX.
            </div>
          </motion.aside>
        </div>
      </main>

      <footer className="py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <p className="text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} Youtube Analysis</p>
          <a href="/" className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm text-white hover:bg-[var(--primary-dark)]">Voltar à página inicial</a>
        </div>
      </footer>
      <RegisterAfterPaymentModal
        email={form.email}
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={() => {
          setShowRegister(false);
          window.location.href = '/auth';
        }}
      />
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const idx = step === "form" ? 0 : step === "qr" ? 1 : 2;
  const items = [
    { label: "Dados" },
    { label: "QR Code" },
    { label: "Status" },
  ];
  return (
    <div className="grid grid-cols-3 items-center gap-3">
      {items.map((it, i) => {
        const active = i <= idx;
        return (
          <div key={it.label} className="flex items-center gap-3">
            <div
              className={[
                "grid h-8 w-8 place-items-center rounded-full text-sm font-semibold",
                active ? "bg-[var(--primary)] text-white" : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300",
              ].join(" ")}
            >
              {i + 1}
            </div>
            <div className="text-sm">{it.label}</div>
            {i < items.length - 1 && <div className="mx-2 h-px flex-1 bg-gray-300 dark:bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}

function StatusBlock({ status, reason, amount }: { status: FinalStatus | null; reason: string; amount: string }) {
  if (status === "approved") {
    return (
      <div className="flex items-start gap-3">
        <SuccessIcon />
        <div>
          <h3 className="text-lg font-semibold">Pagamento aprovado</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Recebemos seu pagamento de {amount}. Seu acesso foi liberado automaticamente.
          </p>
        </div>
      </div>
    );
  }
  if (status === "expired") {
    return (
      <div className="flex items-start gap-3">
        <ExpiredIcon />
        <div>
          <h3 className="text-lg font-semibold">QR Code expirado</h3>
        </div>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-start gap-3">
        <ErrorIcon />
        <div>
          <h3 className="text-lg font-semibold">Erro no pagamento</h3>
          {reason && <p className="mt-1 text-sm text-rose-500">{reason}</p>}
        </div>
      </div>
    );
  }
  return null;
}

function SuccessIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" className="opacity-20" />
      <path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" className="opacity-20" />
      <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ExpiredIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" className="opacity-20" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function onlyDigits(v: string) {
  return v.replace(/\D+/g, "");
}

function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  let out = p1;
  if (p2) out += "." + p2;
  if (p3) out += "." + p3;
  if (p4) out += "-" + p4;
  return out;
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidCPF(cpf: string) {
  const s = onlyDigits(cpf);
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false;
  const calc = (base: string, factor: number) => {
    let total = 0;
    for (let i = 0; i < base.length; i++) total += parseInt(base[i], 10) * (factor - i);
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const d1 = calc(s.slice(0, 9), 10);
  const d2 = calc(s.slice(0, 10), 11);
  return d1 === parseInt(s[9], 10) && d2 === parseInt(s[10], 10);
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
  }
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
}

function normalizeStatus(status: string | undefined): FinalStatus | "pending" {
  if (!status) return "pending";
  const s = status.toString().toLowerCase();
  if (["paid", "approved", "confirmed", "completed", "succeeded"].includes(s)) return "approved";
  if (["expired", "timeout"].includes(s)) return "expired";
  if (["error", "failed", "cancelled", "canceled", "refused", "denied"].includes(s)) return "error";
  return "pending";
}
