import api from "./api";

export interface OpenAIConfig {
  id?: string;
  enabled: boolean;
  apiKey: string | null;
  model: string;
  maxTokens: number;
  temperature: number;
  totalTokensUsed: number;
  totalRequests: number;
  lastUsedAt: string | null;
}

export interface ConnectionStatus {
  connected: boolean;
  error?: string;
}

export interface AnalysisResult {
  analysis: string;
  tokensUsed: number;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface UsageStats {
  totalTokensUsed: number;
  totalRequests: number;
  lastUsedAt: string | null;
}

export const openAIService = {
  async getConfig(): Promise<OpenAIConfig> {
    const response = await api.get("/api/openai/config");
    return response.data.data;
  },

  async updateConfig(config: Partial<OpenAIConfig>): Promise<OpenAIConfig> {
    const response = await api.put("/api/openai/config", config);
    return response.data.data;
  },

  async testConnection(): Promise<ConnectionStatus> {
    const response = await api.post("/api/openai/test-connection");
    return response.data.data;
  },

  async analyze(prompt: string, context?: string): Promise<AnalysisResult> {
    const response = await api.post("/api/openai/analyze", { prompt, context });
    if (!response.data.success) {
      throw new Error(response.data.error || "Analysis failed");
    }
    return response.data.data;
  },

  async getUsageStats(): Promise<UsageStats> {
    const response = await api.get("/api/openai/usage");
    return response.data.data;
  },

  async getAvailableModels(): Promise<AIModel[]> {
    const response = await api.get("/api/openai/models");
    return response.data.data;
  },
};
