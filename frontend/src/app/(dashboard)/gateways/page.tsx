"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plug,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { gatewaysService, CreateGatewayDTO } from "@/services/gateways.service";
import { formatDateTime } from "@/lib/utils";

const GATEWAY_OPTIONS = [
  { value: "BRAIP", label: "Braip", color: "bg-blue-500" },
  { value: "HOTMART", label: "Hotmart", color: "bg-orange-500" },
  { value: "EDUZZ", label: "Eduzz", color: "bg-purple-500" },
  { value: "KIWIFY", label: "Kiwify", color: "bg-green-500" },
  { value: "MONETIZZE", label: "Monetizze", color: "bg-red-500" },
];

const STATUS_ICONS = {
  PENDING: <Clock className="h-4 w-4 text-yellow-500" />,
  SYNCING: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
  COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
  ERROR: <XCircle className="h-4 w-4 text-red-500" />,
};

export default function GatewaysPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateGatewayDTO>({
    gateway: "BRAIP",
    apiToken: "",
  });
  const [error, setError] = useState("");

  const { data: gateways, isLoading } = useQuery({
    queryKey: ["gateways"],
    queryFn: gatewaysService.list,
  });

  const createMutation = useMutation({
    mutationFn: gatewaysService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateways"] });
      setShowModal(false);
      setFormData({ gateway: "BRAIP", apiToken: "" });
      setError("");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError(err.response?.data?.error || "Erro ao adicionar gateway");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gatewaysService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateways"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: gatewaysService.triggerSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateways"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gateways de Pagamento
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure suas integracoes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Adicionar Gateway
        </button>
      </div>

      {/* Gateways List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : gateways && gateways.length > 0 ? (
          gateways.map((gateway) => {
            const gatewayInfo = GATEWAY_OPTIONS.find(
              (g) => g.value === gateway.gateway
            );
            return (
              <div
                key={gateway.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 ${gatewayInfo?.color || "bg-gray-500"} rounded-lg flex items-center justify-center`}
                    >
                      <Plug className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {gatewayInfo?.label || gateway.gateway}
                      </h3>
                      <div className="flex items-center gap-1 text-sm">
                        {STATUS_ICONS[gateway.syncStatus as keyof typeof STATUS_ICONS]}
                        <span className="text-gray-500">
                          {gateway.syncStatus === "COMPLETED"
                            ? "Sincronizado"
                            : gateway.syncStatus === "SYNCING"
                            ? "Sincronizando..."
                            : gateway.syncStatus === "ERROR"
                            ? "Erro"
                            : "Pendente"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      gateway.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {gateway.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {gateway.lastSync && (
                  <p className="text-sm text-gray-500 mb-4">
                    Ultima sincronizacao: {formatDateTime(gateway.lastSync)}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => syncMutation.mutate(gateway.id)}
                    disabled={syncMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        syncMutation.isPending ? "animate-spin" : ""
                      }`}
                    />
                    Sincronizar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Deseja remover este gateway?")) {
                        deleteMutation.mutate(gateway.id);
                      }
                    }}
                    className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum gateway configurado
            </h3>
            <p className="text-gray-500 mb-4">
              Adicione um gateway para comecar a sincronizar suas vendas
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Adicionar Gateway
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Adicionar Gateway
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gateway
                </label>
                <select
                  value={formData.gateway}
                  onChange={(e) =>
                    setFormData({ ...formData, gateway: e.target.value as CreateGatewayDTO["gateway"] })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {GATEWAY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Token da API
                </label>
                <textarea
                  value={formData.apiToken}
                  onChange={(e) =>
                    setFormData({ ...formData, apiToken: e.target.value })
                  }
                  placeholder="Cole seu token de API aqui"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ gateway: "BRAIP", apiToken: "" });
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
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
