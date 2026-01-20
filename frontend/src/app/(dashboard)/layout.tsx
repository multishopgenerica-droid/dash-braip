"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, SidebarProvider, useSidebar } from "@/components/layout/modern-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuthStore } from "@/stores/auth.store";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      <Sidebar />
      <motion.div
        className="flex-1 flex flex-col min-w-0"
        initial={false}
        animate={{ marginLeft: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Topbar />
        <main className={cn(
          "flex-1 overflow-auto",
          "p-4 lg:p-6",
          "bg-neutral-50 dark:bg-neutral-950"
        )}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-neutral-200 dark:border-neutral-800"></div>
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        closeButton
      />
    </SidebarProvider>
  );
}
