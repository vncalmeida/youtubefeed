import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { post } from "../service/api";
import { useAdminAuth } from "../context/AdminAuthContext";

/* -------------------- UI helpers (mesmo padrão do Auth.tsx) -------------------- */
function FieldError({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return (
    <div className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
      {msg}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-sm font-medium text-gray-300">
      {children}
    </label>
  );
}

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  }
) {
  const { leftIcon, rightIcon, className = "", ...rest } = props;
  return (
    <div
      className={
        "group relative flex items-center rounded-xl border-2 border-transparent bg-white/5 px-3 py-2 transition-all focus-within:border-[var(--primary)] focus-within:bg-white/10 " +
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
  props: React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode }
) {
  const { leftIcon, className = "", ...rest } = props;
  const [show, setShow] = useState(false);
  return (
    <div
      className={
        "group relative flex items-center rounded-xl border-2 border-transparent bg-white/5 px-3 py-2 transition-all focus-within:border-[var(--primary)] focus-within:bg-white/10 " +
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

/* --------------------------------- Página --------------------------------- */
export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await post<{ token: string }>("/api/admin/auth/login", {
      email,
      password,
    });
    if (res.ok && res.data) {
      login(res.data.token);
      navigate("/admin");
    } else {
      setError(res.message || "Credenciais inválidas");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center px-4">
      <main className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-white/10 bg-[#0F0F11] p-6 shadow-xl sm:p-8"
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Acesso administrativo
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Entre para gerenciar o painel admin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>E-mail</Label>
              <TextInput
                leftIcon={<Mail className="h-5 w-5" />}
                placeholder="admin@empresa.com"
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

            <button
              type="submit"
              disabled={loading}
              className={`mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[var(--primary-dark)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.99] ${
                loading ? "opacity-70" : ""
              }`}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
