import api from "./api";
import { DashboardMetrics } from "@/types/api.types";

export const analyticsService = {
  async getDashboard(gatewayId?: string): Promise<DashboardMetrics> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/analytics/dashboard", { params });
    return response.data.data;
  },

  async getRevenue(
    period: string = "last30days",
    gatewayId?: string
  ): Promise<{ date: string; revenue: number }[]> {
    const params: Record<string, string> = { period };
    if (gatewayId) params.gatewayId = gatewayId;
    const response = await api.get("/api/analytics/revenue", { params });
    return response.data.data;
  },

  async getFunnel(gatewayId?: string): Promise<unknown> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/analytics/funnel", { params });
    return response.data.data;
  },

  async getComparison(gatewayId?: string): Promise<unknown> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/analytics/comparison", { params });
    return response.data.data;
  },

  async getRealtime(gatewayId?: string): Promise<unknown> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/analytics/realtime", { params });
    return response.data.data;
  },
};
