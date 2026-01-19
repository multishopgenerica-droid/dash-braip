"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkeletonKPICard } from "./skeleton";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  variant?: "primary" | "success" | "warning" | "error" | "neutral";
  loading?: boolean;
  className?: string;
}

const variantStyles = {
  primary: {
    bg: "bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700",
    iconBg: "bg-white/20",
    text: "text-white",
    subtext: "text-white/70",
    trend: "text-white/90",
  },
  success: {
    bg: "bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700",
    iconBg: "bg-white/20",
    text: "text-white",
    subtext: "text-white/70",
    trend: "text-white/90",
  },
  warning: {
    bg: "bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700",
    iconBg: "bg-white/20",
    text: "text-white",
    subtext: "text-white/70",
    trend: "text-white/90",
  },
  error: {
    bg: "bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700",
    iconBg: "bg-white/20",
    text: "text-white",
    subtext: "text-white/70",
    trend: "text-white/90",
  },
  neutral: {
    bg: "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800",
    iconBg: "bg-neutral-100 dark:bg-neutral-800",
    text: "text-neutral-900 dark:text-neutral-100",
    subtext: "text-neutral-500 dark:text-neutral-400",
    trend: "text-neutral-600 dark:text-neutral-400",
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel = "vs período anterior",
  variant = "primary",
  loading = false,
  className,
}: KPICardProps) {
  if (loading) {
    return <SkeletonKPICard />;
  }

  const styles = variantStyles[variant];
  const TrendIcon = trend === undefined ? Minus : trend >= 0 ? TrendingUp : TrendingDown;
  const trendColor = variant === "neutral"
    ? trend === undefined ? "" : trend >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
    : "";

  return (
    <motion.div
      className={cn(
        "rounded-2xl p-6 shadow-lg relative overflow-hidden",
        styles.bg,
        className
      )}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className={cn("text-sm font-medium mb-1", styles.subtext)}>{title}</p>
          <motion.p
            className={cn("text-3xl font-bold tracking-tight", styles.text)}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
          >
            {value}
          </motion.p>

          {subtitle && (
            <p className={cn("text-sm mt-1", styles.subtext)}>{subtitle}</p>
          )}

          {trend !== undefined && (
            <motion.div
              className={cn("flex items-center gap-1 mt-3", styles.trend, trendColor)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
              <span className={cn("text-xs", styles.subtext)}>{trendLabel}</span>
            </motion.div>
          )}
        </div>

        <motion.div
          className={cn("rounded-xl p-3", styles.iconBg)}
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Icon className={cn("h-7 w-7", styles.text)} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Compact version for smaller spaces
export function KPICardCompact({
  title,
  value,
  icon: Icon,
  trend,
  variant = "neutral",
  loading = false,
  className,
}: Omit<KPICardProps, "subtitle" | "trendLabel">) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            <div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const isNeutral = variant === "neutral";
  const iconColors = {
    primary: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    success: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    warning: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
    error: "text-red-600 bg-red-50 dark:bg-red-900/30",
    neutral: "text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800",
  };

  return (
    <motion.div
      className={cn(
        "rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4",
        "hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{value}</span>
            {trend !== undefined && (
              <span className={cn(
                "text-xs font-medium",
                trend >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div className={cn("p-2.5 rounded-lg", iconColors[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
