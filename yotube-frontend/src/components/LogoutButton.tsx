import React from "react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const LogoutButton: React.FC<{ className?: string }> = ({ className }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleLogout}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow dark:bg-white/5 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/10 ${className || ""}`}
      title="Sair da conta"
    >
      <LogOut className="h-5 w-5" />
      <span className="hidden sm:inline">Sair</span>
    </motion.button>
  );
};

export default LogoutButton;
