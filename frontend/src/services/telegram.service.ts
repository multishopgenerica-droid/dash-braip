import api from "./api";

export interface TelegramConfig {
  id?: string;
  enabled: boolean;
  botToken: string | null;
  botUsername: string | null;
  webhookSecret?: string | null;
  authorizedUsers: string | null;
}

export interface ConnectionStatus {
  connected: boolean;
  username?: string;
}

export interface ChatLog {
  id: string;
  chatId: string;
  userId: string;
  username: string | null;
  firstName: string | null;
  messageIn: string;
  messageOut: string | null;
  intent: string | null;
  createdAt: string;
  processedAt: string | null;
}

export const telegramService = {
  async getConfig(): Promise<TelegramConfig> {
    const response = await api.get("/api/telegram/config");
    return response.data.data;
  },

  async updateConfig(config: Partial<TelegramConfig>): Promise<TelegramConfig> {
    const response = await api.put("/api/telegram/config", config);
    return response.data.data;
  },

  async setupWebhook(baseUrl: string): Promise<{ webhookUrl: string }> {
    const response = await api.post("/api/telegram/setup-webhook", { baseUrl });
    return response.data.data;
  },

  async testConnection(): Promise<ConnectionStatus> {
    const response = await api.post("/api/telegram/test-connection");
    return response.data.data;
  },

  async getChatHistory(limit: number = 50): Promise<ChatLog[]> {
    const response = await api.get(`/api/telegram/history?limit=${limit}`);
    return response.data.data;
  },
};
