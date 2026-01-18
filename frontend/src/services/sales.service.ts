import api from "./api";
import { Sale, PaginatedResponse } from "@/types/api.types";

export interface SalesFilter {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  productKey?: string;
  search?: string;
  gatewayId?: string;
}

export const salesService = {
  async list(filters: SalesFilter = {}): Promise<PaginatedResponse<Sale>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    });
    const response = await api.get(`/api/sales?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<Sale> {
    const response = await api.get(`/api/sales/${id}`);
    return response.data.data.sale;
  },

  async getStats(gatewayId?: string): Promise<unknown> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/sales/stats", { params });
    return response.data.data;
  },

  async getByStatus(gatewayId?: string): Promise<unknown> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/sales/by-status", { params });
    return response.data.data;
  },

  async getByProduct(gatewayId?: string): Promise<unknown> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/sales/by-product", { params });
    return response.data.data;
  },

  async getByPeriod(
    period: string = "last30days",
    gatewayId?: string
  ): Promise<unknown> {
    const params: Record<string, string> = { period };
    if (gatewayId) params.gatewayId = gatewayId;
    const response = await api.get("/api/sales/by-period", { params });
    return response.data.data;
  },

  async getRecent(limit: number = 10, gatewayId?: string): Promise<Sale[]> {
    const params: Record<string, string | number> = { limit };
    if (gatewayId) params.gatewayId = gatewayId;
    const response = await api.get("/api/sales/recent", { params });
    return response.data.data.sales;
  },
};
