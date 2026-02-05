import React, { createContext, useContext, useMemo, useState } from 'react';

type AdminAuthContextValue = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export const AdminAuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('adminToken');
  });

  const login = (t: string) => {
    setToken(t);
    window.localStorage.setItem('adminToken', t);
  };

  const logout = () => {
    setToken(null);
    window.localStorage.removeItem('adminToken');
  };

  const value = useMemo(() => ({ token, login, logout }), [token]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return ctx;
}
