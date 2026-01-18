import api from "./api";
import { GatewayConfig } from "@/types/api.types";

export interface CreateGatewayDTO {
  gateway: "BRAIP" | "HOTMART" | "EDUZZ" | "KIWIFY" | "MONETIZZE";
  apiToken: string;
}

export interface UpdateGatewayDTO {
  apiToken?: string;
  isActive?: boolean;
}

export const gatewaysService = {
  async list(): Promise<GatewayConfig[]> {
    const response = await api.get("/api/gateways");
    return response.data.data.gateways;
  },

  async getById(id: string): Promise<GatewayConfig> {
    const response = await api.get(`/api/gateways/${id}`);
    return response.data.data.gateway;
  },

  async create(data: CreateGatewayDTO): Promise<GatewayConfig> {
    const response = await api.post("/api/gateways", data);
    return response.data.data.gateway;
  },

  async update(id: string, data: UpdateGatewayDTO): Promise<GatewayConfig> {
    const response = await api.put(`/api/gateways/${id}`, data);
    return response.data.data.gateway;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/gateways/${id}`);
  },

  async testConnection(id: string): Promise<boolean> {
    const response = await api.post(`/api/gateways/${id}/test`);
    return response.data.data.connected;
  },

  async getStatus(id: string): Promise<{ syncStatus: string; lastSync: string | null }> {
    const response = await api.get(`/api/gateways/${id}/status`);
    return response.data.data;
  },

  async triggerSync(id: string): Promise<void> {
    await api.post(`/api/gateways/${id}/sync`);
  },
};
