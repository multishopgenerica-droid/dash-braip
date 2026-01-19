import api from "./api";
import { Abandon, PaginatedResponse } from "@/types/api.types";

export interface AbandonsFilter {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  productKey?: string;
  search?: string;
  gatewayId?: string;
}

export const abandonsService = {
  async list(filters: AbandonsFilter = {}): Promise<PaginatedResponse<Abandon>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    });
    const response = await api.get(`/api/abandons?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<Abandon> {
    const response = await api.get(`/api/abandons/${id}`);
    return response.data.data.abandon;
  },

  async getStats(filters: AbandonsFilter = {}): Promise<unknown> {
    const params: Record<string, string> = {};
    if (filters.gatewayId) params.gatewayId = filters.gatewayId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    const response = await api.get("/api/abandons/stats", { params });
    return response.data.data;
  },

  async getByProduct(gatewayId?: string): Promise<unknown> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/abandons/by-product", { params });
    return response.data.data;
  },

  async getByPeriod(
    period: string = "last30days",
    gatewayId?: string
  ): Promise<unknown> {
    const params: Record<string, string> = { period };
    if (gatewayId) params.gatewayId = gatewayId;
    const response = await api.get("/api/abandons/by-period", { params });
    return response.data.data;
  },
};
