import api from "./api";
import { AiAnalysis, AiAnalysisType, PaginatedResponse } from "@/types/api.types";

export interface CreateAiAnalysisDTO {
  title: string;
  description?: string;
  type: AiAnalysisType;
  prompt: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateAiAnalysisDTO {
  title?: string;
  description?: string;
  prompt?: string;
  result?: string;
}

export interface AiAnalysisFilter {
  page?: number;
  limit?: number;
  type?: AiAnalysisType;
  status?: string;
}

export const aiAnalysisService = {
  async list(filters: AiAnalysisFilter = {}): Promise<PaginatedResponse<AiAnalysis>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    });
    const response = await api.get(`/api/ai-analysis?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<AiAnalysis> {
    const response = await api.get(`/api/ai-analysis/${id}`);
    return response.data.data.analysis;
  },

  async create(data: CreateAiAnalysisDTO): Promise<AiAnalysis> {
    const response = await api.post("/api/ai-analysis", data);
    return response.data.data.analysis;
  },

  async update(id: string, data: UpdateAiAnalysisDTO): Promise<AiAnalysis> {
    const response = await api.put(`/api/ai-analysis/${id}`, data);
    return response.data.data.analysis;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/ai-analysis/${id}`);
  },

  async execute(id: string): Promise<AiAnalysis> {
    const response = await api.post(`/api/ai-analysis/${id}/execute`);
    return response.data.data.analysis;
  },
};
