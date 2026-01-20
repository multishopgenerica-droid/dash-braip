"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Moon,
  Sun,
  RefreshCw,
  ChevronDown,
  Check,
  Wifi,
  WifiOff,
  HelpCircle,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenuButton, useSidebar } from "./modern-sidebar";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastSync?: Date;
}

export function Topbar({
  title,
  subtitle,
  onRefresh,
  isRefreshing = false,
  lastSync,
}: TopbarProps) {
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { collapsed } = useSidebar();

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    let shouldBeDark = false;

    if (savedTheme === "dark") {
      shouldBeDark = true;
    } else if (savedTheme === "light") {
      shouldBeDark = false;
    } else {
      // System preference
      shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    setIsDark(shouldBeDark);

    // Apply theme class to document
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const notifications = [
    { id: 1, title: "Nova venda aprovada", time: "2 min atrás", read: false },
    { id: 2, title: "Sincronização concluída", time: "15 min atrás", read: true },
    { id: 3, title: "Novo afiliado cadastrado", time: "1h atrás", read: true },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <MobileMenuButton />

          {title && (
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-neutral-500">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar vendas, produtos, clientes..."
              className={cn(
                "w-full h-10 pl-10 pr-4 rounded-xl",
                "bg-neutral-100 dark:bg-neutral-900",
                "border border-transparent focus:border-primary",
                "text-sm text-neutral-900 dark:text-white placeholder-neutral-400",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                "transition-all duration-200"
              )}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Sync Status */}
          {lastSync && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <Wifi className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                Sync: {lastSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <motion.button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={cn(
                "p-2.5 rounded-xl text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200",
                "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                "transition-colors disabled:opacity-50"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              >
                <RefreshCw className="h-5 w-5" />
              </motion.div>
            </motion.button>
          )}

          {/* Dark Mode Toggle */}
          <motion.button
            onClick={toggleDarkMode}
            className={cn(
              "p-2.5 rounded-xl text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800",
              "transition-colors"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <Sun className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                >
                  <Moon className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "p-2.5 rounded-xl text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200",
                "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                "transition-colors relative"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        Notificações
                      </h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          className={cn(
                            "p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0",
                            "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer",
                            !notification.read && "bg-primary/5"
                          )}
                          whileHover={{ x: 2 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-1.5",
                              notification.read ? "bg-neutral-300" : "bg-primary"
                            )} />
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
                      <button className="w-full text-center text-sm text-primary font-medium hover:underline">
                        Ver todas
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Help */}
          <motion.button
            className={cn(
              "p-2.5 rounded-xl text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800",
              "transition-colors hidden lg:flex"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <HelpCircle className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
