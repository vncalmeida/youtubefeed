import React, { createContext, useContext, useMemo, useState } from "react";

type AuthContextValue = {
  token: string | null;
  companyId: string | null;
  planExpiresAt: string | null;
  login: (token: string, companyId: string, planExpiresAt?: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("token");
  });
  const [companyId, setCompanyId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem("companyId");
    if (stored) return stored;
    const token = window.localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.companyId ? String(payload.companyId) : null;
    } catch {
      return null;
    }
  });
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("planExpiresAt");
  });

  const login = (t: string, c: string, expires?: string | null) => {
    setToken(t);
    setCompanyId(c);
    setPlanExpiresAt(expires ?? null);
    window.localStorage.setItem("token", t);
    window.localStorage.setItem("companyId", c);
    if (expires) {
      window.localStorage.setItem("planExpiresAt", expires);
    } else {
      window.localStorage.removeItem("planExpiresAt");
    }
  };

  const logout = () => {
    setToken(null);
    setCompanyId(null);
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("companyId");
    window.localStorage.removeItem("planExpiresAt");
  };

  const value = useMemo(() => ({ token, companyId, planExpiresAt, login, logout }), [token, companyId, planExpiresAt]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

