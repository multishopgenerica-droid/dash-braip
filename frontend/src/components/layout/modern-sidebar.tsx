"use client";

import { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Zap,
  Menu,
  DollarSign,
  Receipt,
  Wrench,
  Target,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

// Context for sidebar state
const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}>({
  collapsed: false,
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Vendas", href: "/vendas", icon: ShoppingCart },
  { label: "Abandonos", href: "/abandonos", icon: AlertCircle },
  { label: "Produtos", href: "/produtos", icon: Package },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "IA Analysis", href: "/ia-analysis", icon: Sparkles },
];

const financialNavigation: NavItem[] = [
  { label: "Visão Geral", href: "/financeiro", icon: DollarSign },
  { label: "Gastos", href: "/financeiro/gastos", icon: Receipt },
  { label: "Funcionários", href: "/financeiro/funcionarios", icon: Users },
  { label: "Ferramentas", href: "/financeiro/ferramentas", icon: Wrench },
  { label: "Tráfego", href: "/financeiro/trafego", icon: Target },
];

const secondaryNavigation: NavItem[] = [
  { label: "Gateways", href: "/gateways", icon: Zap },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

interface SidebarProviderProps {
  children: React.ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

  return (
    <Link href={item.href}>
      <motion.div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          "group relative overflow-hidden",
          isActive
            ? "bg-primary text-white shadow-lg shadow-primary/25"
            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
        )}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-white")} />

        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {item.badge && !collapsed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "ml-auto px-2 py-0.5 text-xs font-semibold rounded-full",
              item.badgeColor || "bg-primary/10 text-primary"
            )}
          >
            {item.badge}
          </motion.span>
        )}

        {/* Tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            {item.label}
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800",
          "flex flex-col transition-all duration-300 ease-out",
          "lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Logo Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-neutral-200 dark:border-neutral-800",
          collapsed ? "justify-center px-3" : "px-5"
        )}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-bold text-lg text-neutral-900 dark:text-white"
                >
                  Dashboard
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
            {!collapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Financeiro
              </p>
            )}
            {financialNavigation.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
            {!collapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Sistema
              </p>
            )}
            {secondaryNavigation.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-xl",
            !collapsed && "bg-neutral-50 dark:bg-neutral-900"
          )}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {user?.name || "Usuário"}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {user?.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!collapsed && (
              <motion.button
                onClick={handleLogout}
                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Collapse Toggle (Desktop Only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </motion.aside>
    </>
  );
}

// Mobile Menu Button
export function MobileMenuButton() {
  const { setMobileOpen } = useSidebar();

  return (
    <button
      onClick={() => setMobileOpen(true)}
      className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
