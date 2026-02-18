'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  financialService,
  formatCurrency,
  Tool,
  ToolCategory,
  RecurrenceType,
  TOOL_CATEGORY_LABELS,
  RECURRENCE_LABELS,
} from '@/services/financial.service';
import { Plus, Pencil, Trash2, X, ExternalLink, Wrench } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = Object.keys(TOOL_CATEGORY_LABELS) as ToolCategory[];
const RECURRENCES = Object.keys(RECURRENCE_LABELS) as RecurrenceType[];

function ToolModal({
  tool,
  onClose,
  onSave,
  isSaving,
}: {
  tool?: Tool | null;
  onClose: () => void;
  onSave: (data: Partial<Tool>) => void;
  isSaving?: boolean;
}) {
  const [formData, setFormData] = useState({
    name: tool?.name || '',
    description: tool?.description || '',
    category: tool?.category || 'OUTROS',
    monthlyCost: tool?.monthlyCost ? tool.monthlyCost / 100 : 0,
    annualCost: tool?.annualCost ? tool.annualCost / 100 : 0,
    recurrence: tool?.recurrence || 'MENSAL',
    billingDate: tool?.billingDate ? tool.billingDate.split('T')[0] : '',
    isActive: tool?.isActive ?? true,
    loginUrl: tool?.loginUrl || '',
    notes: tool?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      monthlyCost: Math.round(formData.monthlyCost * 100),
      annualCost: typeof formData.annualCost === 'number' ? Math.round(formData.annualCost * 100) : undefined,
      billingDate: formData.billingDate ? new Date(formData.billingDate + 'T12:00:00').toISOString() : undefined,
      loginUrl: formData.loginUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {tool ? 'Editar Ferramenta' : 'Nova Ferramenta'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Categoria *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ToolCategory })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {TOOL_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Recorrência</label>
              <select
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as RecurrenceType })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              >
                {RECURRENCES.map((rec) => (
                  <option key={rec} value={rec}>
                    {RECURRENCE_LABELS[rec]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Custo Mensal (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monthlyCost}
                onChange={(e) => setFormData({ ...formData, monthlyCost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Custo Anual (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.annualCost}
                onChange={(e) => setFormData({ ...formData, annualCost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Próxima Cobrança</label>
              <input
                type="date"
                value={formData.billingDate}
                onChange={(e) => setFormData({ ...formData, billingDate: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-zinc-800 border-zinc-700"
                />
                <span className="text-white">Ativa</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">URL de Login</label>
            <input
              type="url"
              value={formData.loginUrl}
              onChange={(e) => setFormData({ ...formData, loginUrl: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              placeholder="https://"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FerramentasPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    isActive: '',
    page: 1,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tools', filters],
    queryFn: () =>
      financialService.listTools({
        ...filters,
        category: filters.category || undefined,
        isActive: filters.isActive === '' ? undefined : filters.isActive === 'true',
      } as Record<string, string | number | boolean>),
  });

  const { data: costData, isLoading: costLoading, isError: costError } = useQuery({
    queryKey: ['tools-cost'],
    queryFn: () => financialService.getToolsCost(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Tool>) => financialService.createTool(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.invalidateQueries({ queryKey: ['tools-cost'] });
      toast.success('Ferramenta criada com sucesso!');
      setShowModal(false);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; details?: Array<{ message: string }> } } };
      const message = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Erro ao criar ferramenta';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tool> }) =>
      financialService.updateTool(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.invalidateQueries({ queryKey: ['tools-cost'] });
      toast.success('Ferramenta atualizada com sucesso!');
      setShowModal(false);
      setSelectedTool(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; details?: Array<{ message: string }> } } };
      const message = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Erro ao atualizar ferramenta';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financialService.deleteTool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.invalidateQueries({ queryKey: ['tools-cost'] });
      toast.success('Ferramenta excluída com sucesso!');
    },
    onError: () => toast.error('Erro ao excluir ferramenta'),
  });

  const handleSave = (formData: Partial<Tool>) => {
    if (selectedTool) {
      updateMutation.mutate({ id: selectedTool.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (tool: Tool) => {
    setSelectedTool(tool);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    toast('Tem certeza que deseja excluir esta ferramenta?', {
      action: {
        label: 'Excluir',
        onClick: () => deleteMutation.mutate(id),
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ferramentas</h1>
          <p className="text-zinc-400">Gerencie suas assinaturas e softwares</p>
        </div>
        <button
          onClick={() => {
            setSelectedTool(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition"
        >
          <Plus className="h-4 w-4" />
          Nova Ferramenta
        </button>
      </div>

      {/* Cost Summary */}
      <div className="rounded-xl border border-amber-700/50 bg-amber-900/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Custo Mensal Total (Ferramentas Ativas)</p>
            <p className="text-3xl font-bold text-white mt-1">
              {costLoading
                ? 'Carregando...'
                : costError
                  ? 'Erro ao calcular'
                  : formatCurrency(costData?.monthlyCost || 0)}
            </p>
          </div>
          <div className="rounded-full bg-amber-900/50 p-4">
            <Wrench className="h-8 w-8 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="">Todas as Categorias</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {TOOL_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>

        <select
          value={filters.isActive}
          onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="">Todas</option>
          <option value="true">Ativas</option>
          <option value="false">Inativas</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isError ? (
          <div className="col-span-full text-center text-red-400 py-12">
            Erro ao carregar ferramentas. Tente novamente.
          </div>
        ) : isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-zinc-800 rounded-xl animate-pulse" />
          ))
        ) : data?.data.length === 0 ? (
          <div className="col-span-full text-center text-zinc-400 py-12">
            Nenhuma ferramenta encontrada
          </div>
        ) : (
          data?.data.map((tool) => (
            <div
              key={tool.id}
              className={`rounded-xl border p-5 ${
                tool.isActive
                  ? 'border-zinc-700 bg-zinc-800/50'
                  : 'border-zinc-800 bg-zinc-900/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-900/50 p-2">
                    <Wrench className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{tool.name}</h3>
                    <p className="text-sm text-zinc-500">
                      {TOOL_CATEGORY_LABELS[tool.category]}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {tool.loginUrl && (
                    <a
                      href={tool.loginUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-zinc-400 hover:text-white transition"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(tool)}
                    className="p-1.5 text-zinc-400 hover:text-white transition"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tool.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-zinc-400 hover:text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {tool.description && (
                <p className="mt-3 text-sm text-zinc-400 line-clamp-2">{tool.description}</p>
              )}

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {tool.recurrence === 'ANUAL' && tool.annualCost
                      ? formatCurrency(tool.annualCost)
                      : formatCurrency(tool.monthlyCost)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {tool.recurrence === 'ANUAL' && tool.annualCost
                      ? `${RECURRENCE_LABELS[tool.recurrence]} (${formatCurrency(Math.round(tool.annualCost / 12))}/mes)`
                      : RECURRENCE_LABELS[tool.recurrence]}
                  </p>
                </div>
                {!tool.isActive && (
                  <span className="text-xs bg-zinc-700 text-zinc-400 px-2 py-1 rounded">
                    Inativa
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (() => {
        const totalPages = data.pagination.totalPages;
        const currentPage = filters.page;
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        const endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage + 1 < maxButtons) {
          startPage = Math.max(1, endPage - maxButtons + 1);
        }
        const pages: number[] = [];
        for (let i = startPage; i <= endPage; i++) pages.push(i);

        return (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setFilters({ ...filters, page: currentPage - 1 })}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => setFilters({ ...filters, page: p })}
                className={`px-3 py-1 rounded ${
                  currentPage === p
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setFilters({ ...filters, page: currentPage + 1 })}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Proximo
            </button>
          </div>
        );
      })()}

      {showModal && (
        <ToolModal
          tool={selectedTool}
          onClose={() => {
            setShowModal(false);
            setSelectedTool(null);
          }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
