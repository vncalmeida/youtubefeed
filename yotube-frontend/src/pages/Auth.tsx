import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Building2, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { post } from "../service/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function useCountdown(seconds: number, run: boolean) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (!run) return;
    setRemaining(seconds);
    const id = setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [seconds, run]);
  return remaining;
}

type Mode = "login" | "register" | "forgot" | "verify" | "reset";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{msg}</div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-gray-300">{children}</label>;
}

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode; rightIcon?: React.ReactNode }
) {
  const { leftIcon, rightIcon, className = "", ...rest } = props;
  return (
    <div
      className={
        "group relative flex items-center rounded-xl border-2 border-transparent bg-white/5 px-3 py-2 transition-all focus-within:border-[var(--primary)] focus-within:bg-white/10 shadow-none " +
        className
      }
    >
      {leftIcon && <div className="mr-2 text-gray-400">{leftIcon}</div>}
      <input
        {...rest}
        className="peer w-full bg-transparent text-gray-100 outline-none placeholder:text-gray-400"
      />
      {rightIcon && <div className="ml-2 text-gray-400">{rightIcon}</div>}
    </div>
  );
}

function PasswordInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    leftIcon?: React.ReactNode;
  }
) {
  const { leftIcon, className = "", ...rest } = props;
  const [show, setShow] = useState(false);
  return (
    <div
      className={
        "group relative flex items-center rounded-xl border-2 border-transparent bg-white/5 px-3 py-2 transition-all focus-within:border-[var(--primary)] focus-within:bg-white/10 shadow-none " +
        className
      }
    >
      {leftIcon && <div className="mr-2 text-gray-400">{leftIcon}</div>}
      <input
        {...rest}
        type={show ? "text" : "password"}
        className="peer w-full bg-transparent text-gray-100 outline-none placeholder:text-gray-400"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="ml-2 rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10"
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

// 6-digit OTP input with paste, arrows and backspace behaviors
function OTPInput({ length = 6, value, onChange, disabled }: { length?: number; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const values = useMemo(() => value.padEnd(length, " ").slice(0, length).split("").map((c) => (/[0-9]/.test(c) ? c : "")), [value, length]);

  const setChar = (i: number, ch: string) => {
    const chars = [...values];
    chars[i] = ch;
    const newVal = chars.join("").replace(/\s/g, "");
    onChange(newVal);
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setChar(i, "");
      return;
    }
    const [first, ...rest] = raw.split("");
    setChar(i, first);
    if (i < length - 1) inputs.current[i + 1]?.focus();
    if (rest.length) {
      for (let k = 0; k < rest.length && i + 1 + k < length; k++) {
        setChar(i + 1 + k, rest[k]!);
      }
      const lastIndex = Math.min(i + raw.length, length - 1);
      inputs.current[lastIndex]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (values[i]) {
        setChar(i, "");
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
        setChar(i - 1, "");
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const data = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!data) return;
    e.preventDefault();
    for (let k = 0; k < data.length && i + k < length; k++) setChar(i + k, data[k]!);
    const lastIndex = Math.min(i + data.length - 1, length - 1);
    inputs.current[lastIndex]?.focus();
  };

  return (
    <div className="grid grid-cols-6 gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={values[i] ?? ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          disabled={disabled}
          className="h-12 w-full rounded-xl border-2 border-transparent bg-white/5 text-center text-xl tracking-widest outline-none transition-all focus:border-[var(--primary)] focus:bg-white/10 text-gray-100"
        />
      ))}
    </div>
  );
}

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [successMsg, setSuccessMsg] = useState<string | undefined>(undefined);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // register
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  // reset
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPassConfirm, setNewPassConfirm] = useState("");
  const [canResend, setCanResend] = useState(false);
  const remaining = useCountdown(60, mode === "verify" && !canResend);
  useEffect(() => {
    if (remaining === 0) setCanResend(true);
  }, [remaining]);

  const resetAll = () => {
    setError(undefined);
    setSuccessMsg(undefined);
    setOtp("");
    setNewPass("");
    setNewPassConfirm("");
  };

  const switchMode = (m: Mode) => {
    resetAll();
    setMode(m);
  };

  const navigate = useNavigate();
  const { login } = useAuth();
  const [expiryInfo, setExpiryInfo] = useState<{ token: string; companyId: string; planExpiresAt: string } | null>(null);

  // submit handlers (wire endpoints as needed)
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    const out = await post<{ token: string; companyId: string | number; expiringSoon?: boolean; planExpiresAt?: string }>("/auth/login", { email, password });
    setLoading(false);
    if (!out.ok) return setError(out.message || "Falha no login");
    if (out.data!.expiringSoon && out.data!.planExpiresAt) {
      setExpiryInfo({ token: out.data!.token, companyId: String(out.data!.companyId), planExpiresAt: out.data!.planExpiresAt });
    } else {
      login(out.data!.token, String(out.data!.companyId), out.data!.planExpiresAt);
      navigate("/");
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (regPass !== regConfirm) return setError("As senhas não coincidem");
    setLoading(true);
    const out = await post("/auth/register", { name, email: regEmail, company, password: regPass });
    setLoading(false);
    if (!out.ok) return setError(out.message || "Falha no cadastro");
    switchMode("login");
    setSuccessMsg("Cadastro concluído. Você já pode fazer login.");
  };

  const confirmExpiry = () => {
    if (expiryInfo) {
      login(expiryInfo.token, expiryInfo.companyId, expiryInfo.planExpiresAt);
      setExpiryInfo(null);
      navigate("/");
    }
  };

  const daysLeft = expiryInfo
    ? Math.ceil((new Date(expiryInfo.planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const onRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!resetEmail) return setError("Informe o e-mail");
    setLoading(true);
    const out = await post("/auth/password/reset/request", { email: resetEmail });
    setLoading(false);
    if (!out.ok) return setError(out.message || "Erro ao enviar código");
    setCanResend(false);
    switchMode("verify");
  };

  const onVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (otp.length !== 6) return setError("Digite o código de 6 dígitos");
    setLoading(true);
    const out = await post("/auth/password/reset/verify", { email: resetEmail, code: otp });
    setLoading(false);
    if (!out.ok) return setError(out.message || "Código inválido ou expirado");
    switchMode("reset");
  };

  const onConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!newPass || newPass !== newPassConfirm) return setError("As senhas devem coincidir");
    setLoading(true);
    const out = await post("/auth/password/reset/confirm", { email: resetEmail, code: otp, password: newPass });
    setLoading(false);
    if (!out.ok) return setError(out.message || "Não foi possível redefinir a senha");
    switchMode("login");
    setSuccessMsg("Senha redefinida! Você já pode entrar.");
  };

  const resend = async () => {
    if (!canResend) return;
    setError(undefined);
    setCanResend(false);
    const out = await post("/auth/password/reset/request", { email: resetEmail });
    if (!out.ok) setError(out.message || "Erro ao reenviar");
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center px-4">
      <main className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl border border-white/10 bg-[#0F0F11] p-6 shadow-xl sm:p-8"
          >
            {/* Tabs or back */}
            {mode === "login" || mode === "register" ? (
              <div className="mb-6 grid w-full grid-cols-2 rounded-full bg-white/10 p-1">
                <button
                  onClick={() => switchMode("login")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    mode === "login" ? "bg-[#151518] text-white shadow" : "text-gray-300"
                  }`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => switchMode("register")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    mode === "register" ? "bg-[#151518] text-white shadow" : "text-gray-300"
                  }`}
                >
                  Cadastrar
                </button>
              </div>
            ) : (
              <button
                onClick={() => switchMode("login")}
                className="mb-6 inline-flex items-center text-sm text-gray-300 transition-colors hover:text-[var(--primary)]"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao login
              </button>
            )}

            {/* Forms */}
            {mode === "login" && (
              <form onSubmit={onLogin} className="space-y-4">
                <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
                <div>
                  <Label>E-mail</Label>
                  <TextInput
                    leftIcon={<Mail className="h-5 w-5" />}
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label>Senha</Label>
                  <PasswordInput
                    leftIcon={<Lock className="h-5 w-5" />}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <FieldError msg={error} />
                {successMsg && (
                  <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{successMsg}</div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[var(--primary-dark)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.99] ${
                    loading ? "opacity-70" : ""
                  }`}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
                </button>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-300">Esqueceu a senha?</span>
                  <button type="button" className="text-[var(--primary)]" onClick={() => switchMode("forgot")}>
                    Recuperar acesso
                  </button>
                </div>
              </form>
            )}

            {mode === "register" && (
              <form onSubmit={onRegister} className="space-y-4">
                <h1 className="text-2xl font-bold text-white">Criar conta</h1>
                <div>
                  <Label>Nome</Label>
                  <TextInput
                    leftIcon={<User className="h-5 w-5" />}
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <TextInput
                    leftIcon={<Mail className="h-5 w-5" />}
                    placeholder="voce@empresa.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    type="email"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label>Nome da empresa</Label>
                  <TextInput
                    leftIcon={<Building2 className="h-5 w-5" />}
                    placeholder="Minha Empresa LTDA"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    autoComplete="organization"
                  />
                </div>
                <div>
                  <Label>Senha</Label>
                  <PasswordInput
                    leftIcon={<Lock className="h-5 w-5" />}
                    placeholder="••••••••"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label>Confirmar senha</Label>
                  <PasswordInput
                    leftIcon={<Lock className="h-5 w-5" />}
                    placeholder="••••••••"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <FieldError msg={error} />
                {successMsg && (
                  <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{successMsg}</div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[var(--primary-dark)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.99] ${
                    loading ? "opacity-70" : ""
                  }`}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar conta"}
                </button>
                <div className="mt-3 text-center text-sm text-gray-300">
                  Já tem conta?{' '}
                  <button type="button" className="text-[var(--primary)]" onClick={() => switchMode("login")}>
                    Faça login
                  </button>
                </div>
              </form>
            )}

            {mode === "forgot" && (
              <form onSubmit={onRequestReset} className="space-y-4">
                <h2 className="text-xl font-bold text-white">Recuperar senha</h2>
                <p className="text-sm text-gray-400">Informe seu e-mail para enviarmos um código de verificação de 6 dígitos.</p>
                <div>
                  <Label>E-mail</Label>
                  <TextInput
                    leftIcon={<Mail className="h-5 w-5" />}
                    placeholder="voce@empresa.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    type="email"
                    required
                    autoComplete="email"
                  />
                </div>
                <FieldError msg={error} />
                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[var(--primary-dark)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.99] ${
                    loading ? "opacity-70" : ""
                  }`}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar código"}
                </button>
              </form>
            )}

            {mode === "verify" && (
              <form onSubmit={onVerifyCode} className="space-y-4">
                <h2 className="text-xl font-bold text-white">Verifique seu e-mail</h2>
                <p className="text-sm text-gray-400">
                  Enviamos um código de 6 dígitos para <span className="font-medium text-white/90">{resetEmail}</span>. Digite-o abaixo para continuar.
                </p>
                <OTPInput value={otp} onChange={setOtp} />
                <FieldError msg={error} />
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className={`mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[var(--primary-dark)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.99] ${
                    loading ? "opacity-70" : ""
                  }`}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar código"}
                </button>
                <div className="mt-2 text-center text-sm text-gray-300">
                  {canResend ? (
                    <button type="button" className="text-[var(--primary)]" onClick={resend}>
                      Reenviar código
                    </button>
                  ) : (
                    <>Reenviar em {remaining}s</>
                  )}
                </div>
              </form>
            )}

            {mode === "reset" && (
              <form onSubmit={onConfirmReset} className="space-y-4">
                <h2 className="text-xl font-bold text-white">Definir nova senha</h2>
                <div>
                  <Label>Nova senha</Label>
                  <PasswordInput
                    leftIcon={<Lock className="h-5 w-5" />}
                    placeholder="••••••••"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label>Confirmar nova senha</Label>
                  <PasswordInput
                    leftIcon={<Lock className="h-5 w-5" />}
                    placeholder="••••••••"
                    value={newPassConfirm}
                    onChange={(e) => setNewPassConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <FieldError msg={error} />
                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[var(--primary-dark)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.99] ${
                    loading ? "opacity-70" : ""
                  }`}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar nova senha"}
                </button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {expiryInfo && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" />
            <motion.div
              role="dialog" aria-modal
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-1/2 mx-auto w-11/12 max-w-md -translate-y-1/2 rounded-2xl bg-white p-6 text-gray-900 shadow-xl"
            >
              <h3 className="mb-2 text-lg font-semibold">Plano expirando</h3>
              <p className="mb-4 text-sm">
                Seu plano expira em {daysLeft} {daysLeft === 1 ? "dia" : "dias"} ({new Date(expiryInfo.planExpiresAt).toLocaleDateString()}).
              </p>
              <div className="flex justify-end">
                <button
                  onClick={confirmExpiry}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white hover:bg-[var(--primary-dark)]"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
