"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Plus,
  Trash2,
  Play,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
import {
  aiAnalysisService,
  CreateAiAnalysisDTO,
  AiAnalysisFilter,
} from "@/services/ai-analysis.service";
import { AiAnalysis, AiAnalysisType, AiAnalysisStatus } from "@/types/api.types";
import { formatDateTime } from "@/lib/utils";

const ANALYSIS_TYPES: { value: AiAnalysisType; label: string; description: string }[] = [
  { value: "SALES_TREND", label: "Tendencia de Vendas", description: "Analisa padroes e tendencias de vendas" },
  { value: "PRODUCT_PERFORMANCE", label: "Performance de Produtos", description: "Avalia desempenho de produtos" },
  { value: "CUSTOMER_BEHAVIOR", label: "Comportamento do Cliente", description: "Analisa padroes de comportamento" },
  { value: "CONVERSION_OPTIMIZATION", label: "Otimizacao de Conversao", description: "Sugere melhorias de conversao" },
  { value: "ABANDONMENT_ANALYSIS", label: "Analise de Abandonos", description: "Investiga causas de abandono" },
  { value: "REVENUE_FORECAST", label: "Previsao de Receita", description: "Projeta receita futura" },
  { value: "CUSTOM", label: "Personalizado", description: "Analise customizada" },
];

const STATUS_CONFIG: Record<AiAnalysisStatus, { icon: React.ReactNode; label: string; color: string }> = {
  PENDING: { icon: <Clock className="h-4 w-4" />, label: "Pendente", color: "text-yellow-500 bg-yellow-50" },
  PROCESSING: { icon: <Loader2 className="h-4 w-4 animate-spin" />, label: "Processando", color: "text-blue-500 bg-blue-50" },
  COMPLETED: { icon: <CheckCircle className="h-4 w-4" />, label: "Concluido", color: "text-green-500 bg-green-50" },
  FAILED: { icon: <XCircle className="h-4 w-4" />, label: "Falhou", color: "text-red-500 bg-red-50" },
};

export default function IaAnalysisPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState<AiAnalysis | null>(null);
  const [filters, setFilters] = useState<AiAnalysisFilter>({
    page: 1,
    limit: 10,
  });
  const [formData, setFormData] = useState<CreateAiAnalysisDTO>({
    title: "",
    description: "",
    type: "SALES_TREND",
    prompt: "",
  });
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["ai-analysis", filters],
    queryFn: () => aiAnalysisService.list(filters),
  });

  const createMutation = useMutation({
    mutationFn: aiAnalysisService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-analysis"] });
      setShowCreateModal(false);
      setFormData({ title: "", description: "", type: "SALES_TREND", prompt: "" });
      setError("");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError(err.response?.data?.error || "Erro ao criar analise");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: aiAnalysisService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-analysis"] });
    },
  });

  const executeMutation = useMutation({
    mutationFn: aiAnalysisService.execute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-analysis"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createMutation.mutate(formData);
  };

  const analyses = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analise com IA
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure analises inteligentes para seu dashboard
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Analise
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              value={filters.type || ""}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as AiAnalysisType || undefined, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos os tipos</option>
              {ANALYSIS_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos os status</option>
              <option value="PENDING">Pendente</option>
              <option value="PROCESSING">Processando</option>
              <option value="COMPLETED">Concluido</option>
              <option value="FAILED">Falhou</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analysis List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : analyses.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Titulo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analyses.map((analysis) => {
                    const typeInfo = ANALYSIS_TYPES.find((t) => t.value === analysis.type);
                    const statusInfo = STATUS_CONFIG[analysis.status];
                    return (
                      <tr key={analysis.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {analysis.title}
                              </p>
                              {analysis.description && (
                                <p className="text-sm text-gray-500 truncate max-w-xs">
                                  {analysis.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {typeInfo?.label || analysis.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDateTime(analysis.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {analysis.status === "COMPLETED" && analysis.result && (
                              <button
                                onClick={() => setShowResultModal(analysis)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Ver resultado"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            {(analysis.status === "PENDING" || analysis.status === "FAILED") && (
                              <button
                                onClick={() => executeMutation.mutate(analysis.id)}
                                disabled={executeMutation.isPending}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Executar"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm("Deseja remover esta analise?")) {
                                  deleteMutation.mutate(analysis.id);
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                    {pagination.total} resultados
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                      disabled={!pagination.hasPrevious}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                      disabled={!pagination.hasNext}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                    >
                      Proximo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma analise configurada
            </h3>
            <p className="text-gray-500 mb-4">
              Crie sua primeira analise com IA para obter insights
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nova Analise
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Nova Analise com IA
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titulo *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Analise de vendas do mes"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descricao
                </label>
                <input
                  type="text"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descricao da analise"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Analise *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AiAnalysisType })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {ANALYSIS_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {ANALYSIS_TYPES.find((t) => t.value === formData.type)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prompt / Instrucoes *
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="Descreva o que voce deseja analisar. Ex: Analise as vendas dos ultimos 30 dias e identifique padroes de comportamento dos clientes..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: "", description: "", type: "SALES_TREND", prompt: "" });
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Criando..." : "Criar Analise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {showResultModal.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {ANALYSIS_TYPES.find((t) => t.value === showResultModal.type)?.label}
                </p>
              </div>
              <button
                onClick={() => setShowResultModal(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt utilizado:
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
                  {showResultModal.prompt}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resultado da analise:
                </h3>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                      {showResultModal.result}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 pt-2">
                Atualizado em: {formatDateTime(showResultModal.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
