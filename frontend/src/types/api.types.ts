export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER" | "VIEWER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface GatewayConfig {
  id: string;
  userId: string;
  gateway: "BRAIP" | "HOTMART" | "EDUZZ" | "KIWIFY" | "MONETIZZE";
  isActive: boolean;
  lastSync?: string;
  syncStatus: "PENDING" | "SYNCING" | "COMPLETED" | "ERROR";
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  transKey: string;
  productKey: string;
  productName: string;
  planName?: string;
  transValue: number;
  transTotalValue: number;
  transStatus: string;
  transStatusCode: number;
  paymentType: number;
  paymentDate?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  hasOrderBump: boolean;
  transCreateDate: string;
  transUpdateDate: string;
}

export interface Abandon {
  id: string;
  productKey: string;
  productName: string;
  planName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  transCreateDate: string;
}

export interface Product {
  id: string;
  productHash: string;
  name: string;
  description?: string;
  thumbnail?: string;
  totalSales: number;
  totalRevenue: number;
  totalAbandons: number;
  conversionRate: number;
}

export interface DashboardMetrics {
  sales: {
    total: number;
    approved: number;
    pending: number;
    canceled: number;
    chargebacks: number;
    refunds: number;
  };
  revenue: {
    total: number;
    approved: number;
    ticketMedio: number;
  };
  abandons: {
    total: number;
    today: number;
  };
  conversion: {
    rate: number;
    chargebackRate: number;
  };
  trends: {
    salesGrowth: number;
    revenueGrowth: number;
  };
}
