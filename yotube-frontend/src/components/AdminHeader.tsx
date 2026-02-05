import React from "react";
import { Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface AdminHeaderProps {
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
}

export default function AdminHeader({ setCollapsed, title }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-[#0B0B0C]/70">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              onClick={() => setCollapsed((v) => !v)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
