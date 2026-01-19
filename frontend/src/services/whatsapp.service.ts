import api from "./api";

export interface WhatsAppConfig {
  id?: string;
  enabled: boolean;
  phoneNumber: string | null;
  instanceName: string | null;
  evolutionApiUrl: string | null;
  evolutionApiKey?: string | null;
  authorizedPhones: string | null;
}

export interface ConnectionStatus {
  connected: boolean;
  state: string;
}

export interface ChatLog {
  id: string;
  phoneNumber: string;
  messageIn: string;
  messageOut: string | null;
  intent: string | null;
  createdAt: string;
  processedAt: string | null;
}

export const whatsAppService = {
  async getConfig(): Promise<WhatsAppConfig> {
    const response = await api.get("/api/whatsapp/config");
    return response.data.data;
  },

  async updateConfig(config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    const response = await api.put("/api/whatsapp/config", config);
    return response.data.data;
  },

  async testConnection(): Promise<ConnectionStatus> {
    const response = await api.post("/api/whatsapp/test-connection");
    return response.data.data;
  },

  async getChatHistory(limit: number = 50): Promise<ChatLog[]> {
    const response = await api.get(`/api/whatsapp/history?limit=${limit}`);
    return response.data.data;
  },
};
