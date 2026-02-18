'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  financialService,
  formatCurrency,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  RecurrenceType,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  RECURRENCE_LABELS,
} from '@/services/financial.service';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];
const STATUSES = Object.keys(EXPENSE_STATUS_LABELS) as ExpenseStatus[];
const RECURRENCES = Object.keys(RECURRENCE_LABELS) as RecurrenceType[];

function ExpenseModal({
  expense,
  onClose,
  onSave,
  isSaving,
}: {
  expense?: Expense | null;
  onClose: () => void;
  onSave: (data: Partial<Expense>) => void;
  isSaving?: boolean;
}) {
  const [formData, setFormData] = useState({
    name: expense?.name || '',
    description: expense?.description || '',
    category: expense?.category || 'OUTROS',
    status: expense?.status || 'PENDENTE',
    amount: expense?.amount ? expense.amount / 100 : 0,
    dueDate: expense?.dueDate ? expense.dueDate.split('T')[0] : '',
    paidAt: expense?.paidAt ? expense.paidAt.split('T')[0] : '',
    recurrence: expense?.recurrence || 'UNICO',
    recurrenceEndDate: expense?.recurrenceEndDate ? expense.recurrenceEndDate.split('T')[0] : '',
    notes: expense?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    const amountInCents = Math.round(parseFloat(Number(formData.amount).toFixed(2)) * 100);
    onSave({
      ...formData,
      amount: amountInCents,
      dueDate: formData.dueDate ? new Date(formData.dueDate + 'T12:00:00').toISOString() : undefined,
      paidAt: formData.status === 'PAGO' && formData.paidAt ? new Date(formData.paidAt + 'T12:00:00').toISOString() : undefined,
      recurrenceEndDate: formData.recurrence !== 'UNICO' && formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate + 'T12:00:00').toISOString() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {expense ? 'Editar Gasto' : 'Novo Gasto'}
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
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {EXPENSE_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ExpenseStatus })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {EXPENSE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.status === 'PAGO' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Data de Pagamento *</label>
              <input
                type="date"
                value={formData.paidAt}
                onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Data de Vencimento</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
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

          {formData.recurrence !== 'UNICO' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Data Fim da Recorrência</label>
              <input
                type="date"
                value={formData.recurrenceEndDate}
                onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          )}

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

export default function GastosPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    page: 1,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () =>
      financialService.listExpenses({
        ...filters,
        category: filters.category || undefined,
        status: filters.status || undefined,
      } as Record<string, string | number>),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Expense>) => financialService.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      toast.success('Gasto criado com sucesso!');
      setShowModal(false);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; details?: Array<{ message: string }> } } };
      const message = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Erro ao criar gasto';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) =>
      financialService.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      toast.success('Gasto atualizado com sucesso!');
      setShowModal(false);
      setSelectedExpense(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; details?: Array<{ message: string }> } } };
      const message = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Erro ao atualizar gasto';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financialService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      toast.success('Gasto excluído com sucesso!');
    },
    onError: () => toast.error('Erro ao excluir gasto'),
  });

  const handleSave = (formData: Partial<Expense>) => {
    if (selectedExpense) {
      updateMutation.mutate({ id: selectedExpense.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    toast('Tem certeza que deseja excluir este gasto?', {
      action: {
        label: 'Excluir',
        onClick: () => deleteMutation.mutate(id),
      },
    });
  };

  const getStatusColor = (status: ExpenseStatus) => {
    switch (status) {
      case 'PAGO':
        return 'bg-emerald-900/50 text-emerald-400';
      case 'PENDENTE':
        return 'bg-amber-900/50 text-amber-400';
      case 'VENCIDO':
        return 'bg-red-900/50 text-red-400';
      case 'CANCELADO':
        return 'bg-zinc-700 text-zinc-400';
      default:
        return 'bg-zinc-700 text-zinc-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gastos</h1>
          <p className="text-zinc-400">Gerencie suas despesas</p>
        </div>
        <button
          onClick={() => {
            setSelectedExpense(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition"
        >
          <Plus className="h-4 w-4" />
          Novo Gasto
        </button>
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
              {EXPENSE_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="">Todos os Status</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {EXPENSE_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Vencimento</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                  Carregando...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-red-400">
                  Erro ao carregar gastos. Tente novamente mais tarde.
                </td>
              </tr>
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                  Nenhum gasto encontrado
                </td>
              </tr>
            ) : (
              data?.data.map((expense) => (
                <tr key={expense.id} className="hover:bg-zinc-800/50">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{expense.name}</div>
                    {expense.description && (
                      <div className="text-sm text-zinc-500">{expense.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {EXPENSE_CATEGORY_LABELS[expense.category]}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(expense.status)}`}>
                      {EXPENSE_STATUS_LABELS[expense.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {expense.dueDate
                      ? new Date(expense.dueDate).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 text-zinc-400 hover:text-white transition"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (() => {
        const totalPages = data.pagination.totalPages;
        const currentPage = filters.page;
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = startPage + maxVisible - 1;
        if (endPage > totalPages) {
          endPage = totalPages;
          startPage = Math.max(1, endPage - maxVisible + 1);
        }
        const pages = [];
        for (let i = startPage; i <= endPage; i++) pages.push(i);

        return (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setFilters({ ...filters, page: currentPage - 1 })}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => setFilters({ ...filters, page })}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setFilters({ ...filters, page: currentPage + 1 })}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proximo
            </button>
          </div>
        );
      })()}

      {showModal && (
        <ExpenseModal
          expense={selectedExpense}
          onClose={() => {
            setShowModal(false);
            setSelectedExpense(null);
          }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
