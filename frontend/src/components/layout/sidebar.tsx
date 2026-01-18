"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  BarChart3,
  Settings,
  Plug,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Vendas", href: "/vendas", icon: ShoppingCart },
  { name: "Abandonos", href: "/abandonos", icon: ShoppingBag },
  { name: "Produtos", href: "/produtos", icon: Package },
  { name: "Relatorios", href: "/relatorios", icon: BarChart3 },
  { name: "Gateways", href: "/gateways", icon: Plug },
  { name: "Configuracoes", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
      </div>
      <nav className="flex flex-1 flex-col px-4 py-4">
        <ul className="flex flex-1 flex-col gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto border-t border-gray-800 pt-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
