'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  financialService,
  formatCurrency,
  Employee,
  EmployeeRole,
  EmployeeStatus,
  EMPLOYEE_ROLE_LABELS,
  EMPLOYEE_STATUS_LABELS,
} from '@/services/financial.service';
import { Plus, Pencil, Trash2, X, Users } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = Object.keys(EMPLOYEE_ROLE_LABELS) as EmployeeRole[];
const STATUSES = Object.keys(EMPLOYEE_STATUS_LABELS) as EmployeeStatus[];

function EmployeeModal({
  employee,
  onClose,
  onSave,
  isSaving,
}: {
  employee?: Employee | null;
  onClose: () => void;
  onSave: (data: Partial<Employee>) => void;
  isSaving?: boolean;
}) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    document: employee?.document || '',
    role: employee?.role || 'OUTROS',
    status: employee?.status || 'ATIVO',
    salary: employee?.salary ? employee.salary / 100 : 0,
    bonus: employee?.bonus ? employee.bonus / 100 : 0,
    benefits: employee?.benefits ? employee.benefits / 100 : 0,
    startDate: employee?.startDate ? employee.startDate.split('T')[0] : '',
    endDate: employee?.endDate ? employee.endDate.split('T')[0] : '',
    paymentDay: employee?.paymentDay || 5,
    notes: employee?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate) {
      toast.error('Data de início é obrigatória');
      return;
    }

    onSave({
      ...formData,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      document: formData.document || undefined,
      salary: Math.round(formData.salary * 100),
      bonus: Math.round(formData.bonus * 100),
      benefits: Math.round(formData.benefits * 100),
      startDate: new Date(formData.startDate + 'T12:00:00').toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate + 'T12:00:00').toISOString() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Telefone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">CPF/CNPJ</label>
            <input
              type="text"
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              placeholder="000.000.000-00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Cargo *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {EMPLOYEE_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {EMPLOYEE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Salário (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Bônus (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.bonus}
                onChange={(e) => setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Benefícios (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: parseFloat(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Data de Início *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Dia de Pagamento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.paymentDay}
                onChange={(e) => setFormData({ ...formData, paymentDay: parseInt(e.target.value) || 5 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Data de Saída</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
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

export default function FuncionariosPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    page: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () =>
      financialService.listEmployees({
        ...filters,
        role: filters.role || undefined,
        status: filters.status || undefined,
      } as Record<string, string | number>),
  });

  const { data: payroll } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => financialService.getPayroll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Employee>) => financialService.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Funcionário criado com sucesso!');
      setShowModal(false);
      setSelectedEmployee(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; details?: Array<{ message: string }> } } };
      const message = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Erro ao criar funcionário';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      financialService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Funcionário atualizado com sucesso!');
      setShowModal(false);
      setSelectedEmployee(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; details?: Array<{ message: string }> } } };
      const message = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Erro ao atualizar funcionário';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financialService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Funcionário excluído com sucesso!');
    },
    onError: () => toast.error('Erro ao excluir funcionário'),
  });

  const handleSave = (formData: Partial<Employee>) => {
    if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case 'ATIVO':
        return 'bg-emerald-900/50 text-emerald-400';
      case 'INATIVO':
        return 'bg-zinc-700 text-zinc-400';
      case 'FERIAS':
        return 'bg-blue-900/50 text-blue-400';
      case 'AFASTADO':
        return 'bg-amber-900/50 text-amber-400';
      default:
        return 'bg-zinc-700 text-zinc-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Funcionários</h1>
          <p className="text-zinc-400">Gerencie sua equipe</p>
        </div>
        <button
          onClick={() => {
            setSelectedEmployee(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition"
        >
          <Plus className="h-4 w-4" />
          Novo Funcionário
        </button>
      </div>

      {/* Payroll Summary */}
      {payroll && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-sm text-zinc-400">Salários</p>
            <p className="text-xl font-bold text-white">{formatCurrency(payroll.salaries)}</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-sm text-zinc-400">Bônus</p>
            <p className="text-xl font-bold text-white">{formatCurrency(payroll.bonuses)}</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-sm text-zinc-400">Benefícios</p>
            <p className="text-xl font-bold text-white">{formatCurrency(payroll.benefits)}</p>
          </div>
          <div className="rounded-xl border border-purple-700/50 bg-purple-900/20 p-4">
            <p className="text-sm text-zinc-400">Folha Total</p>
            <p className="text-xl font-bold text-white">{formatCurrency(payroll.total)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="">Todos os Cargos</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {EMPLOYEE_ROLE_LABELS[role]}
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
              {EMPLOYEE_STATUS_LABELS[status]}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Cargo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Salário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Total</th>
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
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                  Nenhum funcionário encontrado
                </td>
              </tr>
            ) : (
              data?.data.map((employee) => (
                <tr key={employee.id} className="hover:bg-zinc-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-purple-900/50 p-2">
                        <Users className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{employee.name}</div>
                        {employee.email && (
                          <div className="text-sm text-zinc-500">{employee.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {EMPLOYEE_ROLE_LABELS[employee.role]}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(employee.status)}`}>
                      {EMPLOYEE_STATUS_LABELS[employee.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">
                    {formatCurrency(employee.salary)}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    {formatCurrency(employee.salary + employee.bonus + employee.benefits)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="p-2 text-zinc-400 hover:text-white transition"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-zinc-400 hover:text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteMutation.isPending ? <span className="text-xs">Excluindo...</span> : <Trash2 className="h-4 w-4" />}
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
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(data.pagination.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setFilters({ ...filters, page: i + 1 })}
              className={`px-3 py-1 rounded ${
                filters.page === i + 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => {
            setShowModal(false);
            setSelectedEmployee(null);
          }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
